import React from 'react';
import { Group, Line } from 'react-konva';

export default function River({
  length = 200,
  width = 30,
  color = '#38bdf8',
  strokeWidth = 3
}) {
  // Let's create a beautiful winding wave path for the river
  // We can calculate points for a double S-curve
  const steps = 8;
  const points = [];
  const startX = -length / 2;
  const endX = length / 2;
  
  for (let i = 0; i <= steps; i++) {
    const x = startX + (i / steps) * length;
    // Sine wave offset to create the winding look
    const y = Math.sin((i / steps) * Math.PI * 2) * (length * 0.08);
    points.push(x, y);
  }

  // Calculate inner ripple paths (slightly shifted)
  const ripplePoints1 = [];
  for (let i = 2; i <= 6; i++) {
    const x = startX + (i / steps) * length;
    const y = Math.sin((i / steps) * Math.PI * 2) * (length * 0.08) - 2;
    ripplePoints1.push(x, y);
  }

  return (
    <Group>
      {/* Outer Winding Banks (rendered as a thicker line underneath) */}
      <Line
        points={points}
        stroke="#0284c7"
        strokeWidth={width + strokeWidth * 2}
        tension={0.4}
        lineCap="round"
        lineJoin="round"
      />

      {/* Main River Body */}
      <Line
        points={points}
        strokeLinearGradientStartPoint={{ x: -length/2, y: 0 }}
        strokeLinearGradientEndPoint={{ x: length/2, y: 0 }}
        strokeLinearGradientColorStops={[0, color, 0.5, adjustColorBrightness(color, 15), 1, adjustColorBrightness(color, -10)]}
        strokeWidth={width}
        tension={0.4}
        lineCap="round"
        lineJoin="round"
      />

      {/* Inner Winding River Ripples */}
      <Line
        points={ripplePoints1}
        stroke="#ffffff"
        strokeWidth={1.5}
        tension={0.4}
        opacity={0.4}
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
