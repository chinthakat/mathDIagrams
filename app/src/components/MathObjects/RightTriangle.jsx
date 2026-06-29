import React from 'react';
import { Group, Line } from 'react-konva';
import RightAngleMarker from './RightAngleMarker';

export default function RightTriangle({ base = 100, height = 100, fill, stroke, strokeWidth }) {
  const numBase = Number(base);
  const cleanBase = Number.isNaN(numBase) ? 100 : numBase;
  const numHeight = Number(height);
  const cleanHeight = Number.isNaN(numHeight) ? 100 : numHeight;

  // A right triangle drawn from the origin (0,0) at the right angle
  return (
    <Group>
      <Line
        points={[
          0, 0, 
          cleanBase, 0, 
          0, -cleanHeight
        ]}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        closed={true}
      />
      {/* Show the right angle marker at the origin */}
      <RightAngleMarker size={15} stroke={stroke} strokeWidth={strokeWidth} />
    </Group>
  );
}
