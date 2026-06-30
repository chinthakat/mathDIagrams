import React from 'react';
import { Path } from 'react-konva';

// Crescent moon built from two overlapping arcs
export default function Crescent({ width = 70, height = 80, offsetRatio = 0.35, fill = '#fbbf24', stroke = '#92400e', strokeWidth = 1.5 }) {
  const w = Math.max(8, Number(width) || 70);
  const h = Math.max(8, Number(height) || 80);
  const R = h / 2;                           // outer radius
  const or = Math.min(0.8, Math.max(0.1, Number(offsetRatio) || 0.35));
  const cx = w * or;                          // inner circle centre x offset

  // Outer circle arc (full circle, clockwise) then inner circle arc (counter-clockwise = "bite")
  const d = [
    `M 0 ${-R}`,
    `A ${R} ${R} 0 1 1 0 ${R}`,             // outer right semicircle
    `A ${R} ${R} 0 1 1 0 ${-R}`,            // outer left semicircle
    'Z',
    // Inner "bite" — same radius circle shifted right
    `M ${cx} ${-R}`,
    `A ${R} ${R} 0 1 0 ${cx} ${R}`,
    `A ${R} ${R} 0 1 0 ${cx} ${-R}`,
    'Z',
  ].join(' ');

  return <Path data={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} fillRule="evenodd"  />;
}
