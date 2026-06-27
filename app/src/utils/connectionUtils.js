/**
 * Connection point and connector utilities — Gliffy-style diagramming.
 * All coordinates are in Konva stage-local space.
 */

export const SNAP_RADIUS    = 24; // px — endpoint snap distance
export const GUIDE_THRESHOLD = 6; // px — alignment guide snap distance

const SKIP_TYPES = new Set(['connectorArrow', 'orthoConnector', 'freehand', 'drawRect', 'drawEllipse']);

// ── Bounding box ─────────────────────────────────────────────────────────────

export function getShapeBounds(shape) {
  const x  = shape.x  || 0;
  const y  = shape.y  || 0;
  const sx = shape.scaleX || 1;
  const sy = shape.scaleY || 1;
  let w, h;
  if (shape.radius) {
    w = h = shape.radius * 2;
  } else if (shape.radiusX || shape.radiusY) {
    w = (shape.radiusX || 50) * 2;
    h = (shape.radiusY || 50) * 2;
  } else if (shape.size) {
    w = h = shape.size;
  } else {
    w = shape.width  || 100;
    h = shape.height || 60;
  }
  return { x, y, w: w * sx, h: h * sy };
}

// ── Connection points (8 per shape) ─────────────────────────────────────────
// Index layout:
//   0 ─ 1 ─ 2
//   │       │
//   3       4
//   │       │
//   5 ─ 6 ─ 7

export function getConnectionPoints(shape) {
  const { x, y, w, h } = getShapeBounds(shape);
  const hw = w / 2, hh = h / 2;
  return [
    { x: x - hw, y: y - hh }, // 0 TL
    { x,         y: y - hh }, // 1 TC
    { x: x + hw, y: y - hh }, // 2 TR
    { x: x - hw, y          }, // 3 ML
    { x: x + hw, y          }, // 4 MR
    { x: x - hw, y: y + hh }, // 5 BL
    { x,         y: y + hh }, // 6 BC
    { x: x + hw, y: y + hh }, // 7 BR
  ];
}

/** Exit direction hint for each connection point index */
export function getPointExitDir(pointIndex) {
  const dirs = ['tl', 'top', 'tr', 'left', 'right', 'bl', 'bottom', 'br'];
  return dirs[pointIndex] ?? null;
}

// ── Endpoint resolution ───────────────────────────────────────────────────────

export function resolveEndpoint(binding, freeX, freeY, allShapes) {
  if (!binding) return { x: freeX, y: freeY };
  const shape = allShapes.find(s => s.id === binding.shapeId);
  if (!shape) return { x: freeX, y: freeY };
  const pts = getConnectionPoints(shape);
  return pts[binding.pointIndex] ?? { x: freeX, y: freeY };
}

// ── Nearest connection point (for snap) ──────────────────────────────────────

export function findNearestConnectionPoint(pos, shapes, excludeShapeId = null) {
  let nearest = null;
  let nearestDist = SNAP_RADIUS;
  for (const shape of shapes) {
    if (shape.id === excludeShapeId || SKIP_TYPES.has(shape.type)) continue;
    getConnectionPoints(shape).forEach((pt, idx) => {
      const d = Math.hypot(pt.x - pos.x, pt.y - pos.y);
      if (d < nearestDist) { nearestDist = d; nearest = { shapeId: shape.id, pointIndex: idx, x: pt.x, y: pt.y }; }
    });
  }
  return nearest;
}

// ── Orthogonal path routing ───────────────────────────────────────────────────

/**
 * Generates a flat [x0,y0, x1,y1, ...] orthogonal path between start and end.
 * If waypoints are provided (user-manually-adjusted), they override auto-routing.
 */
export function computeOrthoPath(start, end, waypoints = []) {
  if (waypoints.length > 0) {
    const pts = [start.x, start.y];
    waypoints.forEach(wp => pts.push(wp.x, wp.y));
    pts.push(end.x, end.y);
    return pts;
  }
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  if (dx >= dy) {
    // Horizontal-dominant: H → V → H
    return [start.x, start.y, midX, start.y, midX, end.y, end.x, end.y];
  } else {
    // Vertical-dominant: V → H → V
    return [start.x, start.y, start.x, midY, end.x, midY, end.x, end.y];
  }
}

/**
 * Returns midpoint info for each segment of a flat points array.
 * Each entry: { x, y, segIndex, isHorizontal }
 */
export function getSegmentMidpoints(pts) {
  const mids = [];
  for (let i = 0; i < pts.length - 2; i += 2) {
    mids.push({
      x: (pts[i] + pts[i + 2]) / 2,
      y: (pts[i + 1] + pts[i + 3]) / 2,
      segIndex: i / 2,
      isHorizontal: Math.abs(pts[i + 3] - pts[i + 1]) < 1,
    });
  }
  return mids;
}

// ── Alignment guides ─────────────────────────────────────────────────────────

/**
 * Computes alignment guides for a shape being dragged against all other shapes.
 * Returns [{ axis: 'h'|'v', pos, snapY?, snapX? }]
 */
export function computeAlignmentGuides(movingShape, allShapes, scale = 1) {
  const threshold = GUIDE_THRESHOLD / scale;
  const mv = getShapeBounds(movingShape);
  const guides = [];

  allShapes.forEach(other => {
    if (other.id === movingShape.id || SKIP_TYPES.has(other.type)) return;
    const ob = getShapeBounds(other);

    // Horizontal guide pairs (moving shape's H edge aligns with static shape's H edge/center)
    [
      { myPos: mv.y - mv.h / 2, otherPos: ob.y - ob.h / 2, snapY: ob.y - ob.h / 2 + mv.h / 2 },
      { myPos: mv.y,             otherPos: ob.y,             snapY: ob.y },
      { myPos: mv.y + mv.h / 2, otherPos: ob.y + ob.h / 2, snapY: ob.y + ob.h / 2 - mv.h / 2 },
      { myPos: mv.y - mv.h / 2, otherPos: ob.y + ob.h / 2, snapY: ob.y + ob.h / 2 + mv.h / 2 },
      { myPos: mv.y + mv.h / 2, otherPos: ob.y - ob.h / 2, snapY: ob.y - ob.h / 2 - mv.h / 2 },
    ].forEach(({ myPos, otherPos, snapY }) => {
      if (Math.abs(myPos - otherPos) < threshold) guides.push({ axis: 'h', pos: otherPos, snapY });
    });

    // Vertical guide pairs
    [
      { myPos: mv.x - mv.w / 2, otherPos: ob.x - ob.w / 2, snapX: ob.x - ob.w / 2 + mv.w / 2 },
      { myPos: mv.x,             otherPos: ob.x,             snapX: ob.x },
      { myPos: mv.x + mv.w / 2, otherPos: ob.x + ob.w / 2, snapX: ob.x + ob.w / 2 - mv.w / 2 },
      { myPos: mv.x + mv.w / 2, otherPos: ob.x - ob.w / 2, snapX: ob.x - ob.w / 2 - mv.w / 2 },
      { myPos: mv.x - mv.w / 2, otherPos: ob.x + ob.w / 2, snapX: ob.x + ob.w / 2 + mv.w / 2 },
    ].forEach(({ myPos, otherPos, snapX }) => {
      if (Math.abs(myPos - otherPos) < threshold) guides.push({ axis: 'v', pos: otherPos, snapX });
    });
  });

  // Deduplicate guides
  return guides.filter((g, i, arr) =>
    arr.findIndex(g2 => g2.axis === g.axis && Math.abs(g2.pos - g.pos) < 1) === i
  );
}
