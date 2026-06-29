import React from 'react';
import { Group, Circle, Arc } from 'react-konva';

export default function FractionCircle({ radius = 60, sectors = 4, shaded = 1, fill = '#3b82f6', stroke = '#334155', strokeWidth = 2 }) {
  const numRadius = Number(radius);
  const cleanRadius = Number.isNaN(numRadius) ? 60 : numRadius;
  const numSectors = Number(sectors);
  const cleanSectors = Number.isNaN(numSectors) ? 4 : numSectors;
  const numShaded = Number(shaded);
  const cleanShaded = Number.isNaN(numShaded) ? 1 : numShaded;

  const anglePerSector = 360 / cleanSectors;
  const arcs = [];

  for (let i = 0; i < cleanSectors; i++) {
    const isShaded = i < cleanShaded;
    arcs.push(
      <Arc
        key={`sector-${i}`}
        x={0}
        y={0}
        innerRadius={0}
        outerRadius={cleanRadius}
        angle={anglePerSector}
        rotation={i * anglePerSector - 90} // Start from top
        fill={isShaded ? fill : 'transparent'}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  return (
    <Group>
      {/* Background circle to ensure a perfect outer bound even if unshaded */}
      <Circle radius={cleanRadius} stroke={stroke} strokeWidth={strokeWidth} />
      {arcs}
    </Group>
  );
}
