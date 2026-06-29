import React from 'react';
import { Path } from 'react-konva';

/**
 * Circular / rotation arrow — a thick arc (default 270°) with a filled arrowhead.
 * sweepAngle: degrees of the arc (60–340)
 * startRotation: offset rotation so the gap faces different directions
 */
export default function CircularArrow({
  width = 90, height = 90,
  sweepAngle = 270,
  thickness = 0.30,
  fill = '#10b981', stroke = '#065f46', strokeWidth = 1.5,
}) {
  const size  = Math.min(Math.max(10, Number(width) || 90), Math.max(10, Number(height) || 90));
  const sweep = Math.min(340, Math.max(60, Number(sweepAngle) || 270));
  const thick = Math.min(0.6, Math.max(0.1, Number(thickness) || 0.30));

  const toRad = d => d * Math.PI / 180;
  const pt = (r, deg) => [r * Math.cos(toRad(deg)), r * Math.sin(toRad(deg))];
  const fmt = ([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`;

  const R = size / 2;
  const r = R * (1 - thick);
  const mid = (R + r) / 2;

  // Arc starts at -90° (top) and sweeps clockwise by `sweep` degrees
  const s0 = -90;                  // start angle
  const s1 = s0 + sweep;           // end angle (before head)
  const headSweep = Math.min(sweep * 0.18, 28);
  const bodyEnd = s1 - headSweep;
  const headExtra = (R - r) * 0.8;

  const largeArc = (bodyEnd - s0) > 180 ? 1 : 0;

  const oStart = pt(R, s0);
  const oBody  = pt(R, bodyEnd);
  const iStart = pt(r, s0);
  const iBody  = pt(r, bodyEnd);
  const tip    = pt(mid, s1);
  const oHead  = pt(R + headExtra, bodyEnd);
  const iHead  = pt(r - headExtra, bodyEnd);

  const d = [
    `M ${fmt(oStart)}`,
    `A ${R} ${R} 0 ${largeArc} 1 ${fmt(oBody)}`,
    `L ${fmt(oHead)}`,
    `L ${fmt(tip)}`,
    `L ${fmt(iHead)}`,
    `L ${fmt(iBody)}`,
    `A ${r} ${r} 0 ${largeArc} 0 ${fmt(iStart)}`,
    'Z',
  ].join(' ');

  return <Path data={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} listening={false} />;
}
