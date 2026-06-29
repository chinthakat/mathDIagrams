import React from 'react';
import { Path } from 'react-konva';

export default function Heart({ width = 90, height = 80, fill = '#ef4444', stroke = '#b91c1c', strokeWidth = 1.5 }) {
  const w = Math.max(8, Number(width) || 90);
  const h = Math.max(8, Number(height) || 80);
  const sx = w / 90, sy = h / 80;
  // Normalised heart path centred at origin (designed for 90×80 box)
  const hw = 45, hh = 40;
  const d = [
    `M 0 ${-hh * 0.1 * sy}`,
    `C ${-hw * 0.05 * sx} ${-hh * 0.55 * sy} ${-hw * sx} ${-hh * 0.65 * sy} ${-hw * sx} ${-hh * 0.15 * sy}`,
    `C ${-hw * sx} ${hh * 0.4 * sy} 0 ${hh * sy} 0 ${hh * sy}`,
    `C 0 ${hh * sy} ${hw * sx} ${hh * 0.4 * sy} ${hw * sx} ${-hh * 0.15 * sy}`,
    `C ${hw * sx} ${-hh * 0.65 * sy} ${hw * 0.05 * sx} ${-hh * 0.55 * sy} 0 ${-hh * 0.1 * sy}`,
    'Z',
  ].join(' ');
  return <Path data={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} listening={false} />;
}
