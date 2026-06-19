import React from 'react';
import { Group, Line } from 'react-konva';
import RightAngleMarker from './RightAngleMarker';

export default function RightTriangle({ base, height, fill, stroke, strokeWidth }) {
  // A right triangle drawn from the origin (0,0) at the right angle
  return (
    <Group>
      <Line
        points={[
          0, 0, 
          base, 0, 
          0, -height
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
