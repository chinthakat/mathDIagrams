import React from 'react';
import { Group, Rect, Line } from 'react-konva';

export default function Sea({
  width = 300,
  height = 200,
  color = '#0284c7',
  stroke = '#0369a1',
  strokeWidth = 2
}) {
  const halfW = width / 2;
  const halfH = height / 2;

  // Let's create small wave decorative crest paths
  const drawWave = (cx, cy, w) => {
    return [
      cx - w/2, cy,
      cx - w/4, cy - 3,
      cx, cy,
      cx + w/4, cy - 3,
      cx + w/2, cy
    ];
  };

  return (
    <Group>
      {/* Deep Sea Gradient Base */}
      <Rect
        x={-halfW}
        y={-halfH}
        width={width}
        height={height}
        fillLinearGradientStartPoint={{ x: -halfW, y: -halfH }}
        fillLinearGradientEndPoint={{ x: halfW, y: halfH }}
        fillLinearGradientColorStops={[0, color, 1, '#0c4a6e']}
        stroke={stroke}
        strokeWidth={strokeWidth}
        shadowColor="#000"
        shadowBlur={4}
        shadowOffset={{ x: 1, y: 2 }}
        shadowOpacity={0.15}
      />

      {/* Decorative Wave Crests */}
      <Line
        points={drawWave(-width * 0.25, -height * 0.25, 20)}
        stroke="#ffffff"
        strokeWidth={1.5}
        tension={0.4}
        opacity={0.3}
        lineCap="round"
      />
      <Line
        points={drawWave(width * 0.2, -height * 0.1, 20)}
        stroke="#ffffff"
        strokeWidth={1.5}
        tension={0.4}
        opacity={0.3}
        lineCap="round"
      />
      <Line
        points={drawWave(-width * 0.1, height * 0.2, 20)}
        stroke="#ffffff"
        strokeWidth={1.5}
        tension={0.4}
        opacity={0.3}
        lineCap="round"
      />
      <Line
        points={drawWave(width * 0.3, height * 0.3, 20)}
        stroke="#ffffff"
        strokeWidth={1.5}
        tension={0.4}
        opacity={0.3}
        lineCap="round"
      />
    </Group>
  );
}
