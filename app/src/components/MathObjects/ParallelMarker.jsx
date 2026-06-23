import React from 'react';
import { Group, Line } from 'react-konva';

export default function ParallelMarker({ arrowCount, stroke, strokeWidth, spacing }) {
  const arrows = [];
  const arrowSize = 8;
  
  // Center the arrows
  const totalWidth = (arrowCount - 1) * spacing;
  const startX = -totalWidth / 2;

  for (let i = 0; i < arrowCount; i++) {
    const x = startX + i * spacing;
    arrows.push(
      <Line 
        key={`arrow-${i}`}
        points={[
          x - arrowSize, -arrowSize, 
          x, 0, 
          x - arrowSize, arrowSize
        ]} 
        stroke={stroke} 
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
      />
    );
  }

  return <Group>{arrows}</Group>;
}
