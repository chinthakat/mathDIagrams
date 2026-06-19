import React from 'react';
import { Group, Line } from 'react-konva';

export default function Lake({
  radius = 60,
  color = '#38bdf8',
  stroke = '#0284c7',
  strokeWidth = 2
}) {
  // Generate points for a natural, organic shoreline
  const points = [];
  const totalPoints = 12;
  const shoreWidth = 4; // sandy beach border size

  // Fixed pseudorandom offsets for organic waviness
  const offsets = [1, 1.15, 0.9, 1.05, 1.2, 0.85, 1.1, 0.95, 1.0, 1.15, 0.8, 1.05];

  for (let i = 0; i < totalPoints; i++) {
    const angle = (i / totalPoints) * Math.PI * 2;
    const r = radius * offsets[i];
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    points.push(x, y);
  }

  // Double points back to close the line nicely
  points.push(points[0], points[1]);

  return (
    <Group>
      {/* Sandy Beach Border */}
      <Line
        points={points}
        fill="#fef08a"
        stroke="#fef08a"
        strokeWidth={shoreWidth * 2.5}
        tension={0.45}
        closed={true}
      />

      {/* Lake Water Body with radial depth gradient */}
      <Line
        points={points}
        fillRadialGradientStartPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndRadius={radius * 1.2}
        fillRadialGradientColorStops={[0, adjustColorBrightness(color, 25), 0.7, color, 1, stroke]}
        stroke={stroke}
        strokeWidth={strokeWidth}
        tension={0.45}
        closed={true}
        shadowColor="#000"
        shadowBlur={4}
        shadowOffset={{ x: 1, y: 2 }}
        shadowOpacity={0.15}
      />

      {/* Water Ripples Overlay */}
      <Line
        points={[
          -radius * 0.4, -radius * 0.2,
          -radius * 0.1, -radius * 0.2 - 2,
          radius * 0.2, -radius * 0.2
        ]}
        stroke="#ffffff"
        strokeWidth={1.5}
        tension={0.4}
        opacity={0.35}
        lineCap="round"
      />
      <Line
        points={[
          -radius * 0.2, radius * 0.3,
          radius * 0.1, radius * 0.3 + 2,
          radius * 0.35, radius * 0.3
        ]}
        stroke="#ffffff"
        strokeWidth={1.5}
        tension={0.4}
        opacity={0.35}
        lineCap="round"
      />
    </Group>
  );
}

// Color utility
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
