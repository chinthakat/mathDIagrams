import React from 'react';
import { Group, Line, Shape, Text } from 'react-konva';

// Narrow tube with a rounded bottom, optional coarse graduation marks, liquid fill.
export default function TestTube({
  width = 34,
  height = 150,
  capacity = 20,
  tickInterval = 5,
  labelInterval = 10,
  liquidLevel = 12,
  liquidColor = '#d9d9d9',
  fill = '#ffffff',
  stroke = '#1e293b',
  strokeWidth = 2,
  showTicks = true,
  showLabels = false,
  label = '',
}) {
  const w = Math.max(10, Number(width) || 34);
  const h = Math.max(30, Number(height) || 150);
  const cap = Math.max(1, Number(capacity) || 20);
  const tickStep = Math.max(0.5, Number(tickInterval) || 5);
  const labelStep = Math.max(tickStep, Number(labelInterval) || 10);
  const level = Math.min(cap, Math.max(0, Number(liquidLevel) || 0));

  const halfW = w / 2;
  const straightH = h - halfW; // bottom `halfW` reserved for the rounded cap
  const topY = -h / 2;
  const straightBottomY = topY + straightH;

  const valueToY = (v) => straightBottomY - (v / cap) * straightH;

  const level0Y = straightBottomY;
  const liquidTopY = valueToY(level);

  const ticks = [];
  for (let v = 0; v <= cap + 1e-6; v += tickStep) ticks.push(Math.round(v * 100) / 100);

  return (
    <Group>
      {/* Tube outline: two straight sides + rounded bottom, open top */}
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          ctx.moveTo(-halfW, topY);
          ctx.lineTo(-halfW, straightBottomY);
          ctx.arc(0, straightBottomY, halfW, Math.PI, 0, false);
          ctx.lineTo(halfW, topY);
          ctx.fillStrokeShape(shape);
        }}
        fill={fill}
      />

      {/* Liquid fill, clipped to the tube's rounded-bottom silhouette */}
      {level > 0 && (
        <Shape
          sceneFunc={(ctx, shape) => {
            ctx.beginPath();
            ctx.moveTo(-halfW, topY);
            ctx.lineTo(-halfW, straightBottomY);
            ctx.arc(0, straightBottomY, halfW, Math.PI, 0, false);
            ctx.lineTo(halfW, topY);
            ctx.closePath();
            ctx.clip();
            ctx.fillStyle = liquidColor;
            ctx.fillRect(-halfW - 2, liquidTopY, w + 4, level0Y - liquidTopY + halfW + 4);
          }}
          listening={false}
        />
      )}

      {showTicks && ticks.map((v) => {
        const y = valueToY(v);
        const isMajor = Math.round(v * 10) % Math.round(labelStep * 10) === 0;
        const tickLen = isMajor ? 9 : 5;
        return (
          <Group key={`tick-${v}`}>
            <Line points={[halfW - tickLen, y, halfW, y]} stroke={stroke} strokeWidth={1} />
            {isMajor && showLabels && (
              <Text x={halfW + 4} y={y - 6} width={26} align="left" text={String(v % 1 === 0 ? v : v.toFixed(1))} fontSize={10} fill={stroke} />
            )}
          </Group>
        );
      })}

      {/* Outline drawn last so it stays crisp above the liquid */}
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          ctx.moveTo(-halfW, topY);
          ctx.lineTo(-halfW, straightBottomY);
          ctx.arc(0, straightBottomY, halfW, Math.PI, 0, false);
          ctx.lineTo(halfW, topY);
          ctx.fillStrokeShape(shape);
        }}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Rim lip */}
      <Line points={[-halfW - 2, topY, halfW + 2, topY]} stroke={stroke} strokeWidth={strokeWidth} />

      {label && (
        <Text x={-w} y={h / 2 + halfW + 12} width={w * 3} align="center" text={label} fontSize={13} fontStyle="bold" fill={stroke} />
      )}
    </Group>
  );
}
