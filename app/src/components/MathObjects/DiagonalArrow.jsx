import React from 'react';
import { Path } from 'react-konva';

/**
 * Diagonal double-headed block arrow — points from corner to corner.
 * angle: 45 | 135 (degrees) — the diagonal direction
 */
export default function DiagonalArrow({
  width = 120, height = 120,
  shaftRatio = 0.25,
  headRatio  = 0.30,
  doubleHeaded = true,
  angle = 45,
  fill = '#ec4899', stroke = '#9d174d', strokeWidth = 1.5,
}) {
  const w  = Math.max(10, Number(width)  || 120);
  const h  = Math.max(10, Number(height) || 120);
  const sr = Math.min(0.7, Math.max(0.1, Number(shaftRatio) || 0.25));
  const hr = Math.min(0.5, Math.max(0.1, Number(headRatio)  || 0.30));

  const len = Math.min(w, h) / 2;
  const shaftH = len * sr;
  const headL  = len * hr;
  const headW  = shaftH * 1.8;

  // Arrow pointing right (0°), rotated to desired angle.
  // We build horizontal double-headed arrow then rotate.
  const hw = len;
  const d = doubleHeaded ? [
    `M ${-hw} 0`,
    `L ${-hw + headL} ${-headW}`,
    `L ${-hw + headL} ${-shaftH}`,
    `L ${hw - headL} ${-shaftH}`,
    `L ${hw - headL} ${-headW}`,
    `L ${hw} 0`,
    `L ${hw - headL} ${headW}`,
    `L ${hw - headL} ${shaftH}`,
    `L ${-hw + headL} ${shaftH}`,
    `L ${-hw + headL} ${headW}`,
    'Z',
  ].join(' ') : [
    `M ${-hw} ${-shaftH}`,
    `L ${hw - headL} ${-shaftH}`,
    `L ${hw - headL} ${-headW}`,
    `L ${hw} 0`,
    `L ${hw - headL} ${headW}`,
    `L ${hw - headL} ${shaftH}`,
    `L ${-hw} ${shaftH}`,
    'Z',
  ].join(' ');

  return <Path data={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} rotation={Number(angle) || 45} listening={false} />;
}
