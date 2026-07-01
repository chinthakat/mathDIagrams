import React from 'react';
import { Group, Line, Rect, Text } from 'react-konva';

// Stylised Bunsen burner: flared base, barrel with an air-hole collar, two-tone flame.
export default function BunsenBurner({
  width = 60,
  height = 130,
  flameHeight = 46,
  showFlame = true,
  flameColor = '#60a5fa',
  innerFlameColor = '#bfdbfe',
  baseColor = '#334155',
  barrelColor = '#94a3b8',
  stroke = '#1e293b',
  strokeWidth = 2,
  label = '',
}) {
  const w = Math.max(20, Number(width) || 60);
  const h = Math.max(40, Number(height) || 130);
  const flameH = Math.max(10, Number(flameHeight) || 46);

  const baseH = h * 0.16;
  const barrelH = h - baseH;
  const barrelW = w * 0.32;
  const baseW = w;

  const barrelBottomY = h / 2;
  const barrelTopY = barrelBottomY - barrelH;
  const collarY = barrelBottomY - barrelH * 0.22;

  const basePoints = [
    -baseW / 2, barrelBottomY,
    baseW / 2, barrelBottomY,
    baseW * 0.32, barrelBottomY - baseH,
    -baseW * 0.32, barrelBottomY - baseH,
  ];

  const flamePoints = [
    0, barrelTopY - flameH,
    barrelW * 0.42, barrelTopY - flameH * 0.55,
    barrelW * 0.3, barrelTopY - flameH * 0.15,
    barrelW * 0.18, barrelTopY,
    -barrelW * 0.18, barrelTopY,
    -barrelW * 0.3, barrelTopY - flameH * 0.15,
    -barrelW * 0.42, barrelTopY - flameH * 0.55,
  ];

  const innerFlamePoints = [
    0, barrelTopY - flameH * 0.62,
    barrelW * 0.2, barrelTopY - flameH * 0.28,
    barrelW * 0.12, barrelTopY,
    -barrelW * 0.12, barrelTopY,
    -barrelW * 0.2, barrelTopY - flameH * 0.28,
  ];

  return (
    <Group>
      {/* Flared foot */}
      <Line points={basePoints} closed fill={baseColor} stroke={stroke} strokeWidth={strokeWidth} />

      {/* Barrel */}
      <Rect x={-barrelW / 2} y={barrelTopY} width={barrelW} height={barrelH} fill={barrelColor} stroke={stroke} strokeWidth={strokeWidth} />
      {/* Air-hole adjustment collar */}
      <Rect x={-barrelW / 2 - 2} y={collarY} width={barrelW + 4} height={barrelH * 0.14} fill={baseColor} stroke={stroke} strokeWidth={1} />

      {showFlame && (
        <Group>
          <Line points={flamePoints} closed fill={flameColor} tension={0.4} />
          <Line points={innerFlamePoints} closed fill={innerFlameColor} tension={0.4} />
        </Group>
      )}

      {label && (
        <Text x={-w} y={barrelBottomY + 12} width={w * 3} align="center" text={label} fontSize={13} fontStyle="bold" fill={stroke} />
      )}
    </Group>
  );
}
