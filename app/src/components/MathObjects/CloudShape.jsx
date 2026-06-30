import React from 'react';
import { Path } from 'react-konva';

export default function CloudShape({ width = 120, height = 80, fill = '#e2e8f0', stroke = '#94a3b8', strokeWidth = 1.5 }) {
  const w = Math.max(8, Number(width) || 120);
  const h = Math.max(8, Number(height) || 80);
  // Normalised cloud path for a 120×80 box, centred at origin
  const sx = w / 120, sy = h / 80;
  const s = (x, y) => `${x * sx} ${y * sy}`;
  const d = [
    `M ${s(-20, 30)}`,
    `A ${s(25, 25)} 0 0 1 ${s(-45, 5)}`,
    `A ${s(20, 20)} 0 0 1 ${s(-15, -20)}`,
    `A ${s(18, 18)} 0 0 1 ${s(10, -35)}`,
    `A ${s(22, 22)} 0 0 1 ${s(40, -22)}`,
    `A ${s(20, 20)} 0 0 1 ${s(58, -5)}`,
    `A ${s(18, 18)} 0 0 1 ${s(45, 30)}`,
    'Z',
  ].join(' ');
  return <Path data={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth}  />;
}
