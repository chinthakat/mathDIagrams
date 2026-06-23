import React from 'react';
import { Group, Rect, Line, Text } from 'react-konva';

export default function Ruler({ length, units, fill, stroke, strokeWidth }) {
  const pixelsPerUnit = length / units;
  const ticks = [];
  
  for (let i = 0; i <= units; i++) {
    const x = i * pixelsPerUnit;
    // Major tick every unit
    ticks.push(
      <Group key={`major-${i}`}>
        <Line points={[x, 0, x, 15]} stroke={stroke} strokeWidth={1} />
        <Text text={i.toString()} x={x - 5} y={18} fontSize={10} fill={stroke} />
      </Group>
    );
    
    // Minor ticks (half units)
    if (i < units) {
      ticks.push(
        <Line key={`minor-${i}`} points={[x + pixelsPerUnit/2, 0, x + pixelsPerUnit/2, 8]} stroke={stroke} strokeWidth={1} />
      );
    }
  }

  return (
    <Group>
      {/* Ruler Body */}
      <Rect width={length} height={40} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      {/* Ruler Ticks */}
      <Group y={0}>{ticks}</Group>
    </Group>
  );
}
