import React from 'react';
import { Arrow } from 'react-konva';

/**
 * DottedLineArrow — dashed/dotted line with an arrowhead at the end.
 * Points are relative to the group origin: draws from (0,0) to (endX, endY).
 * props: endX, endY, stroke, strokeWidth, dashSize, gapSize, pointerLength, pointerWidth
 */
export default function DottedLineArrow({
  endX = 100,
  endY = 0,
  stroke = '#1e293b',
  strokeWidth = 2,
  dashSize = 6,
  gapSize = 5,
  pointerLength = 10,
  pointerWidth = 8,
}) {
  return (
    <Arrow
      points={[0, 0, endX, endY]}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill={stroke}
      dash={[dashSize, gapSize]}
      pointerLength={pointerLength}
      pointerWidth={pointerWidth}
      lineCap="round"
      lineJoin="round"
    />
  );
}
