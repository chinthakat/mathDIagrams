import React from 'react';
import { Path, Arrow, Group } from 'react-konva';

/**
 * BezierArrow — smooth S-curve or C-curve connector (plantuml/mermaid curved arrow style).
 * Draws from (0,0) to (endX, endY) using a cubic bezier path.
 * curveStyle: 'auto' (smart S/C), 's-curve' (S), 'c-curve' (C-arc)
 */
export default function BezierArrow({
  endX = 150,
  endY = 0,
  curveStyle = 'auto',
  curvature = 0.4,
  stroke = '#1e293b',
  strokeWidth = 2,
  pointerLength = 10,
  pointerWidth = 8,
  dash = false,
  dashSize = 6,
  gapSize = 4,
}) {
  // Compute cubic bezier control points
  let cp1x, cp1y, cp2x, cp2y;
  const dx = endX;
  const dy = endY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = dist * curvature;

  if (curveStyle === 's-curve') {
    // S-curve: control points on opposite sides
    cp1x = offset;
    cp1y = -offset;
    cp2x = endX - offset;
    cp2y = endY + offset;
  } else if (curveStyle === 'c-curve') {
    // C-curve: both control points curve to one side
    const perp = { x: -dy / (dist || 1), y: dx / (dist || 1) };
    cp1x = dx * 0.25 + perp.x * offset;
    cp1y = dy * 0.25 + perp.y * offset;
    cp2x = dx * 0.75 + perp.x * offset;
    cp2y = dy * 0.75 + perp.y * offset;
  } else {
    // auto: horizontal s-curve (good for left-right connectors)
    cp1x = endX * 0.5;
    cp1y = 0;
    cp2x = endX * 0.5;
    cp2y = endY;
  }

  const pathData = `M 0 0 C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${endX} ${endY}`;

  // Arrowhead direction: tangent at end of bezier
  const t = 0.98;
  // Derivative of cubic bezier at t ≈ 1: B'(t) ≈ 3(P3 - P2) at t=1
  const tx = 3 * (endX - cp2x);
  const ty = 3 * (endY - cp2y);
  const len = Math.sqrt(tx * tx + ty * ty) || 1;
  const nx = tx / len;
  const ny = ty / len;

  const headLen = pointerLength;
  const headWidth = pointerWidth / 2;
  // Arrowhead triangle points
  const tipX = endX;
  const tipY = endY;
  const baseX = tipX - nx * headLen;
  const baseY = tipY - ny * headLen;
  const perpX = -ny * headWidth;
  const perpY = nx * headWidth;

  const arrowPoints = [
    tipX, tipY,
    baseX + perpX, baseY + perpY,
    baseX - perpX, baseY - perpY,
  ];

  return (
    <Group>
      <Path
        data={pathData}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="transparent"
        lineCap="round"
        lineJoin="round"
        {...(dash ? { dash: [dashSize, gapSize] } : {})}
      />
      {/* Filled arrowhead triangle */}
      <Path
        data={`M ${arrowPoints[0]} ${arrowPoints[1]} L ${arrowPoints[2]} ${arrowPoints[3]} L ${arrowPoints[4]} ${arrowPoints[5]} Z`}
        fill={stroke}
        stroke={stroke}
        strokeWidth={0.5}
      />
    </Group>
  );
}
