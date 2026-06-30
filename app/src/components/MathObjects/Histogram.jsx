import React from 'react';
import { Group, Rect, Line, Text } from 'react-konva';

/**
 * Histogram — continuous data bar chart (no gaps between bars).
 * Shares most logic with BarGraph but bars touch each other and
 * x-axis labels represent interval boundaries, not categories.
 *
 * Props:
 *   width, height
 *   bars           — [{ id, label, value, color }]
 *                    label = interval label ("0–5", "5–10", …)
 *   title
 *   xAxisLabel, yAxisLabel
 *   yAxisMax
 *   showGrid, showValues
 *   stroke, strokeWidth
 *   fillColor      — default bar fill if bars[].color not provided
 */
export default function Histogram({
  width = 340,
  height = 260,
  bars,
  title = '',
  xAxisLabel = '',
  yAxisLabel = '',
  yAxisMax,
  showGrid = true,
  showValues = true,
  stroke = '#334155',
  strokeWidth = 1.5,
  fillColor = '#60a5fa',
}) {
  const MARGIN_TOP    = title ? 34 : 16;
  const MARGIN_BOTTOM = xAxisLabel ? 46 : 30;
  const MARGIN_LEFT   = yAxisLabel ? 52 : 40;
  const MARGIN_RIGHT  = 12;

  const plotW = width  - MARGIN_LEFT - MARGIN_RIGHT;
  const plotH = height - MARGIN_TOP  - MARGIN_BOTTOM;

  const safeBars = (bars && bars.length) ? bars : [
    { id: 'b1', label: '0–5',  value: 3, color: fillColor },
    { id: 'b2', label: '5–10', value: 7, color: fillColor },
    { id: 'b3', label: '10–15',value: 5, color: fillColor },
    { id: 'b4', label: '15–20',value: 2, color: fillColor },
  ];

  const values  = safeBars.map(b => b.value);
  const rawMax  = Math.max(...values, 1);
  const axisMax = yAxisMax != null ? yAxisMax : Math.ceil(rawMax * 1.15);

  const rough = axisMax / 5;
  const mag   = Math.pow(10, Math.floor(Math.log10(rough || 1)));
  let step = mag;
  for (const n of [1,2,5,10]) if (rough <= n * mag) { step = n * mag; break; }
  const ticks = [];
  for (let v = 0; v <= axisMax; v += step) ticks.push(v);

  const numBars = safeBars.length;
  const barW    = plotW / numBars;  // no gap — bars touch
  const scaleY  = plotH / axisMax;

  return (
    <Group>
      <Rect x={0} y={0} width={width} height={height} fill="transparent" />

      {title ? <Text text={title} x={0} y={4} width={width} align="center"
        fontSize={13} fontStyle="bold" fill={stroke} fontFamily="Arial" /> : null}

      {/* Grid */}
      {showGrid && ticks.map(v => (
        <Line key={`grid-${v}`}
          points={[MARGIN_LEFT, MARGIN_TOP+plotH-v*scaleY, MARGIN_LEFT+plotW, MARGIN_TOP+plotH-v*scaleY]}
          stroke={stroke} strokeWidth={0.5} opacity={0.25} dash={[4,4]} listening={false} />
      ))}

      {/* Bars — no gap, shared borders */}
      {safeBars.map((bar, i) => {
        const barH = Math.max(0, bar.value * scaleY);
        const bx   = MARGIN_LEFT + i * barW;
        const by   = MARGIN_TOP + plotH - barH;
        return (
          <Group key={bar.id || i}>
            <Rect x={bx} y={by} width={barW} height={barH}
              fill={bar.color || fillColor}
              stroke={stroke} strokeWidth={strokeWidth * 0.6}
            />
            {showValues && barH > 14 && (
              <Text text={String(bar.value)}
                x={bx} y={by + 3} width={barW} align="center"
                fontSize={10} fontStyle="bold" fill="#fff" fontFamily="Arial" />
            )}
            {/* interval label centred below x-axis at bar boundary */}
            <Text text={bar.label || ''}
              x={bx - barW * 0.3} y={MARGIN_TOP + plotH + 5}
              width={barW * 1.6} align="center"
              fontSize={9} fill={stroke} fontFamily="Arial" />
          </Group>
        );
      })}

      {/* Y ticks */}
      {ticks.map(v => {
        const yPos = MARGIN_TOP + plotH - v * scaleY;
        return (
          <Group key={`ty-${v}`}>
            <Line points={[MARGIN_LEFT-4, yPos, MARGIN_LEFT, yPos]}
              stroke={stroke} strokeWidth={strokeWidth} />
            <Text text={String(v)} x={0} y={yPos-7} width={MARGIN_LEFT-6}
              align="right" fontSize={10} fill={stroke} fontFamily="Arial" />
          </Group>
        );
      })}

      {/* Axes */}
      <Line points={[MARGIN_LEFT, MARGIN_TOP, MARGIN_LEFT, MARGIN_TOP+plotH]}
        stroke={stroke} strokeWidth={strokeWidth+0.5} />
      <Line points={[MARGIN_LEFT, MARGIN_TOP+plotH, MARGIN_LEFT+plotW, MARGIN_TOP+plotH]}
        stroke={stroke} strokeWidth={strokeWidth+0.5} />

      {xAxisLabel ? <Text text={xAxisLabel} x={MARGIN_LEFT} y={height-18}
        width={plotW} align="center" fontSize={11} fill={stroke} fontFamily="Arial" /> : null}
      {yAxisLabel ? <Text text={yAxisLabel} x={2} y={MARGIN_TOP+plotH/2}
        width={plotH} align="center" fontSize={11} fill={stroke} fontFamily="Arial"
        rotation={-90} offsetX={plotH/2} offsetY={-6} /> : null}
    </Group>
  );
}
