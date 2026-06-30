import React from 'react';
import { Path } from 'react-konva';

/**
 * Filled block arrow pointing in `direction` (right|left|up|down).
 * The arrow is centred at (0,0).
 * shaftRatio controls how thick the shaft is relative to the head (0–1).
 */
export default function BlockArrow({
  width = 120, height = 60,
  direction = 'right',
  shaftRatio = 0.45,   // shaft height as fraction of total height
  headRatio  = 0.40,   // head length as fraction of total width
  fill = '#3b82f6', stroke = '#1e40af', strokeWidth = 1.5,
}) {
  const w  = Math.max(8, Number(width)  || 120);
  const h  = Math.max(8, Number(height) || 60);
  const sr = Math.min(0.9, Math.max(0.1, Number(shaftRatio) || 0.45));
  const hr = Math.min(0.9, Math.max(0.1, Number(headRatio)  || 0.40));

  // Build a right-pointing arrow path centred at (0,0):
  //   shaft occupies left (1-hr)*w, head the remaining hr*w
  //   shaft height = sr*h, head base = h
  const hw = w / 2;
  const hh = h / 2;
  const shaftH = sr * h / 2;          // half shaft height
  const headX  = hw - hr * w;         // x where head starts (left edge of head)

  // Points going clockwise from top-left of shaft:
  //  (-hw, -shaftH) → (headX, -shaftH) → (headX, -hh) → (hw, 0) → (headX, hh) → (headX, shaftH) → (-hw, shaftH)
  const rightPath = [
    `M ${-hw} ${-shaftH}`,
    `L ${headX} ${-shaftH}`,
    `L ${headX} ${-hh}`,
    `L ${hw} 0`,
    `L ${headX} ${hh}`,
    `L ${headX} ${shaftH}`,
    `L ${-hw} ${shaftH}`,
    'Z',
  ].join(' ');

  const rotations = { right: 0, down: 90, left: 180, up: 270 };
  const rot = rotations[direction] ?? 0;

  return (
    <Path
      data={rightPath}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      rotation={rot}
      
    />
  );
}
