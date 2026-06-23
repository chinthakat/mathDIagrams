import React from 'react';
import { Group, Line, Text, Arc } from 'react-konva';

export default function NumberLine({ width, stroke, strokeWidth, min, max, isOpen = false, step = 1, jumpCount = 0, jumpSize = 1, labelMode = 'integer' }) {
  const halfWidth = width / 2;
  const tickSize = 10;
  
  const range = max - min;
  const spacing = width / (range / step);

  const ticks = [];
  const jumps = [];
  
  if (!isOpen) {
    for (let i = 0; i <= range; i += step) {
      const xPos = -halfWidth + ((i / step) * spacing);
      const value = min + i;
      
      let displayValue = value.toString();
      if (labelMode === 'decimal') {
        displayValue = value.toFixed(1);
      } else if (labelMode === 'fraction' && value !== 0) {
        displayValue = `${value}/1`; // Simplified fraction logic
      }
      
      ticks.push(
        <Group key={`tick-${i}`}>
          <Line 
            points={[xPos, -tickSize/2, xPos, tickSize/2]} 
            stroke={stroke} 
            strokeWidth={2} 
          />
          <Text 
            text={displayValue} 
            x={xPos - 15} 
            y={tickSize + 5} 
            width={30}
            fontSize={14} 
            fill={stroke} 
            align="center"
          />
        </Group>
      );
    }
  }

  // Draw Jump Arcs
  if (jumpCount > 0) {
    const jumpSpacing = (width / range) * jumpSize;
    for (let i = 0; i < jumpCount; i++) {
      const startX = -halfWidth + (i * jumpSpacing);
      jumps.push(
        <Group key={`jump-${i}`}>
          <Arc
            x={startX + jumpSpacing / 2}
            y={-5}
            innerRadius={jumpSpacing / 2}
            outerRadius={jumpSpacing / 2}
            angle={180}
            rotation={180} // arc goes up
            stroke={stroke}
            strokeWidth={strokeWidth - 1}
            dash={[4, 4]}
          />
          {/* Arrow head for jump */}
          <Line 
            points={[startX + jumpSpacing - 5, -10, startX + jumpSpacing, -5, startX + jumpSpacing - 5, 0]}
            stroke={stroke}
            strokeWidth={strokeWidth - 1}
          />
          <Text 
            text={`+${jumpSize}`} 
            x={startX + jumpSpacing / 2 - 10} 
            y={-jumpSpacing / 2 - 20} 
            fontSize={12} 
            fill={stroke} 
            align="center"
          />
        </Group>
      );
    }
  }

  return (
    <Group>
      {/* Main Line */}
      <Line 
        points={[-halfWidth, 0, halfWidth, 0]} 
        stroke={stroke} 
        strokeWidth={strokeWidth} 
      />
      
      {/* Arrows (simplified) */}
      <Line points={[-halfWidth + 10, -5, -halfWidth, 0, -halfWidth + 10, 5]} stroke={stroke} strokeWidth={2} />
      <Line points={[halfWidth - 10, -5, halfWidth, 0, halfWidth - 10, 5]} stroke={stroke} strokeWidth={2} />

      {/* Ticks and Labels */}
      {ticks}

      {/* Jumps */}
      {jumps}
    </Group>
  );
}
