import React from 'react';
import { Group, Line } from 'react-konva';

export default function IsoscelesTriangle({ base = 120, height = 100, fill, stroke, strokeWidth }) {
  const numBase = Number(base);
  const cleanBase = Number.isNaN(numBase) ? 120 : numBase;
  const numHeight = Number(height);
  const cleanHeight = Number.isNaN(numHeight) ? 100 : numHeight;

  return (
    <Group>
      <Line
        points={[
          -cleanBase/2, 0, 
          cleanBase/2, 0, 
          0, -cleanHeight
        ]}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        closed={true}
      />
    </Group>
  );
}
