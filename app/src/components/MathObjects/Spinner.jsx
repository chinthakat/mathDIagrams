import React from 'react';
import { Group, Circle, Arc, Text, Arrow } from 'react-konva';

// Vibrant preset colors for sectors
const PRESET_COLORS = [
  '#f59e0b', '#3b82f6', '#10b981', '#ef4444', 
  '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e',
  '#a855f7', '#06b6d4', '#84cc16', '#eab308'
];

export default function Spinner({ radius = 60, sectors = 4, fill, stroke = '#334155', strokeWidth = 2, pointerAngle = 0, showPointer = true }) {
  const numRadius = Number(radius);
  const cleanRadius = Number.isNaN(numRadius) ? 60 : numRadius;
  const numSectors = Number(sectors);
  const cleanSectors = Number.isNaN(numSectors) ? 4 : numSectors;
  const numPointerAngle = Number(pointerAngle);
  const cleanPointerAngle = Number.isNaN(numPointerAngle) ? 0 : numPointerAngle;

  const anglePerSector = 360 / cleanSectors;
  const elements = [];

  for (let i = 0; i < cleanSectors; i++) {
    const startAngle = i * anglePerSector - 90;
    const midAngle = startAngle + anglePerSector / 2;
    const midAngleRad = (midAngle * Math.PI) / 180;
    
    // Label position: placed at about 60% of the radius
    const lx = cleanRadius * 0.55 * Math.cos(midAngleRad);
    const ly = cleanRadius * 0.55 * Math.sin(midAngleRad);

    const sectorColor = PRESET_COLORS[i % PRESET_COLORS.length];
    
    elements.push(
      <Group key={`sector-group-${i}`}>
        <Arc
          x={0}
          y={0}
          innerRadius={0}
          outerRadius={cleanRadius}
          angle={anglePerSector}
          rotation={startAngle}
          fill={sectorColor}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        <Text
          text={(i + 1).toString()}
          x={lx - 6}
          y={ly - 7}
          fontSize={Math.max(12, Math.min(20, cleanRadius / 5))}
          fontStyle="bold"
          fill="#ffffff"
          shadowColor="#000000"
          shadowBlur={2}
          shadowOffset={{ x: 1, y: 1 }}
          shadowOpacity={0.5}
        />
      </Group>
    );
  }

  // Draw the pointer if requested
  const pointerAngleRad = (cleanPointerAngle * Math.PI) / 180;
  const arrowX = cleanRadius * 0.85 * Math.cos(pointerAngleRad);
  const arrowY = cleanRadius * 0.85 * Math.sin(pointerAngleRad);

  return (
    <Group>
      {/* Outer bounds background */}
      <Circle radius={cleanRadius} stroke={stroke} strokeWidth={strokeWidth} />
      {elements}
      {/* Center Pivot Pin */}
      <Circle radius={Math.max(6, cleanRadius / 12)} fill="#1e293b" stroke="#ffffff" strokeWidth={2} />
      
      {showPointer && (
        <Arrow
          points={[0, 0, arrowX, arrowY]}
          pointerLength={Math.max(8, cleanRadius / 8)}
          pointerWidth={Math.max(6, cleanRadius / 10)}
          fill="#000000"
          stroke="#000000"
          strokeWidth={Math.max(3, cleanRadius / 20)}
        />
      )}
    </Group>
  );
}
