import area from '@turf/area';
import bbox from '@turf/bbox';
import bearing from '@turf/bearing';
import centroid from '@turf/centroid';
import distance from '@turf/distance';
import length from '@turf/length';
import { polygon as turfPolygon } from '@turf/helpers';
import type { Feature, Polygon } from 'geojson';
import type { GeoCoordinate, PolygonMetrics } from '@/types';

function toPosition(coord: GeoCoordinate): [number, number] {
  return [coord.lng, coord.lat];
}

export function coordsToGeoJson(coords: GeoCoordinate[]): Feature<Polygon> {
  const ring = coords.map((c) => [c.lng, c.lat]);
  if (ring.length > 0) {
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push([...first]);
    }
  }
  return turfPolygon([ring]);
}

export function geoJsonToCoords(feature: Feature<Polygon>): GeoCoordinate[] {
  const ring = feature.geometry.coordinates[0];
  return ring.slice(0, -1).map(([lng, lat]) => ({ lat, lng }));
}

// Local flat-earth (equirectangular) projection around `origin`, accurate
// enough for the scale of a sports field/site (a few hundred meters).
function toLocalXY(coord: GeoCoordinate, origin: GeoCoordinate): { x: number; y: number } {
  const R = 6371000;
  const latRad = (origin.lat * Math.PI) / 180;
  const dLat = ((coord.lat - origin.lat) * Math.PI) / 180;
  const dLng = ((coord.lng - origin.lng) * Math.PI) / 180;
  return { x: dLng * Math.cos(latRad) * R, y: dLat * R };
}

function fromLocalXY(point: { x: number; y: number }, origin: GeoCoordinate): GeoCoordinate {
  const R = 6371000;
  const latRad = (origin.lat * Math.PI) / 180;
  return {
    lat: origin.lat + (point.y / R) * (180 / Math.PI),
    lng: origin.lng + (point.x / (R * Math.cos(latRad))) * (180 / Math.PI),
  };
}

function convexHull(points: { x: number; y: number }[]): { x: number; y: number }[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: typeof pts = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: typeof pts = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

// Rotating-calipers minimum-area bounding rectangle. Unlike an axis-aligned
// bounding box, this hugs a rotated polygon (e.g. a field drawn at an angle
// to true north) instead of over-sizing it -- a generated layout sized off
// an axis-aligned box can extend well past the actual drawn boundary.
function minAreaRect(hull: { x: number; y: number }[]) {
  let best = { area: Infinity, angle: 0, minX: 0, maxX: 0, minY: 0, maxY: 0 };
  for (let i = 0; i < hull.length; i++) {
    const p1 = hull[i];
    const p2 = hull[(i + 1) % hull.length];
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of hull) {
      const rx = p.x * cos - p.y * sin;
      const ry = p.x * sin + p.y * cos;
      minX = Math.min(minX, rx);
      maxX = Math.max(maxX, rx);
      minY = Math.min(minY, ry);
      maxY = Math.max(maxY, ry);
    }

    const rectArea = (maxX - minX) * (maxY - minY);
    if (rectArea < best.area) best = { area: rectArea, angle, minX, maxX, minY, maxY };
  }
  return best;
}

export function calculatePolygonMetrics(coords: GeoCoordinate[]): PolygonMetrics | null {
  if (coords.length < 3) return null;

  const feature = coordsToGeoJson(coords);
  const areaSqM = area(feature);
  const perimeterM = length(feature, { units: 'meters' });
  const center = centroid(feature);
  const polygonCentroid = { lat: center.geometry.coordinates[1], lng: center.geometry.coordinates[0] };

  const localPoints = coords.map((c) => toLocalXY(c, polygonCentroid));
  const hull = convexHull(localPoints);

  let rectLength: number;
  let rectWidth: number;
  let orientation: number;
  let rectCentroid: GeoCoordinate;

  if (hull.length >= 3) {
    const rect = minAreaRect(hull);
    const dimA = rect.maxX - rect.minX;
    const dimB = rect.maxY - rect.minY;
    // `angle` is the direction of the rectangle's first edge; keep `length`
    // aligned with whichever dimension is actually longer so the field
    // generator's "forward" axis matches the field's true long side.
    const forwardAngle = dimA >= dimB ? rect.angle : rect.angle + Math.PI / 2;
    rectLength = Math.max(dimA, dimB);
    rectWidth = Math.min(dimA, dimB);
    orientation = (90 - (forwardAngle * 180) / Math.PI + 360) % 360;

    const centerRX = (rect.minX + rect.maxX) / 2;
    const centerRY = (rect.minY + rect.maxY) / 2;
    const cos = Math.cos(rect.angle);
    const sin = Math.sin(rect.angle);
    rectCentroid = fromLocalXY(
      { x: centerRX * cos - centerRY * sin, y: centerRX * sin + centerRY * cos },
      polygonCentroid,
    );
  } else {
    // Degenerate (near-collinear) input -- fall back to the axis-aligned box.
    const bounds = bbox(feature);
    const [minLng, minLat, maxLng, maxLat] = bounds;
    const topLeft = { lat: maxLat, lng: minLng };
    const topRight = { lat: maxLat, lng: maxLng };
    const bottomLeft = { lat: minLat, lng: minLng };
    rectLength = Math.max(
      distance(toPosition(topLeft), toPosition(topRight), { units: 'meters' }),
      distance(toPosition(topLeft), toPosition(bottomLeft), { units: 'meters' }),
    );
    rectWidth = Math.min(
      distance(toPosition(topLeft), toPosition(topRight), { units: 'meters' }),
      distance(toPosition(topLeft), toPosition(bottomLeft), { units: 'meters' }),
    );
    orientation = ((bearing(toPosition(topLeft), toPosition(topRight)) % 360) + 360) % 360;
    rectCentroid = polygonCentroid;
  }

  return {
    area: areaSqM,
    perimeter: perimeterM,
    length: rectLength,
    width: rectWidth,
    orientation,
    coordinates: coords,
    centroid: rectCentroid,
  };
}

export function calculateLineLength(coords: GeoCoordinate[]): number {
  if (coords.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += distance(
      toPosition(coords[i - 1]),
      toPosition(coords[i]),
      { units: 'meters' },
    );
  }
  return total;
}

export function offsetCoordinate(
  origin: GeoCoordinate,
  distanceM: number,
  bearingDeg: number,
): GeoCoordinate {
  const R = 6371000;
  const brng = (bearingDeg * Math.PI) / 180;
  const lat1 = (origin.lat * Math.PI) / 180;
  const lng1 = (origin.lng * Math.PI) / 180;
  const d = distanceM / R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );

  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (lng2 * 180) / Math.PI,
  };
}

export function generateCirclePoints(
  center: GeoCoordinate,
  radiusM: number,
  segments = 64,
): GeoCoordinate[] {
  const points: GeoCoordinate[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 360;
    points.push(offsetCoordinate(center, radiusM, angle));
  }
  return points;
}

export function generateArcPoints(
  center: GeoCoordinate,
  radiusM: number,
  startAngle: number,
  endAngle: number,
  segments = 16,
): GeoCoordinate[] {
  const points: GeoCoordinate[] = [];
  const step = (endAngle - startAngle) / segments;
  for (let i = 0; i <= segments; i++) {
    points.push(offsetCoordinate(center, radiusM, startAngle + step * i));
  }
  return points;
}
