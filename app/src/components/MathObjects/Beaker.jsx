import React from 'react';
import { Group, Line, Text } from 'react-konva';

// Straight-sided lab beaker with a slight taper and a pour spout, tick-marked scale, liquid fill.
export default function Beaker({
  width = 110,
  height = 130,
  capacity = 500,
  tickInterval = 100,
  labelInterval = 100,
  liquidLevel = 300,
  liquidColor = '#d9d9d9',
  fill = '#ffffff',
  stroke = '#1e293b',
  strokeWidth = 2,
  showTicks = true,
  showLabels = true,
  label = '',
}) {
  const w = Math.max(20, Number(width) || 110);
  const h = Math.max(20, Number(height) || 130);
  const cap = Math.max(1, Number(capacity) || 500);
  const tickStep = Math.max(1, Number(tickInterval) || 100);
  const labelStep = Math.max(tickStep, Number(labelInterval) || 100);
  const level = Math.min(cap, Math.max(0, Number(liquidLevel) || 0));

  const halfH = h / 2;
  const topW = w;
  const bottomW = w * 0.86;
  const spoutW = Math.min(16, w * 0.18);
  const spoutH = Math.min(10, h * 0.08);

  const widthAtY = (y) => {
    const t = (y - -halfH) / h; // 0 at top, 1 at bottom
    return topW + t * (bottomW - topW);
  };
  const valueToY = (v) => halfH - (v / cap) * h;

  const bodyPoints = [
    -topW / 2, -halfH,
    topW / 2 - spoutW, -halfH,
    topW / 2, -halfH - spoutH,
    topW / 2 + 4, -halfH + 3,
    bottomW / 2, halfH,
    -bottomW / 2, halfH,
  ];

  const liquidTopY = valueToY(level);
  const liquidTopW = widthAtY(liquidTopY);
  const liquidPoints = level > 0 ? [
    -liquidTopW / 2, liquidTopY,
    liquidTopW / 2, liquidTopY,
    bottomW / 2, halfH,
    -bottomW / 2, halfH,
  ] : [];

  const ticks = [];
  for (let v = 0; v <= cap + 1e-6; v += tickStep) ticks.push(Math.round(v * 100) / 100);

  return (
    <Group>
      <Line points={bodyPoints} closed stroke="" strokeWidth={0} fill={fill} />

      {level > 0 && <Line points={liquidPoints} closed fill={liquidColor} />}

      {showTicks && ticks.map((v) => {
        const y = valueToY(v);
        const xEdge = -widthAtY(y) / 2;
        const isMajor = Math.round(v) % labelStep === 0;
        const tickLen = isMajor ? 10 : 6;
        return (
          <Group key={`tick-${v}`}>
            <Line points={[xEdge - tickLen, y, xEdge, y]} stroke={stroke} strokeWidth={1} />
            {isMajor && showLabels && (
              <Text x={xEdge - tickLen - 36} y={y - 6} width={32} align="right" text={String(Math.round(v))} fontSize={11} fill={stroke} />
            )}
          </Group>
        );
      })}

      {/* Outline drawn last so it stays crisp above the liquid */}
      <Line points={bodyPoints} closed stroke={stroke} strokeWidth={strokeWidth} />
      {/* Spout rim accent */}
      <Line points={[topW / 2 - spoutW, -halfH, topW / 2, -halfH - spoutH, topW / 2 + 4, -halfH + 3]} stroke={stroke} strokeWidth={strokeWidth} />

      {label && (
        <Text x={-w / 2} y={halfH + 12} width={w} align="center" text={label} fontSize={14} fontStyle="bold" fill={stroke} />
      )}
    </Group>
  );
}
