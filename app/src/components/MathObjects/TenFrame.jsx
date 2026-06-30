import React from 'react';
import { Group, Rect, Circle } from 'react-konva';

/**
 * TenFrame — renders a 5-frame (1x5) or 10-frame (2x5) counting grid with colored counter discs.
 *
 * Props:
 *   width, height — outer boundary size
 *   frameSize    — 5 or 10 (defaults to 10)
 *   count        — number of counters to draw (clamped between 0 and frameSize)
 *   counterColor — fill color of counter circles
 *   fillColor    — cell background fill color
 *   stroke       — frame borders color
 *   strokeWidth  — frame borders thickness
 */
export default function TenFrame({
  width = 240,
  height = 100,
  frameSize = 10,
  count = 7,
  counterColor = '#ef4444',
  fillColor = '#ffffff',
  stroke = '#334155',
  strokeWidth = 2,
}) {
  const isTen = frameSize === 10;
  const rows = isTen ? 2 : 1;
  const cols = 5;

  const cellW = width / cols;
  const cellH = height / rows;

  const safeCount = Math.max(0, Math.min(count, frameSize));
  const cells = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellIndex = r * cols + c;
      const hasCounter = cellIndex < safeCount;

      const cx = c * cellW;
      const cy = r * cellH;

      cells.push(
        <Group key={`cell-${r}-${c}`}>
          {/* Cell box */}
          <Rect
            x={cx}
            y={cy}
            width={cellW}
            height={cellH}
            fill={fillColor}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          {/* Counter disc */}
          {hasCounter && (
            <Circle
              x={cx + cellW / 2}
              y={cy + cellH / 2}
              radius={Math.min(cellW, cellH) * 0.35}
              fill={counterColor}
              stroke="#000000"
              strokeWidth={0.5}
            />
          )}
        </Group>
      );
    }
  }

  return (
    <Group>
      <Rect x={0} y={0} width={width} height={height} fill="transparent" />
      {cells}
    </Group>
  );
}
