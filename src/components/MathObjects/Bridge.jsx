import React from 'react';
import { Group, Rect, Line } from 'react-konva';

export default function Bridge({
  length = 120,
  width = 30,
  color = '#f59e0b',
  stroke = '#d97706',
  strokeWidth = 2
}) {
  const halfW = length / 2;
  const halfH = width / 2;
  const pylonH = width * 1.2;

  // Let's create a beautiful suspension-bridge silhouette structure
  return (
    <Group>
      {/* Support Pillars (Pylons) extending below the deck */}
      <Rect
        x={-length * 0.28}
        y={-pylonH}
        width={width * 0.3}
        height={pylonH * 2.2}
        fill="#94a3b8"
        stroke="#475569"
        strokeWidth={1}
        cornerRadius={1}
      />
      <Rect
        x={length * 0.28 - width * 0.3}
        y={-pylonH}
        width={width * 0.3}
        height={pylonH * 2.2}
        fill="#94a3b8"
        stroke="#475569"
        strokeWidth={1}
        cornerRadius={1}
      />

      {/* Main Bridge Roadway Deck */}
      <Rect
        x={-halfW}
        y={-halfH}
        width={length}
        height={width}
        fillLinearGradientStartPoint={{ x: 0, y: -halfH }}
        fillLinearGradientEndPoint={{ x: 0, y: halfH }}
        fillLinearGradientColorStops={[0, color, 1, adjustColorBrightness(color, -20)]}
        stroke={stroke}
        strokeWidth={strokeWidth}
        cornerRadius={1}
      />

      {/* Roadway markings / texture lines */}
      <Line
        points={[-halfW + 4, 0, halfW - 4, 0]}
        stroke="#ffffff"
        strokeWidth={1.5}
        dash={[8, 6]}
        opacity={0.7}
      />

      {/* Suspension Cables (Arch curves) */}
      <Line
        points={[-halfW, -halfH, -length * 0.28 + (width * 0.15), -pylonH, 0, -halfH + 2, length * 0.28 - (width * 0.15), -pylonH, halfW, -halfH]}
        stroke={stroke}
        strokeWidth={2}
        tension={0.4}
      />

      {/* Vertical Hanger lines connecting main cable to deck */}
      <Line points={[-length * 0.4, -halfH, -length * 0.4, -halfH * 1.5]} stroke={stroke} strokeWidth={1} />
      <Line points={[-length * 0.15, -halfH, -length * 0.15, -halfH * 1.1]} stroke={stroke} strokeWidth={1} />
      <Line points={[length * 0.15, -halfH, length * 0.15, -halfH * 1.1]} stroke={stroke} strokeWidth={1} />
      <Line points={[length * 0.4, -halfH, length * 0.4, -halfH * 1.5]} stroke={stroke} strokeWidth={1} />
    </Group>
  );
}

// Color adjust utility
function adjustColorBrightness(hex, percent) {
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  R = parseInt((R * (100 + percent)) / 100);
  G = parseInt((G * (100 + percent)) / 100);
  B = parseInt((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  R = R > 0 ? R : 0;
  G = G > 0 ? G : 0;
  B = B > 0 ? B : 0;

  const rHex = R.toString(16).padStart(2, '0');
  const gHex = G.toString(16).padStart(2, '0');
  const bHex = B.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}
