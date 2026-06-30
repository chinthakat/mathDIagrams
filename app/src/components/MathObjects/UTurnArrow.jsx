import React from 'react';
import { Path } from 'react-konva';

/**
 * U-turn block arrow — goes right, curves 180° at the top, comes back left.
 * The arrowhead points left/down at the return end.
 */
export default function UTurnArrow({
  width = 110, height = 90,
  thickness = 0.30,
  fill = '#8b5cf6', stroke = '#5b21b6', strokeWidth = 1.5,
}) {
  const w = Math.max(10, Number(width) || 110);
  const h = Math.max(10, Number(height) || 90);
  const thick = Math.min(0.6, Math.max(0.1, Number(thickness) || 0.30));

  // Layout: two vertical shafts connected by a semicircle at the top.
  // Left shaft = return (with arrowhead at bottom), right shaft = entry.
  // Semicircle outer radius = R, inner radius = r = R - shaftW
  const shaftW = h * thick;           // width of each shaft
  const gap    = w - shaftW * 2;      // gap between shafts (= inner diameter of semicircle)

  if (gap < 2) {
    // Not enough room — render degenerate rect
    return <Path data={`M ${-w/2} ${-h/2} L ${w/2} ${-h/2} L ${w/2} ${h/2} L ${-w/2} ${h/2} Z`}
      fill={fill} stroke={stroke} strokeWidth={strokeWidth}  />;
  }

  const R     = (gap + shaftW) / 2;   // outer semicircle radius (to shaft centre axis)
  const outerR = R + shaftW / 2;      // outer wall radius
  const innerR = R - shaftW / 2;      // inner wall radius
  const shaftH = h - outerR;          // height of the vertical shafts below the semicircle

  const headH  = shaftW * 1.6;        // arrowhead height (protrudes down)
  const headW  = shaftW * 1.7;        // arrowhead half-width

  // All coordinates relative to centre of the full shape (0,0)
  const topY  = -(shaftH + outerR - h / 2);  // top of bounding box
  // Re-derive simply: place semicircle centre at (0, -shaftH/2 + some offset)
  // Actually let's use absolute layout:
  // Centre of shape at (0,0). Top of shape at -h/2, bottom at h/2.
  // Right shaft runs from x = innerR to x = innerR + shaftW  → x = outerR (right edge)
  //   but we centre: right shaft centre x = (gap/2 + shaftW/2)
  const cx = 0;                               // semicircle centre x
  const cy = h / 2 - shaftH - outerR;        // semicircle centre y (above bottom)

  const lx = -gap / 2 - shaftW / 2;          // left shaft centre x
  const rx =  gap / 2 + shaftW / 2;          // right shaft centre x
  const bottomY = h / 2;                      // bottom of shafts

  const d = [
    // Right shaft — enter from bottom-right, go up to semicircle
    `M ${rx + shaftW / 2} ${bottomY}`,
    `L ${rx + shaftW / 2} ${cy}`,
    // Outer semicircle (clockwise from right to left = sweep=1, going through top)
    `A ${outerR} ${outerR} 0 0 0 ${lx + shaftW / 2} ${cy}`,
    // Left shaft outer wall — come down
    `L ${lx + shaftW / 2} ${bottomY - headH}`,
    // Arrowhead — left/outward pointing
    `L ${lx + shaftW / 2 + (headW - shaftW / 2)} ${bottomY - headH}`,
    `L ${lx} ${bottomY}`,
    `L ${lx - (headW - shaftW / 2)} ${bottomY - headH}`,
    `L ${lx - shaftW / 2} ${bottomY - headH}`,
    // Left shaft inner wall — go back up
    `L ${lx - shaftW / 2} ${cy}`,
    // Inner semicircle (counter-clockwise = sweep=0)
    `A ${innerR} ${innerR} 0 0 1 ${rx - shaftW / 2} ${cy}`,
    // Right shaft inner wall — come back down
    `L ${rx - shaftW / 2} ${bottomY}`,
    'Z',
  ].join(' ');

  return <Path data={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth}  />;
}
