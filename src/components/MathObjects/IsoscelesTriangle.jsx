import React from 'react';
import { Group, Line } from 'react-konva';

export default function IsoscelesTriangle({ base, height, fill, stroke, strokeWidth }) {
  return (
    <Group>
      <Line
        points={[
          -base/2, 0, 
          base/2, 0, 
          0, -height
        ]}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        closed={true}
      />
    </Group>
  );
}
