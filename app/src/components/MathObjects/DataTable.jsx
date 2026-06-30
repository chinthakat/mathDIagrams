import React from 'react';
import { Group, Rect, Text } from 'react-konva';

/**
 * DataTable — customizable mathematical data table.
 *
 * Props:
 *   width, height — outer bounding dimensions
 *   rows, cols    — grid dimensions
 *   data          — 2D string array: data[row][col]
 *   headerColor   — background fill color for the top row
 *   stroke        — cell boundary lines color
 *   strokeWidth   — boundary lines thickness
 *   fontSize      — size of text inside cell
 *   textColor     — color of cell contents
 *   fontFamily    — font family of text
 */
export default function DataTable({
  width = 300,
  height = 150,
  rows = 4,
  cols = 2,
  data,
  headerColor = '#cbd5e1',
  stroke = '#334155',
  strokeWidth = 1.5,
  fontSize = 12,
  textColor = '#1e293b',
  fontFamily = 'Arial',
}) {
  const cellW = width / cols;
  const cellH = height / rows;

  // Fallback grid initialization
  const safeData = data || Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => r === 0 ? `Header ${c + 1}` : '')
  );

  const cells = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isHeader = r === 0;
      const val = safeData[r]?.[c] != null ? String(safeData[r][c]) : '';

      const cx = c * cellW;
      const cy = r * cellH;

      cells.push(
        <Group key={`cell-${r}-${c}`}>
          {/* Cell block */}
          <Rect
            x={cx}
            y={cy}
            width={cellW}
            height={cellH}
            fill={isHeader ? headerColor : '#ffffff'}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          {/* Cell Text content */}
          {val.trim() !== '' && (
            <Text
              text={val}
              x={cx + 4}
              y={cy + (cellH - fontSize) / 2 - 2}
              width={cellW - 8}
              height={cellH - 4}
              align="center"
              fontSize={fontSize}
              fill={textColor}
              fontStyle={isHeader ? 'bold' : 'normal'}
              fontFamily={fontFamily}
              verticalAlign="middle"
              ellipsis={true}
              wrap="char"
            />
          )}
        </Group>
      );
    }
  }

  return (
    <Group>
      {/* Invisible background wrapper */}
      <Rect x={0} y={0} width={width} height={height} fill="transparent" />
      {cells}
    </Group>
  );
}
