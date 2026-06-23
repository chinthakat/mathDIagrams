import React from 'react';
import { Group, Rect, Line, Text } from 'react-konva';

export default function DataTable({ width, height, rows, cols, headerColor, stroke, strokeWidth }) {
  const rowHeight = height / rows;
  const colWidth = width / cols;
  
  const cells = [];
  
  // Create background and grid lines
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isHeader = r === 0;
      
      cells.push(
        <Group key={`cell-${r}-${c}`}>
          <Rect 
            x={c * colWidth} 
            y={r * rowHeight} 
            width={colWidth} 
            height={rowHeight} 
            fill={isHeader ? headerColor : 'transparent'} 
            stroke={stroke} 
            strokeWidth={strokeWidth} 
          />
          {/* Default placeholder text just to show it's a table */}
          {isHeader && (
            <Text 
              text={`Header ${c + 1}`} 
              x={c * colWidth + 5} 
              y={r * rowHeight + rowHeight / 2 - 6} 
              width={colWidth - 10}
              align="center"
              fontSize={12} 
              fill={stroke} 
              fontStyle="bold"
            />
          )}
        </Group>
      );
    }
  }

  return (
    <Group>
      {cells}
    </Group>
  );
}
