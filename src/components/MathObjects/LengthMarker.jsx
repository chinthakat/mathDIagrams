import React from 'react';
import { Group, Line, Text } from 'react-konva';

export default function LengthMarker({ length, label, stroke, strokeWidth }) {
  const tickSize = 10;
  
  return (
    <Group>
      {/* Main dimension line */}
      <Line points={[0, 0, length, 0]} stroke={stroke} strokeWidth={strokeWidth} />
      
      {/* End ticks */}
      <Line points={[0, -tickSize, 0, tickSize]} stroke={stroke} strokeWidth={strokeWidth} />
      <Line points={[length, -tickSize, length, tickSize]} stroke={stroke} strokeWidth={strokeWidth} />
      
      {/* Left Arrow */}
      <Line points={[10, -5, 0, 0, 10, 5]} stroke={stroke} strokeWidth={strokeWidth} />
      {/* Right Arrow */}
      <Line points={[length - 10, -5, length, 0, length - 10, 5]} stroke={stroke} strokeWidth={strokeWidth} />
      
      {/* Label in center */}
      {label && (
        <Text 
          text={label} 
          x={length / 2 - 30} 
          y={-20} 
          width={60}
          align="center"
          fontSize={14} 
          fill={stroke} 
          fontStyle="bold"
        />
      )}
    </Group>
  );
}
