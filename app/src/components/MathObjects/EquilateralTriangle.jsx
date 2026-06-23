import React from 'react';
import { Group, Line } from 'react-konva';

export default function EquilateralTriangle({ sideLength, fill, stroke, strokeWidth }) {
  const height = (Math.sqrt(3) / 2) * sideLength;
  return (
    <Group>
      <Line
        points={[
          -sideLength/2, height/2, 
          sideLength/2, height/2, 
          0, -height/2
        ]}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        closed={true}
      />
    </Group>
  );
}
