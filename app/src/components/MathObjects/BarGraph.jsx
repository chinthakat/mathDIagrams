import React from 'react';
import { Group, Rect, Text, Line } from 'react-konva';

/**
 * BarGraph — full-featured vertical bar chart for math workbooks.
 *
 * Props:
 *   width, height          — outer canvas area (default 340×260)
 *   bars                   — [{id, label, value, color}]
 *   title                  — chart title (rendered at top)
 *   xAxisLabel             — label below the x-axis
 *   yAxisLabel             — label to the left of the y-axis (rotated)
 *   yAxisMax               — explicit max; defaults to max(values) rounded up
 *   yAxisStep              — tick interval; auto-calculated if omitted
 *   showGrid               — horizontal guide lines (default true)
 *   showValues             — value labels above each bar (default true)
 *   stroke                 — axis / tick / grid colour
 *   strokeWidth            — axis line thickness
 *   barGap                 — fraction of bar-slot used as gap (0–1, default 0.25)
 */
export default function BarGraph({
  width = 340,
  height = 260,
  bars,
  title = '',
  xAxisLabel = '',
  yAxisLabel = '',
  yAxisMax,
  yAxisStep,
  showGrid = true,
  showValues = true,
  stroke = '#334155',
  strokeWidth = 1.5,
  barGap = 0.25,
}) {
  // ── layout constants ──────────────────────────────────────────────────────
  const MARGIN_TOP    = title  ? 34 : 16;
  const MARGIN_BOTTOM = xAxisLabel ? 46 : 30;
  const MARGIN_LEFT   = yAxisLabel ? 52 : 40;
  const MARGIN_RIGHT  = 12;

  const plotW = width  - MARGIN_LEFT - MARGIN_RIGHT;
  const plotH = height - MARGIN_TOP  - MARGIN_BOTTOM;

  // ── data ──────────────────────────────────────────────────────────────────
  const safeBars = (bars && bars.length) ? bars : [
    { id: 'b1', label: 'A', value: 3, color: '#60a5fa' },
    { id: 'b2', label: 'B', value: 5, color: '#34d399' },
    { id: 'b3', label: 'C', value: 4, color: '#f97316' },
  ];

  const values  = safeBars.map(b => b.value);
  const rawMax  = Math.max(...values, 1);
  const axisMax = yAxisMax != null ? yAxisMax : Math.ceil(rawMax * 1.15); // add 15 % headroom

  // choose a neat step: 1, 2, 5, 10, 20 …
  const autoStep = (() => {
    const rough = axisMax / 5;
    const mag   = Math.pow(10, Math.floor(Math.log10(rough)));
    for (const n of [1, 2, 5, 10]) if (rough <= n * mag) return n * mag;
    return mag * 10;
  })();
  const step = yAxisStep || autoStep;

  const numBars   = safeBars.length;
  const slotW     = plotW / numBars;
  const barW      = slotW * (1 - barGap);
  const barOffset = slotW * barGap / 2;

  const scaleY = plotH / axisMax;

  // ── y-axis ticks ─────────────────────────────────────────────────────────
  const ticks = [];
  for (let v = 0; v <= axisMax; v += step) ticks.push(v);

  return (
    <Group>
      {/* Invisible hit area */}
      <Rect x={0} y={0} width={width} height={height} fill="transparent" />

      {/* ── Title ── */}
      {title ? (
        <Text
          text={title}
          x={0} y={4}
          width={width}
          align="center"
          fontSize={13}
          fontStyle="bold"
          fill={stroke}
          fontFamily="Arial"
        />
      ) : null}

      {/* ── Grid lines ── */}
      {showGrid && ticks.map(v => {
        const yPos = MARGIN_TOP + plotH - v * scaleY;
        return (
          <Line
            key={`grid-${v}`}
            points={[MARGIN_LEFT, yPos, MARGIN_LEFT + plotW, yPos]}
            stroke={stroke}
            strokeWidth={0.5}
            opacity={0.25}
            dash={[4, 4]}
            listening={false}
          />
        );
      })}

      {/* ── Bars ── */}
      {safeBars.map((bar, i) => {
        const barH = Math.max(0, bar.value * scaleY);
        const bx   = MARGIN_LEFT + i * slotW + barOffset;
        const by   = MARGIN_TOP + plotH - barH;
        return (
          <Group key={bar.id || i}>
            <Rect
              x={bx} y={by}
              width={barW} height={barH}
              fill={bar.color || '#60a5fa'}
              stroke={stroke}
              strokeWidth={strokeWidth * 0.6}
              cornerRadius={2}
            />
            {/* Value above bar */}
            {showValues && (
              <Text
                text={String(bar.value)}
                x={bx} y={by - 16}
                width={barW}
                align="center"
                fontSize={11}
                fontStyle="bold"
                fill={stroke}
                fontFamily="Arial"
              />
            )}
            {/* Category label below x-axis */}
            <Text
              text={bar.label || ''}
              x={bx - 4} y={MARGIN_TOP + plotH + 5}
              width={barW + 8}
              align="center"
              fontSize={11}
              fill={stroke}
              fontFamily="Arial"
            />
          </Group>
        );
      })}

      {/* ── Y-axis ticks + labels ── */}
      {ticks.map(v => {
        const yPos = MARGIN_TOP + plotH - v * scaleY;
        return (
          <Group key={`tick-${v}`}>
            <Line
              points={[MARGIN_LEFT - 4, yPos, MARGIN_LEFT, yPos]}
              stroke={stroke}
              strokeWidth={strokeWidth}
              listening={false}
            />
            <Text
              text={String(v)}
              x={0} y={yPos - 7}
              width={MARGIN_LEFT - 6}
              align="right"
              fontSize={10}
              fill={stroke}
              fontFamily="Arial"
            />
          </Group>
        );
      })}

      {/* ── Axes ── */}
      {/* Y-axis */}
      <Line
        points={[MARGIN_LEFT, MARGIN_TOP, MARGIN_LEFT, MARGIN_TOP + plotH]}
        stroke={stroke} strokeWidth={strokeWidth + 0.5}
      />
      {/* X-axis */}
      <Line
        points={[MARGIN_LEFT, MARGIN_TOP + plotH, MARGIN_LEFT + plotW, MARGIN_TOP + plotH]}
        stroke={stroke} strokeWidth={strokeWidth + 0.5}
      />

      {/* ── Axis labels ── */}
      {xAxisLabel ? (
        <Text
          text={xAxisLabel}
          x={MARGIN_LEFT} y={height - 18}
          width={plotW}
          align="center"
          fontSize={11}
          fill={stroke}
          fontFamily="Arial"
        />
      ) : null}

      {yAxisLabel ? (
        <Text
          text={yAxisLabel}
          x={2} y={MARGIN_TOP + plotH / 2}
          width={plotH}
          align="center"
          fontSize={11}
          fill={stroke}
          fontFamily="Arial"
          rotation={-90}
          offsetX={plotH / 2}
          offsetY={-6}
        />
      ) : null}
    </Group>
  );
}
