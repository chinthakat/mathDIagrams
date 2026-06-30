import React from 'react';
import { Path } from 'react-konva';

/**
 * L-shaped (right-angle) block arrow.
 * Goes right along the bottom, then turns 90° and points up.
 * direction: 'up-right' | 'up-left' | 'down-right' | 'down-left'
 */
export default function BentArrow({
  width = 100, height = 100,
  shaftRatio = 0.30,
  headRatio  = 0.38,
  direction  = 'up-right',
  fill = '#f97316', stroke = '#c2410c', strokeWidth = 1.5,
}) {
  const w  = Math.max(10, Number(width)  || 100);
  const h  = Math.max(10, Number(height) || 100);
  const sr = Math.min(0.6, Math.max(0.1, Number(shaftRatio) || 0.30));
  const hr = Math.min(0.7, Math.max(0.15, Number(headRatio)  || 0.38));

  // Base shape: horizontal shaft along bottom going right, then vertical shaft going up.
  // Arrowhead points up.
  const hw = w / 2, hh = h / 2;
  const shW = w * sr;   // horizontal shaft height (vertical dimension)
  const shH = h * sr;   // vertical shaft width (horizontal dimension)
  const hL  = h * hr;   // arrowhead length (vertical)
  const hW  = shH * 1.8; // arrowhead half-width at base

  // Coordinates for base shape (up-right variant):
  // Horizontal shaft: bottom of shape, from left to right corner.
  // Vertical shaft: from right side, going up.
  // Arrowhead: at the top of vertical shaft.
  const d = [
    `M ${-hw} ${hh}`,                     // bottom-left
    `L ${-hw} ${hh - shW}`,               // top-left of horizontal shaft
    `L ${hw - shH} ${hh - shW}`,          // inner corner (where shafts meet)
    `L ${hw - shH} ${-hh + hL}`,          // top-left of arrowhead base
    `L ${hw - shH - (hW - shH / 2)} ${-hh + hL}`, // arrowhead left wing
    `L ${hw - shH / 2} ${-hh}`,           // arrowhead tip
    `L ${hw - shH + (hW - shH / 2)} ${-hh + hL}`, // arrowhead right wing
    `L ${hw} ${-hh + hL}`,                // arrowhead right outer
    `L ${hw} ${hh}`,                      // bottom-right
    'Z',
  ].join(' ');

  // Rotation for different directions
  const rotations = { 'up-right': 0, 'down-right': 90, 'down-left': 180, 'up-left': 270 };
  const rot = rotations[direction] ?? 0;

  return <Path data={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} rotation={rot}  />;
}
