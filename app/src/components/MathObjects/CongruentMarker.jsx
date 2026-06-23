import React from 'react';
import { Group, Line } from 'react-konva';

export default function CongruentMarker({ tickCount, stroke, strokeWidth, spacing }) {
  const ticks = [];
  const tickLength = 14;
  
  // Calculate total width to center the ticks
  const totalWidth = (tickCount - 1) * spacing;
  const startX = -totalWidth / 2;

  for (let i = 0; i < tickCount; i++) {
    const x = startX + i * spacing;
    ticks.push(
      <Line 
        key={`tick-${i}`}
        points={[x, -tickLength / 2, x, tickLength / 2]} 
        stroke={stroke} 
        strokeWidth={strokeWidth} 
      />
    );
  }

  return <Group>{ticks}</Group>;
}
