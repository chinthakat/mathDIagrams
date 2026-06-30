import React from 'react';
import { Line } from 'react-konva';

export default function LightningBolt({ width = 60, height = 100, fill = '#fbbf24', stroke = '#92400e', strokeWidth = 1.5 }) {
  const w = Math.max(4, Number(width) || 60);
  const h = Math.max(4, Number(height) || 100);
  const hw = w / 2, hh = h / 2;
  // Classic lightning bolt: top-right down to mid-left, jutting right, then bottom-left
  const points = [
    hw * 0.2, -hh,       // top-right
    -hw * 0.05, hh * 0.05, // mid-left (upper)
    hw * 0.4, hh * 0.05,   // mid-right
    -hw * 0.2, hh,        // bottom-left
    hw * 0.05, -hh * 0.05, // mid-right (lower)
    -hw * 0.4, -hh * 0.05, // mid-left
  ];
  return <Line points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} closed  />;
}
