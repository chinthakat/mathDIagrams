import React from 'react';
import { Group, Rect, Text } from 'react-konva';

export default function WeighingScale({
  width = 160,
  height = 80,
  weightText = '0 kg',
  fill = '#ffffff',
  stroke = '#000000',
  strokeWidth = 2,
}) {
  const w = Number(width);
  const h = Number(height);
  const sw = Number(strokeWidth);

  // Readout display dimensions
  const displayW = w * 0.6;
  const displayH = h * 0.4;
  const displayX = -displayW / 2;
  const displayY = h / 2 - displayH - h * 0.1;

  return (
    <Group>
      {/* Platform scale base */}
      <Rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        cornerRadius={8}
      />

      {/* Readout screen */}
      <Rect
        x={displayX}
        y={displayY}
        width={displayW}
        height={displayH}
        fill="#f8fafc"
        stroke={stroke}
        strokeWidth={sw}
        cornerRadius={4}
      />

      {/* Weight display text */}
      {weightText && (
        <Text
          text={weightText}
          x={displayX}
          y={displayY + displayH * 0.2}
          width={displayW}
          align="center"
          fontSize={displayH * 0.6}
          fontStyle="bold"
          fill="#0f172a"
          fontFamily="Courier New, monospace"
        />
      )}
    </Group>
  );
}
