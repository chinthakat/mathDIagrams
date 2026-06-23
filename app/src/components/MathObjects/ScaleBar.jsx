import React from 'react';
import { Group, Rect, Line, Text } from 'react-konva';

export default function ScaleBar({ 
  width = 160, 
  height = 8, 
  color = "#334155", 
  unitText = "100m", 
  fontSize = 11,
  rotation = 0
}) {
  const halfW = width / 2;
  const halfH = height / 2;

  // Let's create a beautiful traditional alternating black/white segmented map scale bar
  return (
    <Group rotation={rotation}>
      {/* Segment 1: Leftmost (Black) */}
      <Rect
        x={-halfW}
        y={-halfH}
        width={width * 0.25}
        height={height}
        fill="#000000"
        stroke={color}
        strokeWidth={1}
      />
      {/* Segment 2: Left-center (White) */}
      <Rect
        x={-halfW + width * 0.25}
        y={-halfH}
        width={width * 0.25}
        height={height}
        fill="#ffffff"
        stroke={color}
        strokeWidth={1}
      />
      {/* Segment 3: Right-center (Black) */}
      <Rect
        x={0}
        y={-halfH}
        width={width * 0.25}
        height={height}
        fill="#000000"
        stroke={color}
        strokeWidth={1}
      />
      {/* Segment 4: Rightmost (White) */}
      <Rect
        x={width * 0.25}
        y={-halfH}
        width={width * 0.25}
        height={height}
        fill="#ffffff"
        stroke={color}
        strokeWidth={1}
      />

      {/* Tick Marks */}
      {/* Left tick */}
      <Line points={[-halfW, -halfH - 4, -halfW, -halfH]} stroke={color} strokeWidth={1.5} />
      {/* Center tick */}
      <Line points={[0, -halfH - 4, 0, -halfH]} stroke={color} strokeWidth={1.5} />
      {/* Right tick */}
      <Line points={[halfW, -halfH - 4, halfW, -halfH]} stroke={color} strokeWidth={1.5} />

      {/* Numeric values at ticks */}
      <Text
        text="0"
        x={-halfW - 8}
        y={-halfH - 16}
        width={16}
        align="center"
        fontSize={fontSize - 2}
        fill={color}
      />
      <Text
        text="50"
        x={-8}
        y={-halfH - 16}
        width={16}
        align="center"
        fontSize={fontSize - 2}
        fill={color}
      />
      <Text
        text={unitText}
        x={halfW - 12}
        y={-halfH - 16}
        width={40}
        align="left"
        fontSize={fontSize - 2}
        fontStyle="bold"
        fill={color}
      />
    </Group>
  );
}
