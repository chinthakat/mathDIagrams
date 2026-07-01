import React from 'react';
import { Group, Rect, Line, Text } from 'react-konva';

export default function GraduatedCylinder({
  width = 90,
  height = 220,
  capacity = 250,
  tickInterval = 10,
  labelInterval = 50,
  liquidLevel = 150,
  liquidColor = '#d9d9d9',
  fill = '#ffffff',
  stroke = '#1e293b',
  strokeWidth = 2,
  showTicks = true,
  showLabels = true,
  submergedCubes = 0,
  label = '',
}) {
  const w = Math.max(20, Number(width) || 90);
  const h = Math.max(20, Number(height) || 220);
  const cap = Math.max(1, Number(capacity) || 250);
  const tickStep = Math.max(1, Number(tickInterval) || 10);
  const labelStep = Math.max(tickStep, Number(labelInterval) || 50);
  const level = Math.min(cap, Math.max(0, Number(liquidLevel) || 0));

  const halfW = w / 2;
  const halfH = h / 2;
  const valueToY = (v) => halfH - (v / cap) * h;

  const ticks = [];
  for (let v = 0; v <= cap + 1e-6; v += tickStep) ticks.push(Math.round(v * 100) / 100);

  const liquidTopY = valueToY(level);
  const liquidH = halfH - liquidTopY;

  const cubesPerRow = 3;
  const cubeSize = Math.max(8, w / 6);
  const cubeGap = cubeSize * 0.3;
  const cubeRows = Math.ceil(submergedCubes / cubesPerRow);
  const gridW = cubesPerRow * cubeSize + (cubesPerRow - 1) * cubeGap;
  const gridStartX = -gridW / 2;
  const gridBottomY = halfH - 4;

  return (
    <Group>
      {/* Container background */}
      <Rect x={-halfW} y={-halfH} width={w} height={h} fill={fill} />

      {/* Liquid fill, bottom-aligned */}
      {level > 0 && (
        <Rect x={-halfW} y={liquidTopY} width={w} height={liquidH} fill={liquidColor} />
      )}

      {/* Tick marks + labels along the left edge */}
      {showTicks && ticks.map((v) => {
        const y = valueToY(v);
        const isMajor = Math.round(v) % labelStep === 0;
        const tickLen = isMajor ? 10 : 6;
        return (
          <Group key={`tick-${v}`}>
            <Line points={[-halfW - tickLen, y, -halfW, y]} stroke={stroke} strokeWidth={1} />
            {isMajor && showLabels && (
              <Text
                x={-halfW - tickLen - 34}
                y={y - 6}
                width={30}
                align="right"
                text={String(Math.round(v))}
                fontSize={12}
                fill={stroke}
              />
            )}
          </Group>
        );
      })}

      {/* Submerged cubes / solid objects (e.g. volume displacement) */}
      {submergedCubes > 0 && Array.from({ length: submergedCubes }).map((_, i) => {
        const row = Math.floor(i / cubesPerRow);
        const col = i % cubesPerRow;
        const rowFromBottom = cubeRows - 1 - row;
        const x = gridStartX + col * (cubeSize + cubeGap);
        const y = gridBottomY - (rowFromBottom + 1) * cubeSize - rowFromBottom * cubeGap;
        return (
          <Rect key={`cube-${i}`} x={x} y={y} width={cubeSize} height={cubeSize} fill={fill} stroke={stroke} strokeWidth={1} />
        );
      })}

      {/* Border drawn last so it stays crisp above the liquid fill */}
      <Rect x={-halfW} y={-halfH} width={w} height={h} stroke={stroke} strokeWidth={strokeWidth} />

      {/* Caption below the cylinder */}
      {label && (
        <Text x={-halfW} y={halfH + 12} width={w} align="center" text={label} fontSize={14} fontStyle="bold" fill={stroke} />
      )}
    </Group>
  );
}
