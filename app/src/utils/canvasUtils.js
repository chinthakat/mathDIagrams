/**
 * Compute the axis-aligned bounding box of all shapes on the canvas.
 * Handles normal shapes (x, y, width, height) and connector shapes (x1, y1, x2, y2).
 * Returns { x, y, width, height } with optional padding, clamped to [0, stageW] x [0, stageH].
 */
export function computeShapesBoundingBox(shapes, { padding = 24, stageW = 800, stageH = 600 } = {}) {
  if (!shapes || shapes.length === 0) {
    return { x: 0, y: 0, width: stageW, height: stageH };
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const s of shapes) {
    if (s.x1 !== undefined && s.x2 !== undefined) {
      // connector / arrow
      minX = Math.min(minX, s.x1, s.x2);
      minY = Math.min(minY, s.y1, s.y2);
      maxX = Math.max(maxX, s.x1, s.x2);
      maxY = Math.max(maxY, s.y1, s.y2);
    } else {
      const x = s.x ?? 0;
      const y = s.y ?? 0;
      const w = s.width ?? 100;
      const h = s.height ?? 100;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    }
  }

  if (!isFinite(minX)) return { x: 0, y: 0, width: stageW, height: stageH };

  const x = Math.max(0, minX - padding);
  const y = Math.max(0, minY - padding);
  const width = Math.min(stageW - x, maxX - minX + padding * 2);
  const height = Math.min(stageH - y, maxY - minY + padding * 2);

  return { x, y, width: Math.max(40, width), height: Math.max(40, height) };
}

/**
 * Export a Konva stage cropped to the bounding box of all shapes.
 */
export function exportCroppedDataUrl(stage, shapes, { pixelRatio = 2, padding = 24, stageW = 800, stageH = 600 } = {}) {
  const box = computeShapesBoundingBox(shapes, { padding, stageW, stageH });
  return stage.toDataURL({ ...box, pixelRatio });
}
