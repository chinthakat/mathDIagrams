import React from 'react';
import { Group, Line, Text } from 'react-konva';

export default function CoordinateAxes({ width, height, stroke, strokeWidth }) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const tickSize = 5;
  const spacing = 20; // 20px per grid unit

  // Generate tick marks
  const ticks = [];
  
  // X-axis ticks
  for (let i = -halfWidth; i <= halfWidth; i += spacing) {
    if (i !== 0) {
      ticks.push(
        <Line key={`x-${i}`} points={[i, -tickSize, i, tickSize]} stroke={stroke} strokeWidth={1} />
      );
    }
  }

  // Y-axis ticks
  for (let i = -halfHeight; i <= halfHeight; i += spacing) {
    if (i !== 0) {
      ticks.push(
        <Line key={`y-${i}`} points={[-tickSize, i, tickSize, i]} stroke={stroke} strokeWidth={1} />
      );
    }
  }

  return (
    <Group>
      {/* X Axis */}
      <Line 
        points={[-halfWidth, 0, halfWidth, 0]} 
        stroke={stroke} 
        strokeWidth={strokeWidth} 
      />
      {/* Y Axis */}
      <Line 
        points={[0, -halfHeight, 0, halfHeight]} 
        stroke={stroke} 
        strokeWidth={strokeWidth} 
      />
      
      {/* Tick Marks */}
      {ticks}
      
      {/* Labels */}
      <Text text="x" x={halfWidth + 5} y={-10} fontSize={16} fill={stroke} fontStyle="italic" />
      <Text text="y" x={-10} y={-halfHeight - 20} fontSize={16} fill={stroke} fontStyle="italic" />
    </Group>
  );
}
