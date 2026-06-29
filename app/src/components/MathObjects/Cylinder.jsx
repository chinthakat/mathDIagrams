import React from 'react';
import { Group, Rect, Ellipse, Line } from 'react-konva';

export default function Cylinder({
  width = 80, height = 120,
  fill = '#3b82f6', topFill = '#60a5fa',
  stroke = '#1e40af', strokeWidth = 1.5,
}) {
  const w  = Math.max(4, Number(width)  || 80);
  const h  = Math.max(4, Number(height) || 120);
  const rx = w / 2;
  const ry = Math.max(4, rx * 0.28);   // ellipse y-radius ≈ 28% of half-width
  const bodyH = Math.max(4, h - ry);

  return (
    <Group>
      {/* Body rectangle */}
      <Rect
        x={-rx} y={-bodyH / 2}
        width={w} height={bodyH}
        fill={fill} stroke={stroke} strokeWidth={strokeWidth}
        listening={false}
      />
      {/* Bottom ellipse (drawn before top so top overlaps cleanly) */}
      <Ellipse
        x={0} y={bodyH / 2}
        radiusX={rx} radiusY={ry}
        fill={fill} stroke={stroke} strokeWidth={strokeWidth}
        listening={false}
      />
      {/* Cover the seam between rect and bottom ellipse */}
      <Line
        points={[-rx, bodyH / 2, rx, bodyH / 2]}
        stroke={fill} strokeWidth={strokeWidth + 1}
        listening={false}
      />
      {/* Top ellipse */}
      <Ellipse
        x={0} y={-bodyH / 2}
        radiusX={rx} radiusY={ry}
        fill={topFill} stroke={stroke} strokeWidth={strokeWidth}
        listening={false}
      />
    </Group>
  );
}
