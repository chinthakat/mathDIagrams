import React from 'react';
import { Group, Rect } from 'react-konva';

export default function FractionRectangle({ width = 150, height = 100, rows = 2, cols = 3, shaded = 2, fill = '#3b82f6', stroke = '#334155', strokeWidth = 2 }) {
  const numWidth = Number(width);
  const cleanWidth = Number.isNaN(numWidth) ? 150 : numWidth;
  const numHeight = Number(height);
  const cleanHeight = Number.isNaN(numHeight) ? 100 : numHeight;
  const numRows = Number(rows);
  const cleanRows = Number.isNaN(numRows) ? 2 : numRows;
  const numCols = Number(cols);
  const cleanCols = Number.isNaN(numCols) ? 3 : numCols;
  const numShaded = Number(shaded);
  const cleanShaded = Number.isNaN(numShaded) ? 2 : numShaded;

  const cellWidth = cleanWidth / cleanCols;
  const cellHeight = cleanHeight / cleanRows;
  const totalCells = cleanRows * cleanCols;
  
  const cells = [];
  for (let r = 0; r < cleanRows; r++) {
    for (let c = 0; c < cleanCols; c++) {
      const index = r * cleanCols + c;
      const isShaded = index < cleanShaded;
      
      cells.push(
        <Rect
          key={`cell-${index}`}
          x={c * cellWidth}
          y={r * cellHeight}
          width={cellWidth}
          height={cellHeight}
          fill={isShaded ? fill : 'transparent'}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    }
  }

  return <Group>{cells}</Group>;
}
