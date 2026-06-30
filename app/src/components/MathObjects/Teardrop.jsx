import React from 'react';
import { Path } from 'react-konva';

export default function Teardrop({ width = 60, height = 90, fill = '#3b82f6', stroke = '#1e40af', strokeWidth = 1.5 }) {
  const w = Math.max(4, Number(width) || 60);
  const h = Math.max(4, Number(height) || 90);
  const hw = w / 2, hh = h / 2;
  const r = hw;  // circle radius at base = half-width
  const tipY = -hh;
  const circleY = hh - r;
  const d = [
    `M 0 ${tipY}`,
    `C ${hw * 0.6} ${tipY + (hh - r) * 0.6} ${hw} ${circleY - r * 0.5} ${hw} ${circleY}`,
    `A ${r} ${r} 0 1 1 ${-hw} ${circleY}`,
    `C ${-hw} ${circleY - r * 0.5} ${-hw * 0.6} ${tipY + (hh - r) * 0.6} 0 ${tipY}`,
    'Z',
  ].join(' ');
  return <Path data={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth}  />;
}
