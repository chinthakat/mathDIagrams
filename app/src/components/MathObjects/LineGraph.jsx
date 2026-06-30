import React from 'react';
import { Group, Rect, Line, Text, Circle } from 'react-konva';

/**
 * LineGraph — multi-series line/trend chart.
 *
 * Props:
 *   width, height
 *   title
 *   xAxisLabel, yAxisLabel
 *   series   — [{ id, label, color, points: [{x, y}] }]
 *              x values are category indices (0,1,2…) OR numeric
 *   xLabels  — optional string[] for x-axis category labels
 *   yMin, yMax — axis bounds (auto if omitted)
 *   showGrid, showPoints, showLegend
 *   stroke, strokeWidth
 */
export default function LineGraph({
  width = 360,
  height = 260,
  title = '',
  xAxisLabel = '',
  yAxisLabel = '',
  series,
  xLabels,
  yMin,
  yMax,
  showGrid = true,
  showPoints = true,
  showLegend = true,
  stroke = '#334155',
  strokeWidth = 1.5,
}) {
  const MARGIN_TOP    = title ? 34 : 16;
  const MARGIN_BOTTOM = xAxisLabel ? 46 : 30;
  const MARGIN_LEFT   = yAxisLabel ? 52 : 40;
  const MARGIN_RIGHT  = showLegend ? 90 : 12;

  const plotW = width  - MARGIN_LEFT - MARGIN_RIGHT;
  const plotH = height - MARGIN_TOP  - MARGIN_BOTTOM;

  const safeSeries = (series && series.length) ? series : [
    { id: 's1', label: 'Series A', color: '#3b82f6', points: [{x:0,y:2},{x:1,y:5},{x:2,y:3},{x:3,y:7}] },
  ];

  // compute bounds
  const allPts = safeSeries.flatMap(s => s.points);
  const allX   = allPts.map(p => p.x);
  const allY   = allPts.map(p => p.y);
  const xMinV  = Math.min(...allX);
  const xMaxV  = Math.max(...allX);
  const rawYMin = Math.min(...allY);
  const rawYMax = Math.max(...allY);
  const yMinV  = yMin != null ? yMin : Math.floor(rawYMin - (rawYMax - rawYMin) * 0.1);
  const yMaxV  = yMax != null ? yMax : Math.ceil(rawYMax + (rawYMax - rawYMin) * 0.15) || 10;

  const xRange = xMaxV - xMinV || 1;
  const yRange = yMaxV - yMinV || 1;

  const toCanvasX = x => MARGIN_LEFT + ((x - xMinV) / xRange) * plotW;
  const toCanvasY = y => MARGIN_TOP  + plotH - ((y - yMinV) / yRange) * plotH;

  // y ticks
  const rough = yRange / 5;
  const mag   = Math.pow(10, Math.floor(Math.log10(rough || 1)));
  let yStep = mag;
  for (const n of [1,2,5,10]) if (rough <= n * mag) { yStep = n * mag; break; }
  const yTicks = [];
  for (let v = Math.ceil(yMinV / yStep) * yStep; v <= yMaxV; v += yStep) yTicks.push(v);

  // x ticks — use xLabels or numeric
  const xTickCount = xMaxV - xMinV + 1;
  const xTicks = Array.from({ length: xTickCount }, (_, i) => xMinV + i);

  return (
    <Group>
      <Rect x={0} y={0} width={width} height={height} fill="transparent" />

      {title ? (
        <Text text={title} x={0} y={4} width={width - MARGIN_RIGHT} align="center"
          fontSize={13} fontStyle="bold" fill={stroke} fontFamily="Arial" />
      ) : null}

      {/* Grid */}
      {showGrid && yTicks.map(v => (
        <Line key={`gy-${v}`}
          points={[MARGIN_LEFT, toCanvasY(v), MARGIN_LEFT + plotW, toCanvasY(v)]}
          stroke={stroke} strokeWidth={0.5} opacity={0.2} dash={[4,4]} listening={false} />
      ))}

      {/* Series */}
      {safeSeries.map(s => {
        const pts = [...s.points].sort((a,b) => a.x - b.x);
        const linePoints = pts.flatMap(p => [toCanvasX(p.x), toCanvasY(p.y)]);
        return (
          <Group key={s.id}>
            <Line points={linePoints} stroke={s.color || '#3b82f6'} strokeWidth={2.5}
              lineCap="round" lineJoin="round" tension={0} />
            {showPoints && pts.map((p, i) => (
              <Circle key={i} x={toCanvasX(p.x)} y={toCanvasY(p.y)}
                radius={4} fill={s.color || '#3b82f6'} stroke="#fff" strokeWidth={1.5} />
            ))}
          </Group>
        );
      })}

      {/* Y ticks */}
      {yTicks.map(v => (
        <Group key={`ty-${v}`}>
          <Line points={[MARGIN_LEFT-4, toCanvasY(v), MARGIN_LEFT, toCanvasY(v)]}
            stroke={stroke} strokeWidth={strokeWidth} />
          <Text text={String(v)} x={0} y={toCanvasY(v)-7} width={MARGIN_LEFT-6}
            align="right" fontSize={10} fill={stroke} fontFamily="Arial" />
        </Group>
      ))}

      {/* X ticks */}
      {xTicks.map(v => (
        <Group key={`tx-${v}`}>
          <Line points={[toCanvasX(v), MARGIN_TOP+plotH, toCanvasX(v), MARGIN_TOP+plotH+4]}
            stroke={stroke} strokeWidth={strokeWidth} />
          <Text text={xLabels ? (xLabels[v - xMinV] || String(v)) : String(v)}
            x={toCanvasX(v) - 20} y={MARGIN_TOP+plotH+6}
            width={40} align="center" fontSize={10} fill={stroke} fontFamily="Arial" />
        </Group>
      ))}

      {/* Axes */}
      <Line points={[MARGIN_LEFT, MARGIN_TOP, MARGIN_LEFT, MARGIN_TOP+plotH]}
        stroke={stroke} strokeWidth={strokeWidth+0.5} />
      <Line points={[MARGIN_LEFT, MARGIN_TOP+plotH, MARGIN_LEFT+plotW, MARGIN_TOP+plotH]}
        stroke={stroke} strokeWidth={strokeWidth+0.5} />

      {/* Axis labels */}
      {xAxisLabel ? <Text text={xAxisLabel} x={MARGIN_LEFT} y={height-18}
        width={plotW} align="center" fontSize={11} fill={stroke} fontFamily="Arial" /> : null}
      {yAxisLabel ? <Text text={yAxisLabel} x={2} y={MARGIN_TOP+plotH/2}
        width={plotH} align="center" fontSize={11} fill={stroke} fontFamily="Arial"
        rotation={-90} offsetX={plotH/2} offsetY={-6} /> : null}

      {/* Legend */}
      {showLegend && safeSeries.map((s, i) => (
        <Group key={`leg-${s.id}`} x={MARGIN_LEFT + plotW + 8} y={MARGIN_TOP + i * 22}>
          <Rect x={0} y={2} width={14} height={3} fill={s.color || '#3b82f6'} cornerRadius={1} />
          <Text text={s.label || ''} x={18} y={-3} fontSize={10} fill={stroke} fontFamily="Arial" />
        </Group>
      ))}
    </Group>
  );
}
