import React from 'react';
import { Group, Line } from 'react-konva';

export default function Mountain({
  width = 100,
  height = 80,
  color = '#64748b',
  stroke = '#334155',
  strokeWidth = 2
}) {
  const halfW = width / 2;
  const halfH = height / 2;

  // Let's create a double-peak mountain range with shaded facets
  // Colors based on inputs
  const lightColor = adjustColorBrightness(color, 20);
  const darkColor = color;
  const backColor = adjustColorBrightness(color, -20);
  const snowLight = "#ffffff";
  const snowDark = "#cbd5e1";

  // Coordinates of main peak
  const peakX = 0;
  const peakY = -halfH;
  const bottomL = -halfW;
  const bottomR = halfW;
  const bottomY = halfH;

  // Coordinates of background smaller peak (offset right and back)
  const backPeakX = halfW * 0.4;
  const backPeakY = -halfH * 0.4;
  const backL = -halfW * 0.2;
  const backR = halfW * 1.2;

  return (
    <Group>
      {/* Background Smaller Peak */}
      {/* Left side (light) */}
      <Line
        points={[backPeakX, backPeakY, backL, bottomY, backPeakX, bottomY]}
        fill={adjustColorBrightness(backColor, 15)}
        closed={true}
      />
      {/* Right side (shadow) */}
      <Line
        points={[backPeakX, backPeakY, backPeakX, bottomY, backR, bottomY]}
        fill={backColor}
        closed={true}
      />
      {/* Background snow cap */}
      <Line
        points={[
          backPeakX, backPeakY,
          backPeakX - (backPeakX - backL) * 0.25, backPeakY + (bottomY - backPeakY) * 0.25,
          backPeakX, backPeakY + (bottomY - backPeakY) * 0.2,
          backPeakX + (backR - backPeakX) * 0.25, backPeakY + (bottomY - backPeakY) * 0.25
        ]}
        fill="#e2e8f0"
        closed={true}
      />

      {/* Main Front Peak */}
      {/* Left facet (lit) */}
      <Line
        points={[peakX, peakY, bottomL, bottomY, peakX, bottomY]}
        fill={lightColor}
        stroke={stroke}
        strokeWidth={strokeWidth}
        closed={true}
      />
      {/* Right facet (shaded) */}
      <Line
        points={[peakX, peakY, peakX, bottomY, bottomR, bottomY]}
        fill={darkColor}
        stroke={stroke}
        strokeWidth={strokeWidth}
        closed={true}
      />

      {/* Jagged Snow Cap on main peak */}
      {/* Left snow cap */}
      <Line
        points={[
          peakX, peakY,
          bottomL * 0.3, peakY + (bottomY - peakY) * 0.3,
          peakX * 0.7, peakY + (bottomY - peakY) * 0.22,
          peakX, peakY + (bottomY - peakY) * 0.35,
          peakX, peakY
        ]}
        fill={snowLight}
        stroke={stroke}
        strokeWidth={1}
        closed={true}
      />
      {/* Right snow cap */}
      <Line
        points={[
          peakX, peakY,
          peakX, peakY + (bottomY - peakY) * 0.35,
          bottomR * 0.1, peakY + (bottomY - peakY) * 0.25,
          bottomR * 0.3, peakY + (bottomY - peakY) * 0.3,
          peakX, peakY
        ]}
        fill={snowDark}
        stroke={stroke}
        strokeWidth={1}
        closed={true}
      />

      {/* Ground outline for base */}
      <Line
        points={[bottomL, bottomY, bottomR, bottomY]}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </Group>
  );
}

// Color adjusting helper
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
