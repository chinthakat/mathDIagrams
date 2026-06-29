import React from 'react';
import { Group, Rect } from 'react-konva';

export default function FractionBar({ width = 200, height = 40, partitions = 5, shaded = 3, fill = '#3b82f6', stroke = '#334155', strokeWidth = 2 }) {
  const numWidth = Number(width);
  const cleanWidth = Number.isNaN(numWidth) ? 200 : numWidth;
  const numHeight = Number(height);
  const cleanHeight = Number.isNaN(numHeight) ? 40 : numHeight;
  const numPartitions = Number(partitions);
  const cleanPartitions = Number.isNaN(numPartitions) ? 5 : numPartitions;
  const numShaded = Number(shaded);
  const cleanShaded = Number.isNaN(numShaded) ? 3 : numShaded;

  const partitionWidth = cleanWidth / cleanPartitions;
  const segments = [];

  for (let i = 0; i < cleanPartitions; i++) {
    const isShaded = i < cleanShaded;
    segments.push(
      <Rect
        key={`partition-${i}`}
        x={i * partitionWidth}
        y={0}
        width={partitionWidth}
        height={cleanHeight}
        fill={isShaded ? fill : 'transparent'}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  return <Group>{segments}</Group>;
}
