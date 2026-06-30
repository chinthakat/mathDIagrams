import React from 'react';
import { Path } from 'react-konva';

export default function CrossShape({ width = 80, height = 80, armRatio = 0.38, fill = '#ef4444', stroke = '#b91c1c', strokeWidth = 1.5 }) {
  const w = Math.max(4, Number(width) || 80);
  const h = Math.max(4, Number(height) || 80);
  const ar = Math.min(0.48, Math.max(0.1, Number(armRatio) || 0.38));
  const hw = w / 2, hh = h / 2;
  const ax = w * ar / 2;   // half arm width (x direction)
  const ay = h * ar / 2;   // half arm width (y direction)
  const d = [
    `M ${-ax} ${-hh}`, `L ${ax} ${-hh}`,
    `L ${ax} ${-ay}`,  `L ${hw} ${-ay}`,
    `L ${hw} ${ay}`,   `L ${ax} ${ay}`,
    `L ${ax} ${hh}`,   `L ${-ax} ${hh}`,
    `L ${-ax} ${ay}`,  `L ${-hw} ${ay}`,
    `L ${-hw} ${-ay}`, `L ${-ax} ${-ay}`,
    'Z',
  ].join(' ');
  return <Path data={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth}  />;
}
