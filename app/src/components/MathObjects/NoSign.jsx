import React from 'react';
import { Group, Circle, Line } from 'react-konva';

export default function NoSign({ width = 80, height = 80, fill = '#fee2e2', stroke = '#ef4444', strokeWidth = 3 }) {
  const r = Math.min(Number(width) || 80, Number(height) || 80) / 2;
  const sw = Math.max(1, Number(strokeWidth) || 3);
  const diag = r * Math.cos(Math.PI / 4);
  return (
    <Group>
      <Circle radius={r} fill={fill} stroke={stroke} strokeWidth={sw} listening={false} />
      <Line points={[-diag, -diag, diag, diag]} stroke={stroke} strokeWidth={sw * 1.5} listening={false} />
    </Group>
  );
}
