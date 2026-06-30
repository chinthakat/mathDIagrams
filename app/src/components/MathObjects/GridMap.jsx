import React from 'react';
import { Group, Line, Text, Rect, Circle, Arrow } from 'react-konva';
import MathIcon from './MathIcon';

export default function GridMap({ 
  width, 
  height, 
  rows = 4, 
  cols = 4, 
  showCompass = true, 
  scaleText = "1 square = 100m", 
  landmarks = [], 
  routes = [],
  stroke = "#cbd5e1" 
}) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Grid limits and spacing calculations
  const startX = -halfWidth + 30;
  const endX = halfWidth - 10;
  const startY = -halfHeight + 30;
  const endY = halfHeight - 20;

  const gridWidth = endX - startX;
  const gridHeight = endY - startY;

  const cellWidth = gridWidth / cols;
  const cellHeight = gridHeight / rows;

  const gridElements = [];

  // Draw grid vertical lines
  for (let i = 0; i <= cols; i++) {
    const x = startX + i * cellWidth;
    gridElements.push(
      <Line 
        key={`v-${i}`}
        points={[x, startY, x, endY]}
        stroke={stroke}
        strokeWidth={i === 0 || i === cols ? 2 : 1}
      />
    );
  }

  // Draw grid horizontal lines
  for (let j = 0; j <= rows; j++) {
    const y = startY + j * cellHeight;
    gridElements.push(
      <Line 
        key={`h-${j}`}
        points={[startX, y, endX, y]}
        stroke={stroke}
        strokeWidth={j === 0 || j === rows ? 2 : 1}
      />
    );
  }

  // Render Column Headers (Letters: A, B, C...)
  for (let i = 0; i < cols; i++) {
    const letter = String.fromCharCode(65 + i); // 'A' is 65
    const centerX = startX + (i + 0.5) * cellWidth;
    gridElements.push(
      <Text 
        key={`col-lbl-${i}`}
        text={letter}
        x={centerX - 10}
        y={startY - 16}
        width={20}
        align="center"
        fontSize={12}
        fontStyle="bold"
        fill={stroke}
      />
    );
  }

  // Render Row Headers (Numbers: 1, 2, 3...)
  for (let j = 0; j < rows; j++) {
    const label = (j + 1).toString();
    const centerY = startY + (j + 0.5) * cellHeight;
    gridElements.push(
      <Text 
        key={`row-lbl-${j}`}
        text={label}
        x={startX - 18}
        y={centerY - 6}
        width={15}
        align="right"
        fontSize={12}
        fontStyle="bold"
        fill={stroke}
      />
    );
  }

  // Render Landmarks (Buildings)
  const landmarkElements = [];
  const safeLandmarks = landmarks || [];
  safeLandmarks.forEach((lm) => {
    // Check boundaries (1-indexed row/col)
    if (lm.row >= 1 && lm.row <= rows && lm.col >= 1 && lm.col <= cols) {
      const centerX = startX + (lm.col - 0.5) * cellWidth;
      const centerY = startY + (lm.row - 0.5) * cellHeight;

      // Card sizing
      const cardW = cellWidth * 0.85;
      const cardH = cellHeight * 0.85;
      const iconSize = Math.min(cardW, cardH) * 0.45;

      landmarkElements.push(
        <Group key={lm.id}>
          {/* Card Backdrop */}
          <Rect 
            x={centerX - cardW / 2}
            y={centerY - cardH / 2}
            width={cardW}
            height={cardH}
            fill="#1e293b"
            stroke={lm.color || '#3b82f6'}
            strokeWidth={2}
            cornerRadius={6}
          />
          {/* Building Icon */}
          <Group x={centerX - iconSize / 2} y={centerY - iconSize / 2 - 6}>
            <MathIcon 
              url={null}
              iconName={lm.icon || 'MapPin'}
              color={lm.color || '#3b82f6'}
              width={iconSize}
              height={iconSize}
              opacity={1}
            />
          </Group>
          {/* Text Label */}
          <Text 
            text={lm.label || ''}
            x={centerX - cardW / 2}
            y={centerY + cardH / 2 - 14}
            width={cardW}
            align="center"
            fontSize={Math.max(9, Math.min(11, cardW / 6))}
            fill="#ffffff"
            ellipsis={true}
            wrap="none"
          />
        </Group>
      );
    }
  });

  // Render Dotted Routes
  const routeElements = [];
  const safeRoutes = routes || [];
  
  // Helper to parse coordinate string (e.g. "A1" -> col=1, row=1)
  const parseCoord = (coord) => {
    if (!coord || coord.length < 2) return null;
    const colLetter = coord[0].toUpperCase();
    const rowNum = parseInt(coord.slice(1));
    const colIdx = colLetter.charCodeAt(0) - 64; // A -> 1
    if (isNaN(rowNum) || colIdx < 1 || colIdx > cols || rowNum < 1 || rowNum > rows) {
      return null;
    }
    return { col: colIdx, row: rowNum };
  };

  safeRoutes.forEach((route) => {
    const coords = (route.path || '').split('-').map(parseCoord).filter(Boolean);
    for (let i = 0; i < coords.length - 1; i++) {
      const c1 = coords[i];
      const c2 = coords[i + 1];

      const cx1 = startX + (c1.col - 0.5) * cellWidth;
      const cy1 = startY + (c1.row - 0.5) * cellHeight;
      const cx2 = startX + (c2.col - 0.5) * cellWidth;
      const cy2 = startY + (c2.row - 0.5) * cellHeight;

      const dx = cx2 - cx1;
      const dy = cy2 - cy1;
      const len = Math.sqrt(dx * dx + dy * dy);

      if (len > 30) {
        // Offset starting and ending coordinates so they sit nicely outside the cards
        const offset = Math.min(22, len * 0.35);
        const ox = (dx / len) * offset;
        const oy = (dy / len) * offset;

        routeElements.push(
          <Arrow 
            key={`${route.id}-${i}`}
            points={[cx1 + ox, cy1 + oy, cx2 - ox, cy2 - oy]}
            stroke={route.color || '#ef4444'}
            fill={route.color || '#ef4444'}
            strokeWidth={2.5}
            pointerLength={6}
            pointerWidth={6}
            dash={[4, 4]}
          />
        );
      }
    }
  });

  return (
    <Group>
      {/* Background to capture clicks */}
      <Rect 
        x={-halfWidth} 
        y={-halfHeight} 
        width={width} 
        height={height} 
        fill="transparent" 
        
      />

      {gridElements}
      {landmarkElements}
      {routeElements}

      {/* Compass Rose */}
      {showCompass && (
        <Group x={halfWidth - 30} y={-halfHeight + 35}>
          {/* Outer compass ring */}
          <Circle radius={15} stroke={stroke} strokeWidth={1} opacity={0.6} />
          {/* Direction needles */}
          <Line points={[0, -12, 0, 12]} stroke={stroke} strokeWidth={1.5} />
          <Line points={[-12, 0, 12, 0]} stroke={stroke} strokeWidth={1.5} />
          {/* Labels */}
          <Text text="N" x={-4} y={-24} fontSize={9} fontStyle="bold" fill={stroke} />
          <Text text="S" x={-4} y={15} fontSize={9} fontStyle="bold" fill={stroke} />
          <Text text="E" x={16} y={-4} fontSize={9} fontStyle="bold" fill={stroke} />
          <Text text="W" x={-22} y={-4} fontSize={9} fontStyle="bold" fill={stroke} />
        </Group>
      )}

      {/* Scale Bar */}
      {scaleText && (
        <Group x={0} y={halfHeight - 10}>
          <Line points={[-40, 0, 40, 0]} stroke={stroke} strokeWidth={1.5} />
          <Line points={[-40, -3, -40, 3]} stroke={stroke} strokeWidth={1.5} />
          <Line points={[40, -3, 40, 3]} stroke={stroke} strokeWidth={1.5} />
          <Text 
            text={scaleText} 
            x={-80} 
            y={-14} 
            width={160} 
            align="center" 
            fontSize={9} 
            fill={stroke} 
          />
        </Group>
      )}
    </Group>
  );
}
