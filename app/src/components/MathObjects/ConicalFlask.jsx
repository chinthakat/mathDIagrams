import React from 'react';
import { Group, Line, Text } from 'react-konva';

// Erlenmeyer/conical flask: narrow neck at top, wide flat base, tapered sides.
export default function ConicalFlask({
  width = 130,
  height = 140,
  neckWidth = 34,
  neckHeightRatio = 0.4,
  capacity = 250,
  liquidLevel = 120,
  liquidColor = '#d9d9d9',
  fill = '#ffffff',
  stroke = '#1e293b',
  strokeWidth = 2,
  label = '',
}) {
  const w = Math.max(30, Number(width) || 130);
  const h = Math.max(30, Number(height) || 140);
  const neckW = Math.min(w * 0.6, Math.max(10, Number(neckWidth) || 34));
  const neckHRatio = Math.min(0.8, Math.max(0.1, Number(neckHeightRatio) || 0.4));
  const cap = Math.max(1, Number(capacity) || 250);
  const level = Math.min(cap, Math.max(0, Number(liquidLevel) || 0));

  const halfH = h / 2;
  const neckH = h * neckHRatio;
  const neckTopY = -halfH;
  const neckBottomY = -halfH + neckH;
  const baseY = halfH;

  const widthAtY = (y) => {
    if (y <= neckBottomY) return neckW;
    const t = (y - neckBottomY) / (baseY - neckBottomY);
    return neckW + t * (w - neckW);
  };

  const bodyPoints = [
    -neckW / 2, neckTopY,
    neckW / 2, neckTopY,
    neckW / 2, neckBottomY,
    w / 2, baseY,
    -w / 2, baseY,
    -neckW / 2, neckBottomY,
  ];

  const fillFraction = level / cap;
  const liquidTopY = baseY - fillFraction * h;
  let liquidPoints = [];
  if (level > 0) {
    if (liquidTopY <= neckBottomY) {
      liquidPoints = [
        -neckW / 2, liquidTopY,
        neckW / 2, liquidTopY,
        neckW / 2, neckBottomY,
        w / 2, baseY,
        -w / 2, baseY,
        -neckW / 2, neckBottomY,
      ];
    } else {
      const lw = widthAtY(liquidTopY);
      liquidPoints = [
        -lw / 2, liquidTopY,
        lw / 2, liquidTopY,
        w / 2, baseY,
        -w / 2, baseY,
      ];
    }
  }

  return (
    <Group>
      <Line points={bodyPoints} closed fill={fill} />
      {level > 0 && <Line points={liquidPoints} closed fill={liquidColor} />}
      <Line points={bodyPoints} closed stroke={stroke} strokeWidth={strokeWidth} />
      {/* Rim lip at the neck opening */}
      <Line points={[-neckW / 2 - 3, neckTopY, neckW / 2 + 3, neckTopY]} stroke={stroke} strokeWidth={strokeWidth + 1} />

      {label && (
        <Text x={-w / 2} y={baseY + 12} width={w} align="center" text={label} fontSize={14} fontStyle="bold" fill={stroke} />
      )}
    </Group>
  );
}
