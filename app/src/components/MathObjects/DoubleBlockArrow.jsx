import React from 'react';
import { Path } from 'react-konva';

/**
 * Double-headed block arrow — arrowheads at both ends of a horizontal shaft.
 * direction: 'horizontal' | 'vertical'
 */
export default function DoubleBlockArrow({
  width = 140, height = 60,
  shaftRatio = 0.40,
  headRatio  = 0.28,
  direction  = 'horizontal',
  fill = '#6366f1', stroke = '#3730a3', strokeWidth = 1.5,
}) {
  const w  = Math.max(10, Number(width)  || 140);
  const h  = Math.max(10, Number(height) || 60);
  const sr = Math.min(0.8, Math.max(0.1, Number(shaftRatio) || 0.40));
  const hr = Math.min(0.45, Math.max(0.05, Number(headRatio)  || 0.28));

  const hw = w / 2, hh = h / 2;
  const shaftH = hh * sr;   // half shaft height
  const headL  = hw * hr;   // head length (from tip to shaft)
  const headW  = hh;        // head half-width at base (full height)

  // Horizontal double-headed arrow centred at origin
  const d = [
    `M ${-hw} 0`,                    // left tip
    `L ${-hw + headL} ${-headW}`,    // left head top-left
    `L ${-hw + headL} ${-shaftH}`,   // left shaft join top
    `L ${hw - headL} ${-shaftH}`,    // right shaft join top
    `L ${hw - headL} ${-headW}`,     // right head top-right
    `L ${hw} 0`,                     // right tip
    `L ${hw - headL} ${headW}`,      // right head bottom-right
    `L ${hw - headL} ${shaftH}`,     // right shaft join bottom
    `L ${-hw + headL} ${shaftH}`,    // left shaft join bottom
    `L ${-hw + headL} ${headW}`,     // left head bottom-left
    'Z',
  ].join(' ');

  const rot = direction === 'vertical' ? 90 : 0;

  return <Path data={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} rotation={rot} listening={false} />;
}
