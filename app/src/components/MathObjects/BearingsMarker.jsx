import React from 'react';
import { Group, Line, Text, Arrow, Arc } from 'react-konva';

export default function BearingsMarker({ bearing = 0, radius = 80, stroke = '#0f172a', strokeWidth = 2, label = '' }) {
  const getNumeric = (val, fallback) => {
    const num = Number(val);
    return Number.isNaN(num) ? fallback : num;
  };

  const cleanBearing = getNumeric(bearing, 0);
  const cleanRadius = getNumeric(radius, 80);

  // Bearings are measured clockwise from North (0 degrees at top)
  // Standard math coordinate system has 0 degrees at right (East), counter-clockwise.
  // Conversion:
  // North (0 bearing) -> math angle is -90 degrees (or 270).
  // Bearing angle grows clockwise -> math angle is -90 + bearing.
  const bearingAngleRad = ((-90 + cleanBearing) * Math.PI) / 180;
  
  const vx = cleanRadius * Math.cos(bearingAngleRad);
  const vy = cleanRadius * Math.sin(bearingAngleRad);

  return (
    <Group>
      {/* North-South Axis */}
      <Line
        points={[0, -cleanRadius, 0, cleanRadius]}
        stroke="#94a3b8"
        strokeWidth={1}
        dash={[4, 4]}
      />
      {/* East-West Axis */}
      <Line
        points={[-cleanRadius, 0, cleanRadius, 0]}
        stroke="#94a3b8"
        strokeWidth={1}
        dash={[4, 4]}
      />

      {/* Axis Labels */}
      <Text text="N" x={-5} y={-cleanRadius - 15} fontSize={12} fontStyle="bold" fill={stroke} />
      <Text text="S" x={-5} y={cleanRadius + 5} fontSize={12} fontStyle="bold" fill={stroke} />
      <Text text="E" x={cleanRadius + 8} y={-6} fontSize={12} fontStyle="bold" fill={stroke} />
      <Text text="W" x={-cleanRadius - 18} y={-6} fontSize={12} fontStyle="bold" fill={stroke} />

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
        innerRadius={cleanRadius * 0.4 - 1}
        outerRadius={cleanRadius * 0.4 + 1}
        angle={cleanBearing}
        rotation={-90} // start at top (North)
        fill="transparent"
        stroke="#ef4444"
        strokeWidth={1.5}
      />

      {/* Angle label */}
      <Text
        text={label || `${cleanBearing}°`}
        x={cleanRadius * 0.5 * Math.cos(((-90 + cleanBearing / 2) * Math.PI) / 180) - 10}
        y={cleanRadius * 0.5 * Math.sin(((-90 + cleanBearing / 2) * Math.PI) / 180) - 5}
        fontSize={11}
        fontStyle="bold"
        fill="#ef4444"
      />
    </Group>
  );
}
