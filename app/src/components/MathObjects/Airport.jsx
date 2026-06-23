import React from 'react';
import { Group, Rect, Line, Path, Text } from 'react-konva';

export default function Airport({
  width = 150,
  height = 100,
  color = '#475569', // runway area color
  stroke = '#334155',
  strokeWidth = 2
}) {
  const halfW = width / 2;
  const halfH = height / 2;

  // Airplane path (pointing right, along the runway)
  const planePath = `
    M -18 0
    L -14 -2
    L 0 -18
    L 3 -18
    L 0 -2
    L 8 -2
    L 12 -6
    L 14 -6
    L 12 0
    L 14 6
    L 12 6
    L 8 2
    L 0 2
    L 3 18
    L 0 18
    L -14 2
    Z
  `;

  return (
    <Group>
      {/* 1. Airport Field Base */}
      <Rect
        x={-halfW}
        y={-halfH}
        width={width}
        height={height}
        fill="#1e293b" // slate dark grass/concrete apron
        stroke={stroke}
        strokeWidth={strokeWidth}
        cornerRadius={6}
        shadowColor="#000"
        shadowBlur={4}
        shadowOffset={{ x: 1, y: 2 }}
        shadowOpacity={0.15}
      />

      {/* 2. Runway Asphalt Strip */}
      <Rect
        x={-halfW + 12}
        y={-22}
        width={width - 24}
        height={44}
        fill={color}
        stroke="#64748b"
        strokeWidth={1}
      />

      {/* Runway center dashes */}
      <Line
        points={[-halfW + 30, 0, halfW - 30, 0]}
        stroke="#ffffff"
        strokeWidth={1.5}
        dash={[8, 8]}
      />

      {/* Runway side shoulders */}
      <Line points={[-halfW + 12, -22, halfW - 12, -22]} stroke="#ffffff" strokeWidth={1} />
      <Line points={[-halfW + 12, 22, halfW - 12, 22]} stroke="#ffffff" strokeWidth={1} />

      {/* Runway Threshold Bars (Piano Keys) */}
      {/* Left threshold */}
      <Line points={[-halfW + 20, -16, -halfW + 20, 16]} stroke="#ffffff" strokeWidth={3} dash={[2, 2]} />
      <Text text="09" x={-halfW + 24} y={-5} fontSize={10} fontStyle="bold" fill="#ffffff" />

      {/* Right threshold */}
      <Line points={[halfW - 20, -16, halfW - 20, 16]} stroke="#ffffff" strokeWidth={3} dash={[2, 2]} />

      {/* 3. Terminal Building Silhouette at the top */}
      <Group x={-halfW * 0.4} y={-halfH * 0.8}>
        {/* Terminal block */}
        <Rect x={-15} y={0} width={30} height={12} fill="#cbd5e1" stroke="#475569" strokeWidth={1} />
        {/* Control Tower */}
        <Rect x={15} y={-10} width={8} height={22} fill="#94a3b8" stroke="#475569" strokeWidth={1} />
        <Rect x={13} y={-14} width={12} height={5} fill="#475569" />
      </Group>

      {/* 4. Airplane taking off (on the right) */}
      <Group x={halfW * 0.3} y={0}>
        {/* Plane Shadow (drawn slightly offset to represent height/takeoff!) */}
        <Path
          data={planePath}
          fill="rgba(0,0,0,0.35)"
          scale={{ x: 0.65, y: 0.65 }}
          x={3}
          y={6}
        />
        {/* White Airplane Silhouette */}
        <Path
          data={planePath}
          fill="#ffffff"
          stroke="#475569"
          strokeWidth={0.8}
          scale={{ x: 0.65, y: 0.65 }}
          shadowColor="#000"
          shadowBlur={2}
          shadowOpacity={0.15}
        />
      </Group>
    </Group>
  );
}
