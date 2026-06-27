/**
 * Connection point utilities for Gliffy-style connector arrows.
 *
 * All coordinates are in Konva stage-local space (same units as shape.x / shape.y).
 */

export const SNAP_RADIUS = 24; // px — how close an endpoint must be to snap

/**
 * Returns the bounding box of a shape as { x, y, w, h } where (x,y) is the
 * shape's anchor (center for most shapes). Handles the variety of size props
 * used across the registry.
 */
export function getShapeBounds(shape) {
  const x = shape.x || 0;
  const y = shape.y || 0;
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

/**
 * Returns 8 absolute connection points for a shape.
 *
 * Index layout:
 *   0 ─ 1 ─ 2
 *   │       │
 *   3       4
 *   │       │
 *   5 ─ 6 ─ 7
 */
export function getConnectionPoints(shape) {
  const { x, y, w, h } = getShapeBounds(shape);
  const hw = w / 2, hh = h / 2;
  return [
    { x: x - hw, y: y - hh }, // 0 TL
    { x: x,      y: y - hh }, // 1 TC
    { x: x + hw, y: y - hh }, // 2 TR
    { x: x - hw, y: y       }, // 3 ML
    { x: x + hw, y: y       }, // 4 MR
    { x: x - hw, y: y + hh }, // 5 BL
    { x: x,      y: y + hh }, // 6 BC
    { x: x + hw, y: y + hh }, // 7 BR
  ];
}

/**
 * Resolves an endpoint to absolute { x, y }.
 * If binding is set and the target shape is found, follows the binding.
 * Falls back to the stored free position (freeX, freeY).
 */
export function resolveEndpoint(binding, freeX, freeY, allShapes) {
  if (!binding) return { x: freeX, y: freeY };
  const shape = allShapes.find(s => s.id === binding.shapeId);
  if (!shape) return { x: freeX, y: freeY };
  const pts = getConnectionPoints(shape);
  return pts[binding.pointIndex] ?? { x: freeX, y: freeY };
}

/**
 * Finds the nearest connection point within SNAP_RADIUS of pos.
 * Skips connectorArrow shapes and the connector being dragged (excludeShapeId).
 * Returns { shapeId, pointIndex, x, y } or null.
 */
export function findNearestConnectionPoint(pos, shapes, excludeShapeId = null) {
  const SKIP_TYPES = new Set(['connectorArrow', 'freehand', 'drawRect', 'drawEllipse']);
  let nearest = null;
  let nearestDist = SNAP_RADIUS;

  for (const shape of shapes) {
    if (shape.id === excludeShapeId) continue;
    if (SKIP_TYPES.has(shape.type)) continue;
    const pts = getConnectionPoints(shape);
    pts.forEach((pt, idx) => {
      const d = Math.hypot(pt.x - pos.x, pt.y - pos.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = { shapeId: shape.id, pointIndex: idx, x: pt.x, y: pt.y };
      }
    });
  }
  return nearest;
}
