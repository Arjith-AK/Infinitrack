import type { GeneratedField, GeoCoordinate, SportType, FieldLine } from '@/types';
import { calculateLineLength, generateArcPoints, generateCirclePoints, offsetCoordinate } from '@/utils/geo/polygonMetrics';
import { generateId } from '@/utils';
import type { NormalizedPoint } from '@/utils/image/imageTracer';

export interface FieldDimensions {
  length: number;
  width: number;
  penaltyAreaLength: number;
  penaltyAreaWidth: number;
  goalAreaLength: number;
  goalAreaWidth: number;
  centerCircleRadius: number;
  penaltySpotDistance: number;
  cornerArcRadius: number;
}

const FOOTBALL_FULL: FieldDimensions = {
  length: 105,
  width: 68,
  penaltyAreaLength: 16.5,
  penaltyAreaWidth: 40.32,
  goalAreaLength: 5.5,
  goalAreaWidth: 18.32,
  centerCircleRadius: 9.15,
  penaltySpotDistance: 11,
  cornerArcRadius: 1,
};

export const SPORT_DIMENSIONS: Partial<Record<SportType, FieldDimensions>> = {
  football: FOOTBALL_FULL,
  hockey: {
    length: 91.4,
    width: 55,
    penaltyAreaLength: 14.63,
    penaltyAreaWidth: 22.9,
    goalAreaLength: 4,
    goalAreaWidth: 3.66,
    centerCircleRadius: 0,
    penaltySpotDistance: 6.4,
    cornerArcRadius: 0.25,
  },
  cricket: {
    length: 137.16,
    width: 137.16,
    penaltyAreaLength: 0,
    penaltyAreaWidth: 0,
    goalAreaLength: 0,
    goalAreaWidth: 0,
    centerCircleRadius: 0,
    penaltySpotDistance: 0,
    cornerArcRadius: 0,
  },
  tennis: {
    length: 23.77,
    width: 10.97,
    penaltyAreaLength: 0,
    penaltyAreaWidth: 0,
    goalAreaLength: 0,
    goalAreaWidth: 0,
    centerCircleRadius: 0,
    penaltySpotDistance: 0,
    cornerArcRadius: 0,
  },
  volleyball: {
    length: 18,
    width: 9,
    penaltyAreaLength: 0,
    penaltyAreaWidth: 0,
    goalAreaLength: 0,
    goalAreaWidth: 0,
    centerCircleRadius: 0,
    penaltySpotDistance: 0,
    cornerArcRadius: 0,
  },
  basketball: {
    length: 28,
    width: 15,
    penaltyAreaLength: 0,
    penaltyAreaWidth: 0,
    goalAreaLength: 0,
    goalAreaWidth: 0,
    centerCircleRadius: 1.8,
    penaltySpotDistance: 0,
    cornerArcRadius: 0,
  },
};

function createLine(
  type: FieldLine['type'],
  coordinates: GeoCoordinate[],
): FieldLine {
  return {
    id: generateId(),
    type,
    coordinates,
    length: calculateLineLength(coordinates),
  };
}

function getFieldCorners(
  center: GeoCoordinate,
  lengthM: number,
  widthM: number,
  orientation: number,
): GeoCoordinate[] {
  const halfL = lengthM / 2;
  const halfW = widthM / 2;

  const perp = orientation + 90;
  const fwd = orientation;
  return [
    offsetCoordinate(offsetCoordinate(center, halfL, fwd), halfW, perp),
    offsetCoordinate(offsetCoordinate(center, halfL, fwd), -halfW, perp),
    offsetCoordinate(offsetCoordinate(center, -halfL, fwd), -halfW, perp),
    offsetCoordinate(offsetCoordinate(center, -halfL, fwd), halfW, perp),
  ];
}

function generateFootballField(
  center: GeoCoordinate,
  fieldLength: number,
  fieldWidth: number,
  orientation: number,
  dims: FieldDimensions,
): FieldLine[] {
  const lines: FieldLine[] = [];
  const scale = Math.min(fieldLength / dims.length, fieldWidth / dims.width);
  const scaledDims = {
    length: dims.length * scale,
    width: dims.width * scale,
    penaltyAreaLength: dims.penaltyAreaLength * scale,
    penaltyAreaWidth: dims.penaltyAreaWidth * scale,
    goalAreaLength: dims.goalAreaLength * scale,
    goalAreaWidth: dims.goalAreaWidth * scale,
    centerCircleRadius: dims.centerCircleRadius * scale,
    penaltySpotDistance: dims.penaltySpotDistance * scale,
    cornerArcRadius: dims.cornerArcRadius * scale,
  };

  const corners = getFieldCorners(center, scaledDims.length, scaledDims.width, orientation);
  lines.push(createLine('boundary', [...corners, corners[0]]));

  const perp = orientation + 90;
  const fwd = orientation;

  const midLeft = offsetCoordinate(offsetCoordinate(center, 0, fwd), scaledDims.width / 2, perp);
  const midRight = offsetCoordinate(offsetCoordinate(center, 0, fwd), -scaledDims.width / 2, perp);
  lines.push(createLine('center_line', [midLeft, midRight]));

  if (scaledDims.centerCircleRadius > 0) {
    lines.push(
      createLine('center_circle', generateCirclePoints(center, scaledDims.centerCircleRadius)),
    );
  }

  for (const side of [-1, 1]) {
    const goalCenter = offsetCoordinate(center, (scaledDims.length / 2) * side, fwd);

    const paNear = offsetCoordinate(goalCenter, -scaledDims.penaltyAreaLength * side, fwd);
    const paLeft = offsetCoordinate(paNear, scaledDims.penaltyAreaWidth / 2, perp);
    const paRight = offsetCoordinate(paNear, -scaledDims.penaltyAreaWidth / 2, perp);
    const paGoalLeft = offsetCoordinate(goalCenter, scaledDims.penaltyAreaWidth / 2, perp);
    const paGoalRight = offsetCoordinate(goalCenter, -scaledDims.penaltyAreaWidth / 2, perp);
    lines.push(createLine('penalty_area', [paGoalLeft, paLeft, paRight, paGoalRight, paGoalLeft]));

    const gaNear = offsetCoordinate(goalCenter, -scaledDims.goalAreaLength * side, fwd);
    const gaLeft = offsetCoordinate(gaNear, scaledDims.goalAreaWidth / 2, perp);
    const gaRight = offsetCoordinate(gaNear, -scaledDims.goalAreaWidth / 2, perp);
    const gaGoalLeft = offsetCoordinate(goalCenter, scaledDims.goalAreaWidth / 2, perp);
    const gaGoalRight = offsetCoordinate(goalCenter, -scaledDims.goalAreaWidth / 2, perp);
    lines.push(createLine('goal_area', [gaGoalLeft, gaLeft, gaRight, gaGoalRight, gaGoalLeft]));

    const penaltySpot = offsetCoordinate(goalCenter, -scaledDims.penaltySpotDistance * side, fwd);
    lines.push(createLine('penalty_spot', [penaltySpot, offsetCoordinate(penaltySpot, 0.3, fwd)]));

    if (scaledDims.cornerArcRadius > 0) {
      const cornerIdx = side === 1 ? 0 : 2;
      const corner = corners[cornerIdx];
      // Sweep the quarter-circle through the corner's *inward* diagonal
      // (toward the pitch center on both axes) so it curves into the pitch
      // instead of bulging out past the boundary.
      const arcStart = side === 1 ? orientation + 180 : orientation;
      lines.push(
        createLine(
          'corner_arc',
          generateArcPoints(corner, scaledDims.cornerArcRadius, arcStart, arcStart + 90),
        ),
      );
    }
  }

  return lines;
}

function generateHockeyField(
  center: GeoCoordinate,
  fieldLength: number,
  fieldWidth: number,
  orientation: number,
): FieldLine[] {
  const STD = { length: 91.4, width: 55, shootingRadius: 14.63, quarterLine: 22.9, goalWidth: 3.66, penaltySpot: 6.4 };
  const scale = Math.min(fieldLength / STD.length, fieldWidth / STD.width);
  const L = STD.length * scale;
  const W = STD.width * scale;
  const shootingRadius = STD.shootingRadius * scale;
  const quarterLine = STD.quarterLine * scale;
  const goalWidth = STD.goalWidth * scale;
  const penaltySpotDist = STD.penaltySpot * scale;

  const lines: FieldLine[] = [];
  const corners = getFieldCorners(center, L, W, orientation);
  lines.push(createLine('boundary', [...corners, corners[0]]));

  const perp = orientation + 90;
  const fwd = orientation;
  lines.push(createLine('center_line', [offsetCoordinate(center, W / 2, perp), offsetCoordinate(center, -W / 2, perp)]));

  for (const side of [-1, 1]) {
    const goalCenter = offsetCoordinate(center, (L / 2) * side, fwd);
    const facing = side === 1 ? fwd + 180 : fwd;

    const qCenter = offsetCoordinate(center, (L / 2 - quarterLine) * side, fwd);
    lines.push(
      createLine('quarter_line', [offsetCoordinate(qCenter, W / 2, perp), offsetCoordinate(qCenter, -W / 2, perp)]),
    );

    lines.push(
      createLine('shooting_circle', generateArcPoints(goalCenter, shootingRadius, facing - 90, facing + 90, 24)),
    );

    const spot = offsetCoordinate(goalCenter, -penaltySpotDist * side, fwd);
    lines.push(createLine('penalty_spot', [spot, offsetCoordinate(spot, 0.3, fwd)]));

    lines.push(
      createLine('goal_area', [
        offsetCoordinate(goalCenter, goalWidth / 2, perp),
        offsetCoordinate(goalCenter, -goalWidth / 2, perp),
      ]),
    );
  }

  return lines;
}

function generateTennisField(
  center: GeoCoordinate,
  fieldLength: number,
  fieldWidth: number,
  orientation: number,
): FieldLine[] {
  const STD = { length: 23.77, width: 10.97, singlesWidth: 8.23, serviceLine: 6.4 };
  const scale = Math.min(fieldLength / STD.length, fieldWidth / STD.width);
  const L = STD.length * scale;
  const W = STD.width * scale;
  const singlesW = STD.singlesWidth * scale;
  const serviceLine = STD.serviceLine * scale;

  const lines: FieldLine[] = [];
  const corners = getFieldCorners(center, L, W, orientation);
  lines.push(createLine('boundary', [...corners, corners[0]]));

  const perp = orientation + 90;
  const fwd = orientation;

  for (const s of [-1, 1]) {
    const a = offsetCoordinate(offsetCoordinate(center, L / 2, fwd), (singlesW / 2) * s, perp);
    const b = offsetCoordinate(offsetCoordinate(center, -L / 2, fwd), (singlesW / 2) * s, perp);
    lines.push(createLine('singles_sideline', [a, b]));
  }

  lines.push(createLine('net_line', [offsetCoordinate(center, W / 2, perp), offsetCoordinate(center, -W / 2, perp)]));

  for (const side of [-1, 1]) {
    const sCenter = offsetCoordinate(center, serviceLine * side, fwd);
    lines.push(
      createLine('service_line', [
        offsetCoordinate(sCenter, singlesW / 2, perp),
        offsetCoordinate(sCenter, -singlesW / 2, perp),
      ]),
    );
    lines.push(createLine('center_service_line', [center, sCenter]));

    const baseCenter = offsetCoordinate(center, (L / 2) * side, fwd);
    lines.push(createLine('center_mark', [baseCenter, offsetCoordinate(baseCenter, -0.15 * side, fwd)]));
  }

  return lines;
}

function generateVolleyballField(
  center: GeoCoordinate,
  fieldLength: number,
  fieldWidth: number,
  orientation: number,
): FieldLine[] {
  const STD = { length: 18, width: 9, attackLine: 3 };
  const scale = Math.min(fieldLength / STD.length, fieldWidth / STD.width);
  const L = STD.length * scale;
  const W = STD.width * scale;
  const attack = STD.attackLine * scale;

  const lines: FieldLine[] = [];
  const corners = getFieldCorners(center, L, W, orientation);
  lines.push(createLine('boundary', [...corners, corners[0]]));

  const perp = orientation + 90;
  const fwd = orientation;
  lines.push(createLine('net_line', [offsetCoordinate(center, W / 2, perp), offsetCoordinate(center, -W / 2, perp)]));

  for (const side of [-1, 1]) {
    const aCenter = offsetCoordinate(center, attack * side, fwd);
    lines.push(
      createLine('attack_line', [offsetCoordinate(aCenter, W / 2, perp), offsetCoordinate(aCenter, -W / 2, perp)]),
    );
  }

  return lines;
}

function generateBasketballField(
  center: GeoCoordinate,
  fieldLength: number,
  fieldWidth: number,
  orientation: number,
): FieldLine[] {
  const STD = {
    length: 28,
    width: 15,
    keyWidth: 4.9,
    freeThrow: 5.8,
    centerCircle: 1.8,
    threePt: 6.75,
    threePtSideOffset: 0.9,
    basketDistance: 1.575,
  };
  const scale = Math.min(fieldLength / STD.length, fieldWidth / STD.width);
  const L = STD.length * scale;
  const W = STD.width * scale;
  const keyW = STD.keyWidth * scale;
  const freeThrow = STD.freeThrow * scale;
  const centerR = STD.centerCircle * scale;
  const threePt = STD.threePt * scale;
  const sideOffset = STD.threePtSideOffset * scale;
  const basketDist = STD.basketDistance * scale;

  const lines: FieldLine[] = [];
  const corners = getFieldCorners(center, L, W, orientation);
  lines.push(createLine('boundary', [...corners, corners[0]]));

  const perp = orientation + 90;
  const fwd = orientation;
  lines.push(createLine('center_line', [offsetCoordinate(center, W / 2, perp), offsetCoordinate(center, -W / 2, perp)]));
  lines.push(createLine('center_circle', generateCirclePoints(center, centerR)));

  for (const side of [-1, 1]) {
    const baseline = offsetCoordinate(center, (L / 2) * side, fwd);
    const basket = offsetCoordinate(baseline, -basketDist * side, fwd);
    const facing = side === 1 ? fwd + 180 : fwd;

    const keyFar = offsetCoordinate(baseline, -freeThrow * side, fwd);
    lines.push(
      createLine('key', [
        offsetCoordinate(baseline, keyW / 2, perp),
        offsetCoordinate(keyFar, keyW / 2, perp),
        offsetCoordinate(keyFar, -keyW / 2, perp),
        offsetCoordinate(baseline, -keyW / 2, perp),
        offsetCoordinate(baseline, keyW / 2, perp),
      ]),
    );
    lines.push(createLine('free_throw_circle', generateCirclePoints(keyFar, keyW / 2)));

    // Three-point line: an arc around the basket, closed by two short straight
    // segments running to the baseline (the "corner three" lines).
    const Y = W / 2 - sideOffset;
    const X = Math.sqrt(Math.max(threePt * threePt - Y * Y, 0));
    const transitionAngle = (Math.atan2(Y, X) * 180) / Math.PI;
    const cornerPos = offsetCoordinate(offsetCoordinate(basket, X, facing), Y, perp);
    const cornerNeg = offsetCoordinate(offsetCoordinate(basket, X, facing), -Y, perp);
    const baselinePos = offsetCoordinate(baseline, Y, perp);
    const baselineNeg = offsetCoordinate(baseline, -Y, perp);

    lines.push(
      createLine('three_point_line', [
        baselineNeg,
        cornerNeg,
        ...generateArcPoints(basket, threePt, facing - transitionAngle, facing + transitionAngle, 24),
        cornerPos,
        baselinePos,
      ]),
    );
  }

  return lines;
}

// A position on the track expressed as which of the 4 segments (the two
// straights and two curved ends) it falls on, plus a local parameter: for a
// straight, meters from that segment's start; for a curve, degrees swept
// from that segment's start (0 to 180). Every lane shares the same straight
// lengths (only the curves differ per lane), so segment + local parameter
// is the natural way to place a mark consistently across lanes of
// different radius: reuse the same parameter, vary only the radius.
interface TrackParam {
  segment: 'home' | 'leftCap' | 'back' | 'rightCap';
  t: number;
}

function trackLapLength(straightLength: number, laneRadius: number): number {
  return 2 * straightLength + 2 * Math.PI * laneRadius;
}

// `d` is arc length in the running direction from a fixed reference point
// (the start of the home straight), for a runner in the lane at `laneRadius`.
function trackParamAtDistance(d: number, laneRadius: number, straightLength: number): TrackParam {
  const capLength = Math.PI * laneRadius;
  const lap = 2 * straightLength + 2 * capLength;
  let s = ((d % lap) + lap) % lap;

  if (s <= straightLength) return { segment: 'home', t: s };
  s -= straightLength;
  if (s <= capLength) return { segment: 'leftCap', t: (s / capLength) * 180 };
  s -= capLength;
  if (s <= straightLength) return { segment: 'back', t: s };
  s -= straightLength;
  return { segment: 'rightCap', t: (s / capLength) * 180 };
}

function trackParamToPoint(
  param: TrackParam,
  laneRadius: number,
  rightCenter: GeoCoordinate,
  leftCenter: GeoCoordinate,
  orientation: number,
): GeoCoordinate {
  const perp = orientation + 90;
  switch (param.segment) {
    case 'home': {
      const bottomRight = offsetCoordinate(rightCenter, -laneRadius, perp);
      return offsetCoordinate(bottomRight, param.t, orientation + 180);
    }
    case 'leftCap':
      return offsetCoordinate(leftCenter, laneRadius, orientation - 90 - param.t);
    case 'back': {
      const topLeft = offsetCoordinate(leftCenter, laneRadius, perp);
      return offsetCoordinate(topLeft, param.t, orientation);
    }
    case 'rightCap':
      return offsetCoordinate(rightCenter, laneRadius, orientation + 90 - param.t);
  }
}

function generateAthleticsField(
  center: GeoCoordinate,
  fieldLength: number,
  fieldWidth: number,
  orientation: number,
): FieldLine[] {
  const STD_STRAIGHT = 84.39;
  const STD_RADIUS = 36.5;
  const scale = Math.min(fieldLength / (STD_STRAIGHT + STD_RADIUS * 2), fieldWidth / (STD_RADIUS * 2));
  const straightLength = STD_STRAIGHT * scale;
  const radius = STD_RADIUS * scale;

  const lines: FieldLine[] = [];
  const perp = orientation + 90;
  const fwd = orientation;
  const rightCenter = offsetCoordinate(center, straightLength / 2, fwd);
  const leftCenter = offsetCoordinate(center, -straightLength / 2, fwd);

  const numLanes = 8;
  const laneWidth = radius / (numLanes + 0.5);

  const laneRadii: number[] = [];
  for (let i = 0; i <= numLanes; i++) {
    const r = radius - i * laneWidth;
    if (r <= 0.5) break;
    laneRadii.push(r);
    const topLeft = offsetCoordinate(leftCenter, r, perp);
    const bottomLeft = offsetCoordinate(leftCenter, -r, perp);
    const path = [
      topLeft,
      ...generateArcPoints(rightCenter, r, orientation + 90, orientation - 90, 24),
      bottomLeft,
      ...generateArcPoints(leftCenter, r, orientation - 90, orientation - 270, 24),
    ];
    lines.push(createLine(i === 0 ? 'boundary' : 'lane_line', path));
  }

  const point = (param: TrackParam, laneRadius: number) =>
    trackParamToPoint(param, laneRadius, rightCenter, leftCenter, orientation);

  // The home straight ends (at its far end from the "d=0" reference) at the
  // finish -- shared by every lane, since only the curves' length differs
  // between lanes, not the straights'.
  const finishD = straightLength;
  const finishParam = trackParamAtDistance(finishD, laneRadii[0], straightLength);
  lines.push(
    createLine(
      'start_line',
      laneRadii.map((r) => point(finishParam, r)),
    ),
  );

  // 100m is short enough to be a single straight tie across every lane --
  // real tracks run it on a straight with no curve involved, so it isn't
  // staggered lane to lane.
  const distBeforeFinish = (metersBack: number, laneRadius: number) =>
    trackParamAtDistance(finishD - metersBack, laneRadius, straightLength);
  lines.push(
    createLine(
      'start_line',
      laneRadii.map((r) => point(distBeforeFinish(100, r), r)),
    ),
  );

  // 200m and 400m start on the bend, so each lane's start point is offset
  // further around the curve than the lane inside it -- computed per lane
  // from its own (longer) lap length, not approximated.
  for (const raceDistance of [200, 400]) {
    for (let i = 0; i < laneRadii.length; i++) {
      const p = distBeforeFinish(raceDistance, laneRadii[i]);
      const rOuter = laneRadii[i] + laneWidth * 0.4;
      const rInner = laneRadii[i] - laneWidth * 0.4;
      lines.push(createLine('start_line', [point(p, rOuter), point(p, rInner)]));
    }
  }

  // Longer races break for the inside lane almost immediately, so their
  // start is a single line across just the outer few lanes rather than a
  // full per-lane stagger.
  const groupStartLanes = laneRadii.slice(0, Math.min(3, laneRadii.length));
  for (const raceDistance of [800, 1500, 3000, 5000, 10000, 1609.34]) {
    const refRadius = groupStartLanes[Math.floor(groupStartLanes.length / 2)];
    const p = distBeforeFinish(raceDistance, refRadius);
    lines.push(createLine('start_line', groupStartLanes.map((r) => point(p, r))));
  }

  // Steeplechase: 5 hurdle positions spaced evenly around the lap (inner
  // lanes only, where steeplechase is run), with the 4th conventionally
  // sited as the water jump.
  const steepleLanes = laneRadii.slice(0, Math.min(3, laneRadii.length));
  const steepleRefRadius = steepleLanes[Math.floor(steepleLanes.length / 2)];
  const lap = trackLapLength(straightLength, steepleRefRadius);
  for (let hurdle = 0; hurdle < 5; hurdle++) {
    const d = finishD - (hurdle + 0.5) * (lap / 5);
    const p = trackParamAtDistance(d, steepleRefRadius, straightLength);
    lines.push(createLine('hurdle_mark', steepleLanes.map((r) => point(p, r))));
  }

  // 4x100m relay exchange zones: three hand-off points, one between each
  // consecutive pair of legs.
  const relayLanes = laneRadii.slice(0, Math.min(4, laneRadii.length));
  for (const exchangeDistance of [100, 200, 300]) {
    const refRadius = relayLanes[Math.floor(relayLanes.length / 2)];
    const p = distBeforeFinish(exchangeDistance, refRadius);
    lines.push(createLine('relay_zone', relayLanes.map((r) => point(p, r))));
  }

  return lines;
}

function generateCricketField(
  center: GeoCoordinate,
  fieldLength: number,
  fieldWidth: number,
  orientation: number,
): FieldLine[] {
  const lines: FieldLine[] = [];
  const a = fieldLength / 2;
  const b = fieldWidth / 2;
  const fwd = orientation;
  const perp = orientation + 90;
  const segments = 64;

  const boundary: GeoCoordinate[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * 2 * Math.PI;
    boundary.push(
      offsetCoordinate(offsetCoordinate(center, a * Math.cos(t), fwd), b * Math.sin(t), perp),
    );
  }
  lines.push(createLine('boundary', boundary));

  // The pitch is a fixed regulation size regardless of ground size, clamped
  // down only if the drawn ground itself is smaller than a real one.
  const pitchLength = Math.min(20.12, fieldLength * 0.8);
  const pitchWidth = Math.min(3.05, fieldWidth * 0.5);

  const p1 = offsetCoordinate(offsetCoordinate(center, pitchLength / 2, fwd), pitchWidth / 2, perp);
  const p2 = offsetCoordinate(offsetCoordinate(center, pitchLength / 2, fwd), -pitchWidth / 2, perp);
  const p3 = offsetCoordinate(offsetCoordinate(center, -pitchLength / 2, fwd), -pitchWidth / 2, perp);
  const p4 = offsetCoordinate(offsetCoordinate(center, -pitchLength / 2, fwd), pitchWidth / 2, perp);
  lines.push(createLine('pitch', [p1, p2, p3, p4, p1]));

  const creaseOffset = Math.min(1.22, pitchLength * 0.2);
  for (const side of [-1, 1]) {
    const creaseCenter = offsetCoordinate(center, (pitchLength / 2 - creaseOffset) * side, fwd);
    lines.push(
      createLine('crease', [
        offsetCoordinate(creaseCenter, pitchWidth / 2 + 0.5, perp),
        offsetCoordinate(creaseCenter, -(pitchWidth / 2 + 0.5), perp),
      ]),
    );
  }

  return lines;
}

// Converts a traced custom-layout image into field lines. `tracedPaths` are
// normalized (roughly [-0.5, 0.5] on each axis, from imageTracer.ts) and get
// stretched to fill the available fieldLength x fieldWidth envelope.
function generateCustomField(
  center: GeoCoordinate,
  fieldLength: number,
  fieldWidth: number,
  orientation: number,
  tracedPaths: NormalizedPoint[][],
): FieldLine[] {
  const lines: FieldLine[] = [];
  const corners = getFieldCorners(center, fieldLength, fieldWidth, orientation);
  lines.push(createLine('boundary', [...corners, corners[0]]));

  const fwd = orientation;
  const perp = orientation + 90;

  for (const path of tracedPaths) {
    if (path.length < 2) continue;
    const coords = path.map((pt) =>
      offsetCoordinate(offsetCoordinate(center, pt.x * fieldLength, fwd), pt.y * fieldWidth, perp),
    );
    lines.push(createLine('custom', coords));
  }

  return lines;
}

function generateSimpleRectField(
  center: GeoCoordinate,
  fieldLength: number,
  fieldWidth: number,
  orientation: number,
): FieldLine[] {
  const corners = getFieldCorners(center, fieldLength, fieldWidth, orientation);
  const perp = orientation + 90;
  const fwd = orientation;

  const midLeft = offsetCoordinate(offsetCoordinate(center, 0, fwd), fieldWidth / 2, perp);
  const midRight = offsetCoordinate(offsetCoordinate(center, 0, fwd), -fieldWidth / 2, perp);

  return [
    createLine('boundary', [...corners, corners[0]]),
    createLine('center_line', [midLeft, midRight]),
  ];
}

export function generateField(
  sport: SportType,
  center: GeoCoordinate,
  fieldLength: number,
  fieldWidth: number,
  orientation: number,
  customPaths?: NormalizedPoint[][],
): GeneratedField {
  let lines: FieldLine[];

  switch (sport) {
    case 'football':
      lines = generateFootballField(center, fieldLength, fieldWidth, orientation, FOOTBALL_FULL);
      break;
    case 'hockey':
      lines = generateHockeyField(center, fieldLength, fieldWidth, orientation);
      break;
    case 'tennis':
      lines = generateTennisField(center, fieldLength, fieldWidth, orientation);
      break;
    case 'volleyball':
      lines = generateVolleyballField(center, fieldLength, fieldWidth, orientation);
      break;
    case 'basketball':
      lines = generateBasketballField(center, fieldLength, fieldWidth, orientation);
      break;
    case 'athletics':
      lines = generateAthleticsField(center, fieldLength, fieldWidth, orientation);
      break;
    case 'cricket':
      lines = generateCricketField(center, fieldLength, fieldWidth, orientation);
      break;
    case 'custom':
      lines =
        customPaths && customPaths.length > 0
          ? generateCustomField(center, fieldLength, fieldWidth, orientation, customPaths)
          : generateSimpleRectField(center, fieldLength, fieldWidth, orientation);
      break;
    default:
      lines = generateSimpleRectField(center, fieldLength, fieldWidth, orientation);
  }

  const allCoords = lines.flatMap((l) => l.coordinates);
  const lats = allCoords.map((c) => c.lat);
  const lngs = allCoords.map((c) => c.lng);

  return {
    sport,
    lines,
    totalLength: lines.reduce((sum, l) => sum + l.length, 0),
    boundingBox: {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    },
  };
}

export function fieldLinesToWaypoints(
  field: GeneratedField,
  speed: number,
  powderFlow: number,
): import('@/types').MissionWaypoint[] {
  const waypoints: import('@/types').MissionWaypoint[] = [];
  let order = 0;

  for (const line of field.lines) {
    for (let i = 0; i < line.coordinates.length; i++) {
      const coord = line.coordinates[i];
      const next = line.coordinates[i + 1];
      let heading = 0;
      if (next) {
        const dLng = next.lng - coord.lng;
        const dLat = next.lat - coord.lat;
        heading = ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;
      }

      const dispensePowder = line.type !== 'penalty_spot' && i < line.coordinates.length - 1;

      waypoints.push({
        id: generateId(),
        lat: coord.lat,
        lng: coord.lng,
        heading,
        speed: dispensePowder ? speed * (1 - powderFlow / 250) : speed,
        dispensePowder,
        order: order++,
      });
    }
  }

  return waypoints;
}

export function calculateMissionStats(
  waypoints: import('@/types').MissionWaypoint[],
  speed: number,
  powderFlow: number,
) {
  let distance = 0;
  let turns = 0;
  let prevHeading = waypoints[0]?.heading ?? 0;

  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const dLat = curr.lat - prev.lat;
    const dLng = curr.lng - prev.lng;
    distance += Math.sqrt(dLat ** 2 + dLng ** 2) * 111320;

    const headingDiff = Math.abs(curr.heading - prevHeading);
    if (headingDiff > 30 && headingDiff < 330) turns++;

    prevHeading = curr.heading;
  }

  const markingDistance = waypoints.filter((w) => w.dispensePowder).length * 2;
  const estimatedTime = distance / Math.max(speed, 0.1);
  const powderUsage = (markingDistance * powderFlow) / 100 * 0.05;
  const batteryUsage = (distance / 1000) * 8 + estimatedTime * 0.5;

  return {
    distance,
    estimatedTime,
    powderUsage,
    batteryUsage,
    numberOfTurns: turns,
  };
}
