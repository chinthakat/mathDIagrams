import React from 'react';
import { Group, Rect, Line, Text, Circle } from 'react-konva';

/**
 * DotPlot — frequency dot plot above a number line.
 *
 * Props:
 *   values    — array of numeric data values (may repeat), e.g. [1,2,2,3,3,3,4]
 *   min, max  — explicit axis bounds (auto if omitted)
 *   step      — tick interval (default 1)
 *   title
 *   dotRadius — radius of each dot (default 7)
 *   dotColor
 *   width, height
 *   stroke, strokeWidth
 */
export default function DotPlot({
  width = 340,
  height = 220,
  values,
  min,
  max,
  step = 1,
  title = '',
  dotRadius = 7,
  dotColor = '#3b82f6',
  stroke = '#334155',
  strokeWidth = 1.5,
}) {
  const safeValues = (values && values.length) ? values : [1, 2, 2, 3, 3, 3, 4, 4, 5];

  const MARGIN_LEFT   = 28;
  const MARGIN_RIGHT  = 16;
  const MARGIN_BOTTOM = 36;
  const TITLE_H       = title ? 28 : 10;

  const plotW = width  - MARGIN_LEFT - MARGIN_RIGHT;
  const plotH = height - TITLE_H - MARGIN_BOTTOM;

  // compute frequency map
  const freqMap = {};
  safeValues.forEach(v => { freqMap[v] = (freqMap[v] || 0) + 1; });

  const minV = min != null ? min : Math.min(...safeValues);
  const maxV = max != null ? max : Math.max(...safeValues);
  const span = maxV - minV || 1;

  // axis x position helper
  const toX = v => MARGIN_LEFT + ((v - minV) / span) * plotW;

  // baseline Y
  const baseY = TITLE_H + plotH;

  // build ticks
  const ticks = [];
  for (let v = minV; v <= maxV; v += step) ticks.push(v);

  return (
    <Group>
      <Rect x={0} y={0} width={width} height={height} fill="transparent" />

      {title ? (
        <Text text={title} x={0} y={4} width={width} align="center"
          fontSize={13} fontStyle="bold" fill={stroke} fontFamily="Arial" />
      ) : null}

      {/* Dots */}
      {Object.entries(freqMap).map(([valStr, count]) => {
        const v = Number(valStr);
        const cx = toX(v);
        return Array.from({ length: count }, (_, i) => {
          const cy = baseY - dotRadius - i * (dotRadius * 2 + 2);
          return (
            <Circle key={`${v}-${i}`}
              x={cx} y={cy}
              radius={dotRadius}
              fill={dotColor}
              stroke={stroke}
              strokeWidth={0.8}
            />
          );
        });
      })}

      {/* Number line */}
      <Line
        points={[MARGIN_LEFT, baseY, MARGIN_LEFT + plotW, baseY]}
        stroke={stroke} strokeWidth={strokeWidth + 0.5}
      />

      {/* Ticks + labels */}
      {ticks.map(v => (
        <Group key={v}>
          <Line
            points={[toX(v), baseY, toX(v), baseY + 5]}
            stroke={stroke} strokeWidth={strokeWidth}
          />
          <Text
            text={String(v)}
            x={toX(v) - 14} y={baseY + 7}
            width={28} align="center"
            fontSize={11} fill={stroke} fontFamily="Arial"
          />
        </Group>
      ))}
    </Group>
  );
}
