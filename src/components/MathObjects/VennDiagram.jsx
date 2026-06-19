import React from 'react';
import { Group, Circle, Text } from 'react-konva';

export default function VennDiagram({ radius, overlap, leftLabel, rightLabel, leftColor, rightColor, stroke, strokeWidth }) {
  const distance = radius * 2 - overlap;
  
  return (
    <Group>
      {/* Left Set */}
      <Circle 
        x={-distance / 2} 
        y={0} 
        radius={radius} 
        fill={leftColor} 
        stroke={stroke} 
        strokeWidth={strokeWidth} 
        opacity={0.5} 
      />
      {leftLabel && (
        <Text 
          text={leftLabel} 
          x={-distance / 2 - radius / 2} 
          y={-radius - 20} 
          fontSize={16} 
          fill={stroke} 
          align="center"
          fontStyle="bold"
        />
      )}

      {/* Right Set */}
      <Circle 
        x={distance / 2} 
        y={0} 
        radius={radius} 
        fill={rightColor} 
        stroke={stroke} 
        strokeWidth={strokeWidth} 
        opacity={0.5} 
      />
      {rightLabel && (
        <Text 
          text={rightLabel} 
          x={distance / 2 - radius / 2} 
          y={-radius - 20} 
          fontSize={16} 
          fill={stroke} 
          align="center"
          fontStyle="bold"
        />
      )}
    </Group>
  );
}
