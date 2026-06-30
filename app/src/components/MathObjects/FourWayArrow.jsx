import React from 'react';
import { Path } from 'react-konva';

/**
 * 4-way directional move arrow — cross shape with triangular arrowheads at each end.
 * armRatio: fraction of half-size that is the arm body width (0.15–0.45)
 * headRatio: fraction of half-size that is the arrowhead length (0.2–0.5)
 */
export default function FourWayArrow({
  width = 90, height = 90,
  armRatio = 0.28,
  headRatio = 0.38,
  fill = '#64748b', stroke = '#1e293b', strokeWidth = 1.5,
}) {
  const s   = Math.min(Math.max(10, Number(width) || 90), Math.max(10, Number(height) || 90));
  const hw  = s / 2;
  const ar  = Math.min(0.4, Math.max(0.1, Number(armRatio)  || 0.28));
  const hr  = Math.min(0.55, Math.max(0.15, Number(headRatio) || 0.38));

  const aw  = hw * ar;          // half arm body width
  const hL  = hw * hr;          // arrowhead length
  const hW  = aw * 1.8;        // arrowhead half-width at base
  const hB  = hw - hL;         // distance from centre to arrowhead base

  // Path goes clockwise from the tip of the top arrow:
  // Top tip → right side of top head → right side of top body →
  // top side of right head → right tip → ... (repeat for all 4 arms)
  const d = [
    // TOP arm
    `M 0 ${-hw}`,               // top tip
    `L ${hW} ${-hB}`,           // top-right head wing
    `L ${aw} ${-hB}`,           // inner-top-right corner
    // RIGHT arm
    `L ${hB} ${-aw}`,           // inner-right-top corner
    `L ${hB} ${-hW}`,           // right-top head wing
    `L ${hw} 0`,                // right tip
    `L ${hB} ${hW}`,            // right-bottom head wing
    `L ${hB} ${aw}`,            // inner-right-bottom corner
    // BOTTOM arm
    `L ${aw} ${hB}`,            // inner-bottom-right corner
    `L ${hW} ${hB}`,            // bottom-right head wing
    `L 0 ${hw}`,                // bottom tip
    `L ${-hW} ${hB}`,           // bottom-left head wing
    `L ${-aw} ${hB}`,           // inner-bottom-left corner
    // LEFT arm
    `L ${-hB} ${aw}`,           // inner-left-bottom corner
    `L ${-hB} ${hW}`,           // left-bottom head wing
    `L ${-hw} 0`,               // left tip
    `L ${-hB} ${-hW}`,          // left-top head wing
    `L ${-hB} ${-aw}`,          // inner-left-top corner
    // Back to top arm
    `L ${-aw} ${-hB}`,          // inner-top-left corner
    `L ${-hW} ${-hB}`,          // top-left head wing
    'Z',
  ].join(' ');

  return <Path data={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth}  />;
}
