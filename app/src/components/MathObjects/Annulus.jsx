import React from 'react';
import { Group, Circle, Line, Text, Arrow } from 'react-konva';

export default function Annulus({ innerRadius, outerRadius, fill, stroke, strokeWidth, showLabels = true }) {
  // Use Konva Group containing two concentric circles
  // We can fill the region between them using the fill rule or standard circles overlay.
  // In Konva, to get a ring/annulus shape filled correctly with a transparent center,
  // we can use a custom Path or simply draw a outer filled circle and draw an inner circle filled with background color (transparent/white).
  // Alternatively, we can draw a Konva Ring component if it exists, or Konva Path.
  // Actually, Konva Ring is a built-in shape! Let's check:
  // Yes! Konva Ring has innerRadius and outerRadius. It is perfect.
  // Let's import Ring from react-konva if possible, or build it using a custom path to be safe.
  // Let's use custom Konva Path or Ring. Let's see if Ring is supported. Let's import it from react-konva.
  // To be super safe and compatible with standard Konva exports, let's draw:
  // 1. Outer circle filled with `fill`
  // 2. Inner circle filled with `#ffffff` (to clear out the center)
  // Let's also draw border circles for both inner and outer bounds.
  
  return (
    <Group>
      {/* Shaded ring region */}
      <Circle
        radius={outerRadius}
        fill={fill}
        stroke="transparent"
      />
      <Circle
        radius={innerRadius}
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
        radius={innerRadius}
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
            points={[0, 0, innerRadius * Math.cos(Math.PI / 4), -innerRadius * Math.sin(Math.PI / 4)]}
            pointerLength={5}
            pointerWidth={4}
            fill={stroke}
            stroke={stroke}
            strokeWidth={1.5}
          />
          <Text
            text={`${innerRadius} px`}
            x={innerRadius * 0.4 * Math.cos(Math.PI / 4) - 20}
            y={-innerRadius * 0.4 * Math.sin(Math.PI / 4) - 15}
            fontSize={12}
            fill={stroke}
          />

          {/* Outer radius arrow */}
          <Arrow
            points={[0, 0, outerRadius * Math.cos(-Math.PI / 6), -outerRadius * Math.sin(-Math.PI / 6)]}
            pointerLength={5}
            pointerWidth={4}
            fill={stroke}
            stroke={stroke}
            strokeWidth={1.5}
          />
          <Text
            text={`${outerRadius} px`}
            x={outerRadius * 0.7 * Math.cos(-Math.PI / 6) + 5}
            y={-outerRadius * 0.7 * Math.sin(-Math.PI / 6) - 5}
            fontSize={12}
            fill={stroke}
          />
        </Group>
      )}
    </Group>
  );
}
