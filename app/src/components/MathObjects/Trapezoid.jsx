import React from 'react';
import { Line } from 'react-konva';

export default function Trapezoid({ width = 120, height = 60, topRatio = 0.55, fill = '#3b82f6', stroke = '#1e40af', strokeWidth = 1.5 }) {
  const w = Math.max(4, Number(width) || 120);
  const h = Math.max(4, Number(height) || 60);
  const tr = Math.min(0.98, Math.max(0.05, Number(topRatio) || 0.55));
  const hw = w / 2, hh = h / 2, tw = (w * tr) / 2;
  const points = [-hw, hh, hw, hh, tw, -hh, -tw, -hh];
  return <Line points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} closed listening={false} />;
}
