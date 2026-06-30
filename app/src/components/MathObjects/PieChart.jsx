import React from 'react';
import { Group, Rect, Line, Text, Arc, Circle, Path } from 'react-konva';

/**
 * PieChart — pie or donut chart with optional legend and labels.
 *
 * Props:
 *   radius       — outer radius (default 90)
 *   innerRadius  — donut hole (0 = solid pie, default 0)
 *   slices       — [{ id, label, value, color }]
 *   title
 *   showLabels   — percentage labels on slices (default true)
 *   showLegend   — coloured legend to the right (default true)
 *   width, height — total bounding box
 *   stroke, strokeWidth
 */
export default function PieChart({
  width = 320,
  height = 240,
  radius = 90,
  innerRadius = 0,
  slices,
  title = '',
  showLabels = true,
  showLegend = true,
  stroke = '#fff',
  strokeWidth = 1.5,
}) {
  const safeSlices = (slices && slices.length) ? slices : [
    { id: 's1', label: 'A', value: 30, color: '#60a5fa' },
    { id: 's2', label: 'B', value: 50, color: '#34d399' },
    { id: 's3', label: 'C', value: 20, color: '#f97316' },
  ];

  const total = safeSlices.reduce((s, sl) => s + sl.value, 0) || 1;

  const LEGEND_W = showLegend ? 90 : 0;
  const cx = (width - LEGEND_W) / 2;
  const cy = height / 2 + (title ? 14 : 0);

  // build arc segments
  let startAngle = -Math.PI / 2; // start at top

  const segments = safeSlices.map(sl => {
    const frac = sl.value / total;
    const sweep = frac * Math.PI * 2;
    const midAngle = startAngle + sweep / 2;
    const seg = { ...sl, frac, startAngle, sweep, midAngle };
    startAngle += sweep;
    return seg;
  });

  // helper: arc path using Canvas arc approximated as Konva Path "A" commands
  const arcPath = (cx, cy, r, sa, ea) => {
    const x1 = cx + r * Math.cos(sa);
    const y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(ea);
    const y2 = cy + r * Math.sin(ea);
    const large = (ea - sa) > Math.PI ? 1 : 0;
    return { x1, y1, x2, y2, large };
  };

  const slicePathData = (seg, r, ri, c) => {
    const { x1, y1, x2, y2, large } = arcPath(c.x, c.y, r, seg.startAngle, seg.startAngle + seg.sweep);
    if (ri > 0) {
      const { x1: ix1, y1: iy1, x2: ix2, y2: iy2 } = arcPath(c.x, c.y, ri, seg.startAngle + seg.sweep, seg.startAngle);
      return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ri} ${ri} 0 ${large} 0 ${ix1} ${iy1} Z`;
    }
    return `M ${c.x} ${c.y} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  };

  const center = { x: cx, y: cy };

  return (
    <Group>
      <Rect x={0} y={0} width={width} height={height} fill="transparent" />

      {/* Title */}
      {title ? <Text text={title} x={0} y={4} width={width - LEGEND_W}
        align="center" fontSize={13} fontStyle="bold" fill="#334155" fontFamily="Arial" /> : null}

      {/* Slices */}
      {segments.map(seg => (
        <Path
          key={seg.id}
          data={slicePathData(seg, radius, innerRadius, center)}
          fill={seg.color || '#94a3b8'}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      ))}

      {/* Labels on slices */}
      {showLabels && segments.map(seg => {
        if (seg.frac < 0.05) return null; // skip tiny slices
        const labelR = radius * (innerRadius > 0 ? 0.65 : 0.6) + (innerRadius > 0 ? innerRadius : 0);
        const lx = cx + labelR * Math.cos(seg.midAngle);
        const ly = cy + labelR * Math.sin(seg.midAngle);
        const pct = Math.round(seg.frac * 100);
        return (
          <Text key={`lbl-${seg.id}`}
            text={`${pct}%`}
            x={lx - 18} y={ly - 7}
            width={36} align="center"
            fontSize={10} fontStyle="bold"
            fill="#fff" fontFamily="Arial"
          />
        );
      })}

      {/* Legend */}
      {showLegend && safeSlices.map((sl, i) => (
        <Group key={`leg-${sl.id}`} x={width - LEGEND_W + 4} y={height / 2 - safeSlices.length * 11 + i * 22}>
          <Rect x={0} y={0} width={12} height={12} fill={sl.color || '#94a3b8'} cornerRadius={2} />
          <Text text={sl.label} x={16} y={1} fontSize={10} fill="#334155" fontFamily="Arial" />
        </Group>
      ))}
    </Group>
  );
}
