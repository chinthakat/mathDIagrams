import React from 'react';
import { Path } from 'react-konva';

/**
 * Filled curved/arc block arrow. Sweeps from left, curving through the top, pointing right.
 * sweepAngle: 30–330 degrees of arc
 * thickness: arrow body thickness as fraction of radius
 */
export default function CurvedArrow({
  width = 120, height = 80,
  sweepAngle = 120,
  thickness = 0.35,
  fill = '#3b82f6', stroke = '#1e40af', strokeWidth = 1.5,
}) {
  const w = Math.max(10, Number(width) || 120);
  const h = Math.max(10, Number(height) || 80);
  const sweep = Math.min(300, Math.max(30, Number(sweepAngle) || 120));
  const thick = Math.min(0.7, Math.max(0.1, Number(thickness) || 0.35));

  const toRad = d => d * Math.PI / 180;
  const pt = (r, deg) => [r * Math.cos(toRad(deg)), r * Math.sin(toRad(deg))];
  const fmt = ([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`;

  // Arc goes from startAngle to endAngle (clockwise in screen coords, sweep-flag=1)
  // centred at origin; we'll compute scale to fit w×h
  const startAngle = 180 + (180 - sweep) / 2;  // symmetric about 270° (top of screen)
  const endAngle   = startAngle + sweep;         // clockwise

  const headSweep = Math.min(sweep * 0.25, 30);
  const bodyEnd   = endAngle - headSweep;

  // Estimate bounding box of the arc (just use unit circle, scale after)
  const R = 1.0;
  const r = R * (1 - thick);
  const headExtra = (R - r) * 0.7;  // arrowhead protrudes beyond body

  const angles = [startAngle, bodyEnd, endAngle];
  const outerPts = angles.map(a => pt(R, a));
  const innerPts = angles.map(a => pt(r, a));
  const tipPt    = pt((R + r) / 2, endAngle);
  const ohBase   = pt(R + headExtra, bodyEnd);   // outer arrowhead base wing
  const ihBase   = pt(r - headExtra, bodyEnd);   // inner arrowhead base wing

  // Determine large-arc flag
  const bodyArc = Math.abs(bodyEnd - startAngle);
  const largeArc = bodyArc > 180 ? 1 : 0;

  const d = [
    `M ${fmt(outerPts[0])}`,
    `A ${R} ${R} 0 ${largeArc} 1 ${fmt(outerPts[1])}`,
    `L ${fmt(ohBase)}`,
    `L ${fmt(tipPt)}`,
    `L ${fmt(ihBase)}`,
    `L ${fmt(innerPts[1])}`,
    `A ${r} ${r} 0 ${largeArc} 0 ${fmt(innerPts[0])}`,
    'Z',
  ].join(' ');

  // Compute bounding box of path to scale it into w×h
  const allX = [...outerPts, ...innerPts, tipPt, ohBase, ihBase].map(p => p[0]);
  const allY = [...outerPts, ...innerPts, tipPt, ohBase, ihBase].map(p => p[1]);
  const minX = Math.min(...allX), maxX = Math.max(...allX);
  const minY = Math.min(...allY), maxY = Math.max(...allY);
  const bw = maxX - minX || 1, bh = maxY - minY || 1;

  const sx = w / bw, sy = h / bh;
  const tx = -(minX + maxX) / 2 * sx;
  const ty = -(minY + maxY) / 2 * sy;

  return (
    <Path
      data={d}
      scaleX={sx} scaleY={sy}
      x={tx} y={ty}
      fill={fill} stroke={stroke} strokeWidth={strokeWidth / Math.max(sx, sy)}
      listening={false}
    />
  );
}
