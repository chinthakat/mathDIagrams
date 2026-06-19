import React from 'react';
import { Group, Circle, Arc } from 'react-konva';

export default function FractionCircle({ radius, sectors, shaded, fill, stroke, strokeWidth }) {
  const anglePerSector = 360 / sectors;
  const arcs = [];

  for (let i = 0; i < sectors; i++) {
    const isShaded = i < shaded;
    arcs.push(
      <Arc
        key={`sector-${i}`}
        x={0}
        y={0}
        innerRadius={0}
        outerRadius={radius}
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
      <Circle radius={radius} stroke={stroke} strokeWidth={strokeWidth} />
      {arcs}
    </Group>
  );
}
