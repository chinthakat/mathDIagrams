import React from 'react';
import { Group, Rect } from 'react-konva';

export default function FractionBar({ width, height, partitions, shaded, fill, stroke, strokeWidth }) {
  const partitionWidth = width / partitions;
  const segments = [];

  for (let i = 0; i < partitions; i++) {
    const isShaded = i < shaded;
    segments.push(
      <Rect
        key={`partition-${i}`}
        x={i * partitionWidth}
        y={0}
        width={partitionWidth}
        height={height}
        fill={isShaded ? fill : 'transparent'}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  return <Group>{segments}</Group>;
}
