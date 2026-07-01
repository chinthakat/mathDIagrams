import React from 'react';
import { Group, Line, Circle, Shape, Text } from 'react-konva';

// Vertical thermometer: bulb at the bottom, mercury column rising to a temperature reading,
// scale with labelled ticks that can span negative values.
export default function Thermometer({
  width = 22,
  height = 180,
  minTemp = -10,
  maxTemp = 110,
  temperature = 37,
  tickInterval = 10,
  labelInterval = 20,
  liquidColor = '#ef4444',
  fill = '#ffffff',
  stroke = '#1e293b',
  strokeWidth = 2,
  showTicks = true,
  showLabels = true,
  label = '',
}) {
  const w = Math.max(10, Number(width) || 22);
  const h = Math.max(40, Number(height) || 180);
  const tMin = Number(minTemp) ?? -10;
  const tMax = Number(maxTemp) ?? 110;
  const range = Math.max(1, tMax - tMin);
  const tickStep = Math.max(0.5, Number(tickInterval) || 10);
  const labelStep = Math.max(tickStep, Number(labelInterval) || 20);
  const temp = Math.min(tMax, Math.max(tMin, Number(temperature) ?? 37));

  const halfW = w / 2;
  const bulbR = halfW * 1.8;
  const tubeTopY = -h / 2;
  const tubeBottomY = h / 2 - bulbR * 0.6;
  const bulbCy = h / 2 + bulbR * 0.15;

  const valueToY = (v) => tubeBottomY - ((v - tMin) / range) * (tubeBottomY - tubeTopY);
  const mercuryTopY = valueToY(temp);

  const ticks = [];
  const startTick = Math.ceil(tMin / tickStep) * tickStep;
  for (let v = startTick; v <= tMax + 1e-6; v += tickStep) ticks.push(Math.round(v * 100) / 100);

  return (
    <Group>
      {/* Tube outline + bulb */}
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          ctx.moveTo(-halfW, tubeTopY);
          ctx.lineTo(-halfW, tubeBottomY);
          ctx.lineTo(halfW, tubeBottomY);
          ctx.lineTo(halfW, tubeTopY);
          ctx.closePath();
          ctx.fillStrokeShape(shape);
        }}
        fill={fill}
      />
      <Circle x={0} y={bulbCy} radius={bulbR} fill={fill} />

      {/* Mercury: bulb always full + column up to reading */}
      <Circle x={0} y={bulbCy} radius={bulbR * 0.72} fill={liquidColor} />
      <Line
        points={[-w * 0.28, mercuryTopY, w * 0.28, mercuryTopY, w * 0.28, tubeBottomY, -w * 0.28, tubeBottomY]}
        closed
        fill={liquidColor}
      />

      {/* Ticks along the right side */}
      {showTicks && ticks.map((v) => {
        const y = valueToY(v);
        const isMajor = Math.round((v - tMin) * 10) % Math.round(labelStep * 10) === 0;
        const tickLen = isMajor ? 9 : 5;
        return (
          <Group key={`tick-${v}`}>
            <Line points={[halfW, y, halfW + tickLen, y]} stroke={stroke} strokeWidth={1} />
            {isMajor && showLabels && (
              <Text x={halfW + tickLen + 3} y={y - 6} width={30} align="left" text={`${Math.round(v)}°`} fontSize={10} fill={stroke} />
            )}
          </Group>
        );
      })}

      {/* Outline drawn last so it stays crisp above the mercury fill */}
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          ctx.moveTo(-halfW, tubeTopY);
          ctx.lineTo(-halfW, tubeBottomY);
          ctx.lineTo(halfW, tubeBottomY);
          ctx.lineTo(halfW, tubeTopY);
          ctx.closePath();
          ctx.fillStrokeShape(shape);
        }}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <Circle x={0} y={bulbCy} radius={bulbR} stroke={stroke} strokeWidth={strokeWidth} />
      <Line points={[-halfW - 2, tubeTopY, halfW + 2, tubeTopY]} stroke={stroke} strokeWidth={strokeWidth} />

      {label && (
        <Text x={-w * 3} y={bulbCy + bulbR + 14} width={w * 6} align="center" text={label} fontSize={13} fontStyle="bold" fill={stroke} />
      )}
    </Group>
  );
}
