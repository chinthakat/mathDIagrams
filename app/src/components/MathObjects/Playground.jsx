import React from 'react';
import { Group, Rect, Circle, Line } from 'react-konva';

export default function Playground({
  width = 120,
  height = 100,
  color = '#22c55e',
  stroke = '#16a34a',
  strokeWidth = 2,
  iconName = 'Heart'
}) {
  const halfW = width / 2;
  const halfH = height / 2;

  // Let's create a beautiful detailed miniature playground layout
  const turfColor = color;
  const fenceColor = stroke;
  const sandColor = '#fef08a';
  const slideColor = '#ef4444';
  const woodColor = '#b45309';

  return (
    <Group>
      {/* 1. Green Turf Base with shadow */}
      <Rect
        x={-halfW}
        y={-halfH}
        width={width}
        height={height}
        fill={turfColor}
        stroke={fenceColor}
        strokeWidth={strokeWidth}
        cornerRadius={8}
        shadowColor="#000"
        shadowBlur={4}
        shadowOffset={{ x: 1, y: 2 }}
        shadowOpacity={0.12}
      />

      {/* Fence outline details (dashed interior border) */}
      <Rect
        x={-halfW + 3}
        y={-halfH + 3}
        width={width - 6}
        height={height - 6}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={1}
        dash={[4, 4]}
      />

      {/* 2. Sandbox (Circular sandpit on the left) */}
      <Group x={-halfW * 0.4} y={-halfH * 0.2}>
        <Circle
          radius={Math.min(width, height) * 0.22}
          fill={sandColor}
          stroke={woodColor}
          strokeWidth={1.5}
        />
        {/* Sand toys (little shapes) */}
        <Circle x={-2} y={-2} radius={2} fill={slideColor} />
        <Rect x={3} y={1} width={3} height={3} fill="#3b82f6" />
      </Group>

      {/* 3. Swing Set (on the right) */}
      <Group x={halfW * 0.4} y={-halfH * 0.35}>
        {/* Frame legs */}
        <Line points={[-12, 0, -18, halfH * 0.7]} stroke="#64748b" strokeWidth={1.5} />
        <Line points={[12, 0, 18, halfH * 0.7]} stroke="#64748b" strokeWidth={1.5} />
        {/* Top crossbar */}
        <Line points={[-15, 0, 15, 0]} stroke="#475569" strokeWidth={2} />
        {/* Swing 1 */}
        <Line points={[-6, 0, -6, halfH * 0.4]} stroke="#94a3b8" strokeWidth={0.8} />
        <Line points={[-2, 0, -2, halfH * 0.4]} stroke="#94a3b8" strokeWidth={0.8} />
        <Rect x={-7} y={halfH * 0.4} width={6} height={2} fill="#ef4444" />
        {/* Swing 2 */}
        <Line points={[2, 0, 2, halfH * 0.4]} stroke="#94a3b8" strokeWidth={0.8} />
        <Line points={[6, 0, 6, halfH * 0.4]} stroke="#94a3b8" strokeWidth={0.8} />
        <Rect x={1} y={halfH * 0.4} width={6} height={2} fill="#ef4444" />
      </Group>

      {/* 4. Slide (centered bottom) */}
      <Group x={0} y={halfH * 0.3}>
        {/* Ladder */}
        <Line points={[-16, 0, -16, -12]} stroke="#cbd5e1" strokeWidth={1.5} />
        {/* Chute */}
        <Line 
          points={[-16, -12, -8, -12, 8, 4, 16, 4]} 
          stroke={slideColor} 
          strokeWidth={4.5} 
          tension={0.25}
          lineCap="round"
        />
        {/* Ladder steps */}
        <Line points={[-16, -4, -16, -4]} stroke="#475569" strokeWidth={1.5} />
        <Line points={[-16, -8, -16, -8]} stroke="#475569" strokeWidth={1.5} />
      </Group>
      
      {/* 5. Mini bushes in the corners */}
      <Circle x={-halfW + 12} y={-halfH + 12} radius={6} fill="#047857" opacity={0.8} />
      <Circle x={halfW - 12} y={-halfH + 12} radius={6} fill="#047857" opacity={0.8} />
      <Circle x={halfW - 12} y={halfH - 12} radius={6} fill="#047857" opacity={0.8} />
    </Group>
  );
}
