// Turns an uploaded layout image (a diagram/photo of a court or field) into
// a set of line paths the robot can paint. This is a heuristic pipeline
// (local-contrast line detection -> skeleton thinning -> junction-aware
// segment tracing -> smoothing), not a full vectorizer -- it works well for
// clean diagrams (line art, scanned floor plans, illustrated courts with
// painted white markings on a colored surface) and less well for busy
// photos or very low-contrast scans.
//
// Line detection specifically looks for pixels that are locally brighter or
// darker than their immediate surroundings (a small box-blur subtracted
// from the raw pixel), rather than a flat global edge threshold. That
// matters for real layout diagrams: a plain global-contrast edge detector
// fires on every color boundary in an illustration (track-to-infield,
// shading, gradients), not just the painted lines, which is what produced
// scribbly, noise-heavy traces on colorful diagrams. Local contrast largely
// ignores broad, slow color transitions and lights up specifically on thin
// marks -- which is what an actual line is, regardless of the color of the
// surface it's painted on.
//
// Traced paths are returned in a NORMALIZED local frame: x and y each range
// roughly over [-0.5, 0.5], representing fractional position within the
// image's own width/height, with y flipped so "up" in the image is
// positive y. The caller scales x by the target field length and y by the
// target field width to fit the traced shape into an actual site.

export interface NormalizedPoint {
  x: number;
  y: number;
}

const GRID_COLS = 140;
const LOCAL_CONTRAST_RADIUS = 3;
const MIN_COMPONENT_SIZE = 4;
const MAX_PATHS = 60;
// Thinning a stroke that's more than 1px wide after downsampling (common
// near corners and anti-aliased curves) tends to leave short spurious
// "hairs" jutting off the real skeleton at junctions. Segments shorter than
// this are almost always that noise, not an intentional short mark.
const MIN_SEGMENT_LENGTH = 5;
// Passes of light corner-preserving averaging applied to each traced path
// after simplification, to smooth pixel-grid jaggedness into cleaner curves.
const SMOOTHING_PASSES = 2;

type Cell = readonly [number, number];

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image file.'));
    };
    img.src = url;
  });
}

// Zhang-Suen thinning: reduces thick edge blobs down to a 1-pixel-wide
// skeleton so that "is this a junction, a straight run, or an endpoint"
// (its degree) becomes a meaningful, reliable signal instead of just
// reflecting stroke thickness.
function thinSkeleton(on: Uint8Array, cols: number, rows: number): void {
  const get = (x: number, y: number) => (x < 0 || y < 0 || x >= cols || y >= rows ? 0 : on[y * cols + x]);

  let changed = true;
  let guard = 0;
  while (changed && guard < 200) {
    changed = false;
    guard++;
    for (const step of [0, 1]) {
      const toRemove: number[] = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (!get(x, y)) continue;
          const p2 = get(x, y - 1);
          const p3 = get(x + 1, y - 1);
          const p4 = get(x + 1, y);
          const p5 = get(x + 1, y + 1);
          const p6 = get(x, y + 1);
          const p7 = get(x - 1, y + 1);
          const p8 = get(x - 1, y);
          const p9 = get(x - 1, y - 1);
          const ring = [p2, p3, p4, p5, p6, p7, p8, p9];
          const blackNeighbors = ring.reduce((a, b) => a + b, 0);
          if (blackNeighbors < 2 || blackNeighbors > 6) continue;

          let transitions = 0;
          for (let i = 0; i < 8; i++) {
            if (ring[i] === 0 && ring[(i + 1) % 8] === 1) transitions++;
          }
          if (transitions !== 1) continue;

          if (step === 0) {
            if (p2 * p4 * p6 !== 0) continue;
            if (p4 * p6 * p8 !== 0) continue;
          } else {
            if (p2 * p4 * p8 !== 0) continue;
            if (p2 * p6 * p8 !== 0) continue;
          }
          toRemove.push(y * cols + x);
        }
      }
      if (toRemove.length > 0) {
        changed = true;
        for (const i of toRemove) on[i] = 0;
      }
    }
  }
}

// Separable box blur (two 1D passes) -- used to get each pixel's local
// neighborhood average so we can measure how much a pixel stands out from
// its immediate surroundings, independent of the surrounding region's own
// (possibly quite different, possibly gradient-shaded) base color.
function boxBlur(values: Float32Array, cols: number, rows: number, radius: number): Float32Array {
  const windowSize = radius * 2 + 1;
  const temp = new Float32Array(cols * rows);

  for (let y = 0; y < rows; y++) {
    const rowOffset = y * cols;
    let sum = 0;
    for (let x = -radius; x <= radius; x++) sum += values[rowOffset + Math.min(Math.max(x, 0), cols - 1)];
    temp[rowOffset] = sum / windowSize;
    for (let x = 1; x < cols; x++) {
      const addX = Math.min(x + radius, cols - 1);
      const remX = Math.max(x - radius - 1, 0);
      sum += values[rowOffset + addX] - values[rowOffset + remX];
      temp[rowOffset + x] = sum / windowSize;
    }
  }

  const result = new Float32Array(cols * rows);
  for (let x = 0; x < cols; x++) {
    let sum = 0;
    for (let y = -radius; y <= radius; y++) sum += temp[Math.min(Math.max(y, 0), rows - 1) * cols + x];
    result[x] = sum / windowSize;
    for (let y = 1; y < rows; y++) {
      const addY = Math.min(y + radius, rows - 1);
      const remY = Math.max(y - radius - 1, 0);
      sum += temp[addY * cols + x] - temp[remY * cols + x];
      result[y * cols + x] = sum / windowSize;
    }
  }

  return result;
}

// Averages each interior point with its neighbors a couple of times to turn
// a jagged, pixel-grid-aligned traced path into a visually cleaner curve.
// Endpoints are left untouched so segments still meet cleanly at junctions.
function smoothPath(points: NormalizedPoint[], iterations: number): NormalizedPoint[] {
  let pts = points;
  for (let iter = 0; iter < iterations; iter++) {
    if (pts.length < 3) break;
    const next: NormalizedPoint[] = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
      next.push({
        x: (pts[i - 1].x + 2 * pts[i].x + pts[i + 1].x) / 4,
        y: (pts[i - 1].y + 2 * pts[i].y + pts[i + 1].y) / 4,
      });
    }
    next.push(pts[pts.length - 1]);
    pts = next;
  }
  return pts;
}

function cellKey(c: Cell): string {
  return `${c[0]},${c[1]}`;
}

function buildNeighborMap(cells: Cell[]): Map<string, Cell[]> {
  const cellSet = new Set(cells.map(cellKey));
  const neighbors = new Map<string, Cell[]>();
  for (const [x, y] of cells) {
    const list: Cell[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const n: Cell = [x + dx, y + dy];
        if (cellSet.has(cellKey(n))) list.push(n);
      }
    }
    neighbors.set(cellKey([x, y]), list);
  }
  return neighbors;
}

// Splits one connected blob of skeleton pixels into individual line
// segments, breaking at junctions (degree >= 3) and endpoints (degree <= 1)
// rather than treating the whole blob as one meandering path -- this is
// what lets a center line that touches the boundary, or a penalty box that
// touches the goal line, come out as separate strokes instead of one tangle.
function extractSegments(cells: Cell[]): Cell[][] {
  const neighbors = buildNeighborMap(cells);
  const degree = (c: Cell) => neighbors.get(cellKey(c))?.length ?? 0;

  const branchKeys = new Set(cells.filter((c) => degree(c) >= 3).map(cellKey));
  const endpointKeys = new Set(cells.filter((c) => degree(c) <= 1).map(cellKey));
  const seeds = cells.filter((c) => branchKeys.has(cellKey(c)) || endpointKeys.has(cellKey(c)));

  const visitedEdges = new Set<string>();
  const edgeKey = (a: Cell, b: Cell) => {
    const ka = cellKey(a);
    const kb = cellKey(b);
    return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
  };

  const segments: Cell[][] = [];

  const walk = (start: Cell, first: Cell) => {
    const path: Cell[] = [start, first];
    visitedEdges.add(edgeKey(start, first));
    let prev = start;
    let curr = first;
    let steps = 1;
    while (true) {
      const currKey = cellKey(curr);
      if (steps > 1 && (branchKeys.has(currKey) || endpointKeys.has(currKey))) break;
      const nbrs = neighbors.get(currKey) ?? [];
      const next = nbrs.find((n) => cellKey(n) !== cellKey(prev) && !visitedEdges.has(edgeKey(curr, n)));
      if (!next) break;
      visitedEdges.add(edgeKey(curr, next));
      path.push(next);
      prev = curr;
      curr = next;
      steps++;
    }
    segments.push(path);
  };

  for (const seed of seeds) {
    const nbrs = neighbors.get(cellKey(seed)) ?? [];
    for (const n of nbrs) {
      if (!visitedEdges.has(edgeKey(seed, n))) walk(seed, n);
    }
  }

  // A component with no junctions or endpoints is a pure closed loop (e.g. a
  // circle, or a rectangle with nothing else touching it) -- walk it whole.
  if (segments.length === 0 && cells.length > 0) {
    const start = cells[0];
    const nbrs = neighbors.get(cellKey(start)) ?? [];
    if (nbrs.length > 0) walk(start, nbrs[0]);
  }

  return segments.filter((s) => s.length >= 2);
}

function simplifyPath(path: Cell[], everyN: number): Cell[] {
  if (path.length <= 2) return path;
  const simplified: Cell[] = [path[0]];
  for (let i = everyN; i < path.length - 1; i += everyN) simplified.push(path[i]);
  simplified.push(path[path.length - 1]);
  return simplified;
}

export async function traceImageToPaths(file: File): Promise<NormalizedPoint[][]> {
  const img = await loadImageFromFile(file);
  const cols = GRID_COLS;
  const rows = Math.max(8, Math.round(cols * (img.height / img.width)));

  const canvas = document.createElement('canvas');
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');
  ctx.drawImage(img, 0, 0, cols, rows);
  const { data } = ctx.getImageData(0, 0, cols, rows);

  const gray = new Float32Array(cols * rows);
  for (let i = 0; i < cols * rows; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }

  // How far each pixel departs from its own local neighborhood average.
  // Thin painted lines depart sharply; broad color regions and soft
  // gradients (a track's fill, shading) barely depart at all, since the
  // blur radius washes them out along with the line -- so this responds
  // specifically to marks, not to every color boundary in the artwork.
  const localMean = boxBlur(gray, cols, rows, LOCAL_CONTRAST_RADIUS);
  const contrast = new Float32Array(cols * rows);
  for (let i = 0; i < cols * rows; i++) contrast[i] = Math.abs(gray[i] - localMean[i]);

  let sum = 0;
  for (const v of contrast) sum += v;
  const mean = sum / contrast.length;
  let variance = 0;
  for (const v of contrast) variance += (v - mean) ** 2;
  const std = Math.sqrt(variance / contrast.length);
  const threshold = mean + std * 1.1;

  // A sharp boundary between two saturated fill colors (track edge against
  // its background, track against infield) can be just as locally
  // contrasty as a genuine painted line, so contrast alone can't tell them
  // apart. What does: every stroke of an intentional line/marking is drawn
  // in the SAME ink color, so its pixels cluster tightly on one gray value;
  // fill-to-fill boundaries are anti-aliased blends that vary continuously
  // depending on which two regions happen to meet, so they're spread thin
  // across many gray values. Building a histogram of the high-contrast
  // candidate pixels and keeping only the ones near its dominant peak finds
  // the actual "ink" -- whatever color it happens to be, white, black, red,
  // or anything else -- without assuming a polarity up front.
  const bucketCount = 26;
  const bucketSize = 256 / bucketCount;
  const histogram = new Float32Array(bucketCount);
  for (let i = 0; i < contrast.length; i++) {
    if (contrast[i] > threshold) {
      const bucket = Math.min(bucketCount - 1, Math.floor(gray[i] / bucketSize));
      histogram[bucket]++;
    }
  }
  let peakBucket = 0;
  let peakCount = 0;
  for (let b = 0; b < bucketCount; b++) {
    if (histogram[b] > peakCount) {
      peakCount = histogram[b];
      peakBucket = b;
    }
  }
  const inkGray = peakBucket * bucketSize + bucketSize / 2;
  const INK_TOLERANCE = 45;

  const on = new Uint8Array(cols * rows);
  for (let i = 0; i < contrast.length; i++) {
    on[i] = contrast[i] > threshold && Math.abs(gray[i] - inkGray) < INK_TOLERANCE ? 1 : 0;
  }

  thinSkeleton(on, cols, rows);

  const visited = new Uint8Array(cols * rows);
  const components: Cell[][] = [];
  const idx = (x: number, y: number) => y * cols + x;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = idx(x, y);
      if (!on[i] || visited[i]) continue;

      const stack: Cell[] = [[x, y]];
      visited[i] = 1;
      const cells: Cell[] = [];
      while (stack.length) {
        const [cx, cy] = stack.pop()!;
        cells.push([cx, cy]);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
            const ni = idx(nx, ny);
            if (on[ni] && !visited[ni]) {
              visited[ni] = 1;
              stack.push([nx, ny]);
            }
          }
        }
      }
      if (cells.length >= MIN_COMPONENT_SIZE) components.push(cells);
    }
  }

  let allSegments: Cell[][] = [];
  for (const component of components) {
    allSegments.push(...extractSegments(component));
  }

  allSegments = allSegments.filter((s) => s.length >= MIN_SEGMENT_LENGTH);

  // Keep the longest strokes -- a busy/noisy source image can produce far
  // more fragments than are useful to paint.
  allSegments.sort((a, b) => b.length - a.length);
  const kept = allSegments.slice(0, MAX_PATHS);

  const paths: NormalizedPoint[][] = [];
  for (const segment of kept) {
    const simplified = simplifyPath(segment, Math.max(1, Math.floor(segment.length / 30)));
    const normalized = simplified.map(([gx, gy]) => ({
      x: (gx + 0.5) / cols - 0.5,
      y: 0.5 - (gy + 0.5) / rows,
    }));
    paths.push(
      smoothPath(normalized, SMOOTHING_PASSES),
    );
  }

  return paths;
}
