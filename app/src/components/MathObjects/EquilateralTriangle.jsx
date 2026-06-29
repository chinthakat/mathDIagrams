import React from 'react';
import { Group, Line } from 'react-konva';

export default function EquilateralTriangle({ sideLength = 120, fill, stroke, strokeWidth }) {
  const num = Number(sideLength);
  const cleanSideLength = Number.isNaN(num) ? 120 : num;
  const height = (Math.sqrt(3) / 2) * cleanSideLength;
  return (
    <Group>
      <Line
        points={[
          -cleanSideLength/2, height/2, 
          cleanSideLength/2, height/2, 
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
