import React from 'react';
import { Group, Circle, Text, Line } from 'react-konva';

export default function CompassRose({ 
  radius = 60, 
  color = "#334155", // slate dark
  fill = "#cbd5e1", // slate light
  fontSize = 14,
  rotation = 0
}) {
  // Let's create a beautiful deluxe bevelled nautical compass rose
  const lightGold = "#fbbf24";
  const darkGold = "#b45309";
  const lightSlate = "#94a3b8";
  const darkSlate = "#475569";

  // Helper to draw a bevelled pointer pointing at a specific angle (in degrees)
  const drawBevelledPointer = (angle, length, width, colorLit, colorShaded) => {
    const rad = (angle * Math.PI) / 180;
    const radLeft = ((angle - 90) * Math.PI) / 180;
    const radRight = ((angle + 90) * Math.PI) / 180;

    // Tip point
    const tx = Math.cos(rad) * length;
    const ty = Math.sin(rad) * length;

    // Base point (inner indentation)
    const bx = Math.cos(rad) * (length * 0.25);
    const by = Math.sin(rad) * (length * 0.25);

    // Left flare corner
    const lx = bx + Math.cos(radLeft) * width;
    const ly = by + Math.sin(radLeft) * width;

    // Right flare corner
    const rx = bx + Math.cos(radRight) * width;
    const ry = by + Math.sin(radRight) * width;

    return (
      <Group key={`pointer-${angle}`}>
        {/* Left Lit Facet */}
        <Line
          points={[0, 0, tx, ty, lx, ly]}
          fill={colorLit}
          closed={true}
        />
        {/* Right Shaded Facet */}
        <Line
          points={[0, 0, tx, ty, rx, ry]}
          fill={colorShaded}
          closed={true}
        />
      </Group>
    );
  };

  // Generate 24 small tick lines around outer circle
  const ticks = [];
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * 360;
    const rad = (angle * Math.PI) / 180;
    const innerR = radius * 0.92;
    const outerR = radius;
    ticks.push(
      <Line
        key={`tick-${i}`}
        points={[
          Math.cos(rad) * innerR, Math.sin(rad) * innerR,
          Math.cos(rad) * outerR, Math.sin(rad) * outerR
        ]}
        stroke={color}
        strokeWidth={1}
      />
    );
  }

  return (
    <Group rotation={rotation}>
      {/* Outer delicate ring */}
      <Circle
        radius={radius}
        stroke={color}
        strokeWidth={1.5}
        fill={fill}
      />

      {/* Inner tick markers ring */}
      <Circle
        radius={radius * 0.92}
        stroke={color}
        strokeWidth={1}
        dash={[1, 3]}
      />

      {ticks}

      {/* Intermediate pointers (NE, SE, SW, NW) - drawn first so they sit in background */}
      {drawBevelledPointer(45, radius * 0.7, radius * 0.16, lightSlate, darkSlate)}
      {drawBevelledPointer(135, radius * 0.7, radius * 0.16, lightSlate, darkSlate)}
      {drawBevelledPointer(225, radius * 0.7, radius * 0.16, lightSlate, darkSlate)}
      {drawBevelledPointer(315, radius * 0.7, radius * 0.16, lightSlate, darkSlate)}

      {/* Cardinal pointers (N, E, S, W) - larger, gold */}
      {drawBevelledPointer(270, radius * 0.92, radius * 0.22, lightGold, darkGold)} {/* North */}
      {drawBevelledPointer(0, radius * 0.92, radius * 0.22, lightGold, darkGold)}   {/* East */}
      {drawBevelledPointer(90, radius * 0.92, radius * 0.22, lightGold, darkGold)}  {/* South */}
      {drawBevelledPointer(180, radius * 0.92, radius * 0.22, lightGold, darkGold)} {/* West */}

      {/* Center cap disk */}
      <Circle
        radius={radius * 0.2}
        stroke={color}
        strokeWidth={1}
        fill="#f8fafc"
      />
      <Circle
        radius={radius * 0.1}
        fill={darkGold}
      />

      {/* Cardinal Labels */}
      <Text
        text="N"
        x={-8}
        y={-radius - fontSize - 6}
        fontSize={fontSize + 2}
        fontStyle="bold"
        fill="#1e293b"
      />
      <Text
        text="S"
        x={-7}
        y={radius + 4}
        fontSize={fontSize + 2}
        fontStyle="bold"
        fill="#1e293b"
      />
      <Text
        text="E"
        x={radius + 6}
        y={-(fontSize + 2)/2}
        fontSize={fontSize + 2}
        fontStyle="bold"
        fill="#1e293b"
      />
      <Text
        text="W"
        x={-radius - fontSize - 8}
        y={-(fontSize + 2)/2}
        fontSize={fontSize + 2}
        fontStyle="bold"
        fill="#1e293b"
      />
    </Group>
  );
}
