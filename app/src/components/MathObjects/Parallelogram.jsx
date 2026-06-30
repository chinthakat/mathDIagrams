import React from 'react';
import { Line } from 'react-konva';

export default function Parallelogram({ width = 120, height = 60, skew = 0.25, fill = '#3b82f6', stroke = '#1e40af', strokeWidth = 1.5 }) {
  const w = Math.max(4, Number(width) || 120);
  const h = Math.max(4, Number(height) || 60);
  const sk = Math.min(0.45, Math.max(-0.45, Number(skew) || 0.25)) * w;
  const hw = w / 2, hh = h / 2;
  // bottom-left, bottom-right, top-right, top-left — skewed horizontally
  const points = [-hw + sk, hh, hw + sk, hh, hw - sk, -hh, -hw - sk, -hh];
  return <Line points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} closed  />;
}
