import React from 'react';
import { Group, Line } from 'react-konva';

export default function RightAngleMarker({ size, stroke, strokeWidth }) {
  return (
    <Group>
      {/* The square corner marker */}
      <Line 
        points={[size, 0, size, size, 0, size]} 
        stroke={stroke} 
        strokeWidth={strokeWidth} 
        tension={0} // sharp corners
        closed={false}
      />
    </Group>
  );
}
