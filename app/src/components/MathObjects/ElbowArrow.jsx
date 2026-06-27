import React from 'react';
import { Arrow } from 'react-konva';

/**
 * ElbowArrow — orthogonal/right-angle connector arrow (mermaid/plantuml flowchart style).
 * Draws from (0,0) to (endX, endY) with a single 90° bend.
 * elbowStyle: 'h-v' (go horizontal first), 'v-h' (go vertical first)
 */
export default function ElbowArrow({
  endX = 120,
  endY = 80,
  elbowStyle = 'h-v',
  stroke = '#1e293b',
  strokeWidth = 2,
  pointerLength = 10,
  pointerWidth = 8,
  dash = false,
  dashSize = 6,
  gapSize = 4,
}) {
  let points;
  if (elbowStyle === 'h-v') {
    // Horizontal then vertical
    points = [0, 0, endX, 0, endX, endY];
  } else if (elbowStyle === 'v-h') {
    // Vertical then horizontal
    points = [0, 0, 0, endY, endX, endY];
  } else {
    // Mid-point elbow: horizontal halfway, then vertical, then horizontal to end
    const midX = endX / 2;
    points = [0, 0, midX, 0, midX, endY, endX, endY];
  }

  return (
    <Arrow
      points={points}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill={stroke}
      pointerLength={pointerLength}
      pointerWidth={pointerWidth}
      lineCap="round"
      lineJoin="round"
      {...(dash ? { dash: [dashSize, gapSize] } : {})}
    />
  );
}
