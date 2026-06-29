import React from 'react';
import { Group, Circle, Line, Text, Arrow } from 'react-konva';

export default function Annulus({ innerRadius = 30, outerRadius = 60, fill, stroke = '#334155', strokeWidth = 2, showLabels = true }) {
  const numInner = Number(innerRadius);
  const cleanInner = Number.isNaN(numInner) ? 30 : numInner;
  const numOuter = Number(outerRadius);
  const cleanOuter = Number.isNaN(numOuter) ? 60 : numOuter;

  return (
    <Group>
      {/* Shaded ring region */}
      <Circle
        radius={cleanOuter}
        fill={fill}
        stroke="transparent"
      />
      <Circle
        radius={cleanInner}
        fill="#ffffff"
        stroke="transparent"
      />

      {/* Borders */}
      <Circle
        radius={outerRadius}
        fill="transparent"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <Circle
        radius={cleanInner}
        fill="transparent"
        stroke={stroke}
        strokeWidth={strokeWidth}
        dash={[4, 4]} // Inner circle dotted border for aesthetic clarity
      />

      {/* Measurement Labels */}
      {showLabels && (
        <Group>
          {/* Inner radius arrow */}
          <Arrow
            points={[0, 0, cleanInner * Math.cos(Math.PI / 4), -cleanInner * Math.sin(Math.PI / 4)]}
            pointerLength={5}
            pointerWidth={4}
            fill={stroke}
            stroke={stroke}
            strokeWidth={1.5}
          />
          <Text
            text={`${cleanInner} px`}
            x={cleanInner * 0.4 * Math.cos(Math.PI / 4) - 20}
            y={-cleanInner * 0.4 * Math.sin(Math.PI / 4) - 15}
            fontSize={12}
            fill={stroke}
          />

          {/* Outer radius arrow */}
          <Arrow
            points={[0, 0, cleanOuter * Math.cos(-Math.PI / 6), -cleanOuter * Math.sin(-Math.PI / 6)]}
            pointerLength={5}
            pointerWidth={4}
            fill={stroke}
            stroke={stroke}
            strokeWidth={1.5}
          />
          <Text
            text={`${cleanOuter} px`}
            x={cleanOuter * 0.7 * Math.cos(-Math.PI / 6) + 5}
            y={-cleanOuter * 0.7 * Math.sin(-Math.PI / 6) - 5}
            fontSize={12}
            fill={stroke}
          />
        </Group>
      )}
    </Group>
  );
}
