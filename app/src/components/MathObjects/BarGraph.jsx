import React from 'react';
import { Group, Rect, Text, Line } from 'react-konva';

export default function BarGraph({ width, height, bars, stroke, strokeWidth, yAxisMax }) {
  const safeBars = bars || [{ id: 'b1', value: 5, color: '#3b82f6' }];
  const numBars = safeBars.length || 1;
  const values = safeBars.map(b => b.value);
  const maxVal = Math.max(...values, yAxisMax || 10);
  
  const barWidth = (width * 0.8) / numBars; // 80% of width for bars, 20% for spacing
  const spacing = (width * 0.2) / (numBars + 1);
  
  const scaleY = height / maxVal;

  return (
    <Group>
      {/* Background to capture clicks */}
      <Rect x={0} y={-height} width={width} height={height} fill="transparent" />

      {/* Bars */}
      {safeBars.map((bar, index) => {
        const barHeight = bar.value * scaleY;
        const xPos = spacing + index * (barWidth + spacing);
        
        return (
          <Group key={`bar-${bar.id}`}>
            <Rect 
              x={xPos} 
              y={-barHeight} 
              width={barWidth} 
              height={barHeight} 
              fill={bar.color} 
              stroke={stroke} 
              strokeWidth={strokeWidth} 
            />
            <Text 
              text={bar.value.toString()} 
              x={xPos} 
              y={-barHeight - 15} 
              width={barWidth}
              align="center"
              fontSize={12} 
              fill={stroke} 
            />
          </Group>
        );
      })}

      {/* X and Y Axes */}
      <Line points={[0, 0, width, 0]} stroke={stroke} strokeWidth={strokeWidth + 1} />
      <Line points={[0, 0, 0, -height]} stroke={stroke} strokeWidth={strokeWidth + 1} />
    </Group>
  );
}
