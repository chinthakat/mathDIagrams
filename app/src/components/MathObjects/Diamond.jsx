import React from 'react';
import { Line } from 'react-konva';

export default function Diamond({ width = 100, height = 70, fill = '#3b82f6', stroke = '#1e40af', strokeWidth = 1.5 }) {
  const hw = Math.max(4, Number(width) || 100) / 2;
  const hh = Math.max(4, Number(height) || 70) / 2;
  // top, right, bottom, left
  const points = [0, -hh, hw, 0, 0, hh, -hw, 0];
  return <Line points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} closed listening={false} />;
}
