import React from 'react';
import { Group, Line, Text, Arrow, Arc } from 'react-konva';

export default function BearingsMarker({ bearing, radius = 80, stroke = '#0f172a', strokeWidth = 2, label = '' }) {
  // Bearings are measured clockwise from North (0 degrees at top)
  // Standard math coordinate system has 0 degrees at right (East), counter-clockwise.
  // Conversion:
  // North (0 bearing) -> math angle is -90 degrees (or 270).
  // Bearing angle grows clockwise -> math angle is -90 + bearing.
  const bearingAngleRad = ((-90 + bearing) * Math.PI) / 180;
  
  const vx = radius * Math.cos(bearingAngleRad);
  const vy = radius * Math.sin(bearingAngleRad);

  return (
    <Group>
      {/* North-South Axis */}
      <Line
        points={[0, -radius, 0, radius]}
        stroke="#94a3b8"
        strokeWidth={1}
        dash={[4, 4]}
      />
      {/* East-West Axis */}
      <Line
        points={[-radius, 0, radius, 0]}
        stroke="#94a3b8"
        strokeWidth={1}
        dash={[4, 4]}
      />

      {/* Axis Labels */}
      <Text text="N" x={-5} y={-radius - 15} fontSize={12} fontStyle="bold" fill={stroke} />
      <Text text="S" x={-5} y={radius + 5} fontSize={12} fontStyle="bold" fill={stroke} />
      <Text text="E" x={radius + 8} y={-6} fontSize={12} fontStyle="bold" fill={stroke} />
      <Text text="W" x={-radius - 18} y={-6} fontSize={12} fontStyle="bold" fill={stroke} />

      {/* Bearing Line Arrow */}
      <Arrow
        points={[0, 0, vx, vy]}
        pointerLength={8}
        pointerWidth={6}
        fill={stroke}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />

      {/* Clockwise angle arc from North to Vector */}
      <Arc
        x={0}
        y={0}
        innerRadius={radius * 0.4 - 1}
        outerRadius={radius * 0.4 + 1}
        angle={bearing}
        rotation={-90} // start at top (North)
        fill="transparent"
        stroke="#ef4444"
        strokeWidth={1.5}
      />

      {/* Angle label */}
      <Text
        text={label || `${bearing}°`}
        x={radius * 0.5 * Math.cos(((-90 + bearing / 2) * Math.PI) / 180) - 10}
        y={radius * 0.5 * Math.sin(((-90 + bearing / 2) * Math.PI) / 180) - 5}
        fontSize={11}
        fontStyle="bold"
        fill="#ef4444"
      />
    </Group>
  );
}
