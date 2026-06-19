import React from 'react';
import { Group, Line, Text, Rect, Circle } from 'react-konva';
import { evaluate } from 'mathjs';

export default function CartesianPlane({ width, height, domain, range, step, showGrid, showLabels, stroke, strokeWidth, plots }) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  const xSpacing = halfWidth / (domain / step);
  const ySpacing = halfHeight / (range / step);

  const safePlots = plots || [];

  const gridLines = [];
  const labels = [];
  const ticks = [];

  // X-axis elements
  for (let i = -domain; i <= domain; i += step) {
    if (i === 0) continue;
    const xPos = (i / step) * xSpacing;
    
    // Grid line
    if (showGrid) {
      gridLines.push(
        <Line 
          key={`grid-x-${i}`} 
          points={[xPos, -halfHeight, xPos, halfHeight]} 
          stroke={stroke} 
          strokeWidth={0.5} 
          opacity={0.3} 
        />
      );
    }
    
    // Tick
    ticks.push(
      <Line 
        key={`tick-x-${i}`} 
        points={[xPos, -5, xPos, 5]} 
        stroke={stroke} 
        strokeWidth={1} 
      />
    );
    
    // Label
    if (showLabels) {
      labels.push(
        <Text 
          key={`label-x-${i}`} 
          text={i.toString()} 
          x={xPos - 10} 
          y={10} 
          fontSize={12} 
          fill={stroke} 
          align="center"
          width={20}
        />
      );
    }
  }

  // Y-axis elements
  for (let i = -range; i <= range; i += step) {
    if (i === 0) continue;
    const yPos = -(i / step) * ySpacing; // Negative because Y goes down in canvas
    
    // Grid line
    if (showGrid) {
      gridLines.push(
        <Line 
          key={`grid-y-${i}`} 
          points={[-halfWidth, yPos, halfWidth, yPos]} 
          stroke={stroke} 
          strokeWidth={0.5} 
          opacity={0.3} 
        />
      );
    }
    
    // Tick
    ticks.push(
      <Line 
        key={`tick-y-${i}`} 
        points={[-5, yPos, 5, yPos]} 
        stroke={stroke} 
        strokeWidth={1} 
      />
    );
    
    // Label
    if (showLabels) {
      labels.push(
        <Text 
          key={`label-y-${i}`} 
          text={i.toString()} 
          x={-25} 
          y={yPos - 6} 
          fontSize={12} 
          fill={stroke} 
          align="right"
          width={20}
        />
      );
    }
  }

  // Generate plot elements
  const plotElements = [];
  safePlots.forEach(plot => {
    if (plot.type === 'equation') {
      const points = [];
      const resolution = domain / 50; // Draw 100 points
      for (let x = -domain; x <= domain; x += resolution) {
        try {
          const y = evaluate(plot.value, { x });
          if (typeof y === 'number' && !isNaN(y) && isFinite(y)) {
            // Clamp Y coordinates slightly outside grid boundaries to keep bounding box compact
            const cappedY = Math.max(-range * 1.05, Math.min(range * 1.05, y));
            const xPos = (x / domain) * halfWidth;
            const yPos = -(cappedY / range) * halfHeight;
            points.push(xPos, yPos);
          }
        } catch (e) {
          // ignore invalid expressions
        }
      }
      if (points.length > 0) {
        plotElements.push(
          <Line key={plot.id} points={points} stroke={plot.color} strokeWidth={2} tension={0.2} />
        );
      }
    } else if (plot.type === 'points') {
      const coordPairs = plot.value.split(';').map(p => p.trim()).filter(Boolean);
      coordPairs.forEach((pair, idx) => {
        const [xStr, yStr] = pair.split(',');
        const x = parseFloat(xStr);
        const y = parseFloat(yStr);
        if (!isNaN(x) && !isNaN(y)) {
          // Only render points that are within range (with a small margin)
          if (x >= -domain * 1.05 && x <= domain * 1.05 && y >= -range * 1.05 && y <= range * 1.05) {
            const xPos = (x / domain) * halfWidth;
            const yPos = -(y / range) * halfHeight;
            plotElements.push(
              <Circle key={`${plot.id}-${idx}`} x={xPos} y={yPos} radius={5} fill={plot.color} />
            );
          }
        }
      });
    }
  });

  return (
    <Group>
      {/* Background to capture clicks for the transformer */}
      <Rect x={-halfWidth} y={-halfHeight} width={width} height={height} fill="transparent" />
      
      {gridLines}
      
      {/* X Axis */}
      <Line points={[-halfWidth, 0, halfWidth, 0]} stroke={stroke} strokeWidth={strokeWidth} />
      <Line points={[halfWidth - 10, -5, halfWidth, 0, halfWidth - 10, 5]} stroke={stroke} strokeWidth={strokeWidth} />
      
      {/* Y Axis */}
      <Line points={[0, halfHeight, 0, -halfHeight]} stroke={stroke} strokeWidth={strokeWidth} />
      <Line points={[-5, -halfHeight + 10, 0, -halfHeight, 5, -halfHeight + 10]} stroke={stroke} strokeWidth={strokeWidth} />
      
      {ticks}
      {labels}
      
      {/* Plots (Equations/Points) clipped to grid bounds */}
      <Group
        clipFunc={(ctx) => {
          ctx.rect(-halfWidth, -halfHeight, width, height);
        }}
      >
        {plotElements}
      </Group>
      
      {/* Origin Label */}
      {showLabels && <Text text="0" x={5} y={5} fontSize={12} fill={stroke} />}
    </Group>
  );
}
