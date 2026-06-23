import React from 'react';
import { Group, Circle, Text } from 'react-konva';

export default function Point({ radius, fill, stroke, strokeWidth, label, labelPosition }) {
  // labelPosition could be top-right, bottom-right, etc. Defaulting to top-right.
  const offset = radius + 5;
  const lx = offset;
  const ly = -offset - 10;

  return (
    <Group>
      <Circle 
        radius={radius} 
        fill={fill} 
        stroke={stroke} 
        strokeWidth={strokeWidth} 
      />
      {label && (
        <Text 
          text={label} 
          x={lx} 
          y={ly} 
          fontSize={16} 
          fill={stroke} 
          fontStyle="bold"
        />
      )}
    </Group>
  );
}
