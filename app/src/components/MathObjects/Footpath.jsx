import React from 'react';
import { Group, Circle } from 'react-konva';

export default function Footpath({
  length = 150,
  width = 12,
  color = '#e2e8f0' // stone color
}) {
  const steps = 14;
  const stones = [];

  // Generate overlapping stones along a winding wave path
  const colors = [color, '#cbd5e1', '#94a3b8', '#cbd5e1', '#e2e8f0', '#d1d5db', '#e5e7eb'];

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const x = -length / 2 + t * length;
    // Winding path y value
    const y = Math.sin(t * Math.PI * 2) * 6;
    
    // Choose stone color and size
    const stoneColor = colors[i % colors.length];
    const r = width * 0.45 * (0.8 + (i % 3) * 0.15); // slightly varying sizes

    stones.push(
      <Circle
        key={`stone-${i}`}
        x={x}
        y={y}
        radius={r}
        fill={stoneColor}
        stroke="#4b5563"
        strokeWidth={1}
        shadowColor="#000"
        shadowBlur={1.5}
        shadowOffset={{ x: 0.5, y: 1 }}
        shadowOpacity={0.12}
      />
    );

    // Add extra secondary smaller gravel pebbles on the sides
    if (i < steps - 1) {
      const px = x + (length / steps) * 0.5;
      const py = y + (Math.random() - 0.5) * width * 0.8;
      stones.push(
        <Circle
          key={`pebble-${i}`}
          x={px}
          y={py}
          radius={2 + (i % 2)}
          fill="#94a3b8"
          stroke="#4b5563"
          strokeWidth={0.5}
          opacity={0.8}
        />
      );
    }
  }

  return (
    <Group>
      {stones}
    </Group>
  );
}
