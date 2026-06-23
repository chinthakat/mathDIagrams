import React from 'react';
import { Group, Rect } from 'react-konva';

export default function FractionRectangle({ width, height, rows, cols, shaded, fill, stroke, strokeWidth }) {
  const cellWidth = width / cols;
  const cellHeight = height / rows;
  const totalCells = rows * cols;
  
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const index = r * cols + c;
      const isShaded = index < shaded;
      
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
