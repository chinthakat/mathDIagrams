import React from 'react';
import { Group, Rect, Line, Circle } from 'react-konva';

export default function Port({
  width = 120,
  height = 80,
  color = '#38bdf8', // water color
  stroke = '#0284c7',
  strokeWidth = 2
}) {
  const halfW = width / 2;
  const halfH = height / 2;

  // Let's create a beautiful miniature harbor scene
  const landColor = '#fde68a'; // sandy harbor shore
  const woodColor = '#b45309'; // pier wood
  const boatColor = '#ef4444'; // sailboat hull

  return (
    <Group>
      {/* 1. Base Box with Shadow */}
      <Rect
        x={-halfW}
        y={-halfH}
        width={width}
        height={height}
        fill="#1e293b" // slate casing
        stroke={stroke}
        strokeWidth={strokeWidth}
        cornerRadius={6}
        shadowColor="#000"
        shadowBlur={4}
        shadowOffset={{ x: 1, y: 2 }}
        shadowOpacity={0.15}
        clipFunc={(ctx) => {
          ctx.rect(-halfW, -halfH, width, height);
        }}
      />

      {/* 2. Top Half: Sandy Land, Bottom Half: Blue Harbor Water */}
      <Rect
        x={-halfW}
        y={-halfH}
        width={width}
        height={halfH}
        fill={landColor}
      />
      <Rect
        x={-halfW}
        y={0}
        width={width}
        height={halfH}
        fill={color}
      />

      {/* Wavy shoreline divider */}
      <Line
        points={[-halfW, 0, -halfW * 0.5, -2, 0, 1, halfW * 0.5, -3, halfW, 0]}
        stroke="#eab308"
        strokeWidth={1.5}
        tension={0.4}
      />

      {/* 3. Wooden Pier/Dock extending down into water */}
      <Group x={-halfW * 0.4} y={-4}>
        {/* Supporting Pillars */}
        <Line points={[4, 0, 4, halfH * 0.7]} stroke="#451a03" strokeWidth={2} />
        <Line points={[16, 0, 16, halfH * 0.7]} stroke="#451a03" strokeWidth={2} />
        
        {/* Main Dock Deck */}
        <Rect
          x={0}
          y={0}
          width={20}
          height={halfH * 0.7}
          fill={woodColor}
          stroke="#451a03"
          strokeWidth={1}
        />
        
        {/* Planks (Horizontal lines across the pier) */}
        <Line points={[0, 4, 20, 4]} stroke="#451a03" strokeWidth={0.8} />
        <Line points={[0, 8, 20, 8]} stroke="#451a03" strokeWidth={0.8} />
        <Line points={[0, 12, 20, 12]} stroke="#451a03" strokeWidth={0.8} />
        <Line points={[0, 16, 20, 16]} stroke="#451a03" strokeWidth={0.8} />
        <Line points={[0, 20, 20, 20]} stroke="#451a03" strokeWidth={0.8} />
      </Group>

      {/* 4. Little Sailboat (docked on the right side) */}
      <Group x={halfW * 0.3} y={halfH * 0.3}>
        {/* Boat Hull */}
        <Line
          points={[-12, 0, 10, 0, 14, -4, -14, -4]}
          fill={boatColor}
          stroke="#7f1d1d"
          strokeWidth={1}
          closed={true}
        />
        {/* Mast */}
        <Line points={[0, -4, 0, -18]} stroke="#475569" strokeWidth={1.2} />
        {/* Sail */}
        <Line
          points={[1, -5, 1, -16, 9, -5]}
          fill="#ffffff"
          stroke="#e2e8f0"
          strokeWidth={0.5}
          closed={true}
        />
      </Group>

      {/* 5. Anchor detail in the sand */}
      <Group x={halfW * 0.6} y={-halfH * 0.5}>
        <Circle radius={3} stroke="#475569" strokeWidth={1} fill="transparent" />
        <Line points={[0, 3, 0, 9]} stroke="#475569" strokeWidth={1} />
        <Line points={[-3, 5, 3, 5]} stroke="#475569" strokeWidth={1} />
        <Line points={[-4, 8, 0, 9, 4, 8]} stroke="#475569" strokeWidth={1.2} tension={0.2} />
      </Group>
    </Group>
  );
}
