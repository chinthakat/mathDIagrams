import React from 'react';
import { Group, Rect, Line, Text } from 'react-konva';
import MathIcon from './MathIcon';

export default function MapBuilding({ 
  width = 80, 
  height = 60, 
  fill = "#3b82f6", 
  stroke = "#1d4ed8", 
  strokeWidth = 2,
  label = "School",
  iconName = "School",
  showLabel = true
}) {
  const halfW = width / 2;
  const halfH = height / 2;

  // Let's create a beautiful flat 2.5D house/building structure
  // Roof height is 25% of overall building height
  const roofH = height * 0.25;
  const baseH = height * 0.75;
  const wallW = width * 0.9;
  
  // Highlight / Shadow Colors
  const shadowColor = adjustColorBrightness(fill, -25);
  const roofColor = adjustColorBrightness(fill, -40);
  const wallColorL = adjustColorBrightness(fill, 10);
  const wallColorR = shadowColor;

  return (
    <Group>
      {/* Ground Shadow */}
      <Rect
        x={-halfW * 1.1}
        y={halfH - 4}
        width={width * 1.1}
        height={8}
        fill="rgba(0,0,0,0.12)"
        cornerRadius={4}
      />

      {/* Building Base Walls */}
      {/* Left Wall Facade */}
      <Rect
        x={-wallW / 2}
        y={-halfH + roofH}
        width={wallW / 2}
        height={baseH}
        fill={wallColorL}
        stroke={stroke}
        strokeWidth={1}
      />
      {/* Right Wall Facade (Shaded side) */}
      <Rect
        x={0}
        y={-halfH + roofH}
        width={wallW / 2}
        height={baseH}
        fill={wallColorR}
        stroke={stroke}
        strokeWidth={1}
      />

      {/* Pitch Roof */}
      <Line
        points={[
          -wallW/2 - 4, -halfH + roofH,
          -wallW/4, -halfH,
          0, -halfH + roofH/2, // center valley
          wallW/4, -halfH,
          wallW/2 + 4, -halfH + roofH
        ]}
        fill={roofColor}
        stroke={stroke}
        strokeWidth={strokeWidth}
        closed={true}
      />

      {/* Windows & Doors */}
      {/* Left facade door */}
      <Rect
        x={-wallW * 0.25 - 6}
        y={halfH - baseH * 0.4}
        width={12}
        height={baseH * 0.4}
        fill="#fef08a"
        stroke={stroke}
        strokeWidth={1}
        cornerRadius={1}
      />

      {/* Right facade window grid */}
      <Rect
        x={wallW * 0.15}
        y={-halfH + roofH + baseH * 0.2}
        width={10}
        height={8}
        fill="#ffffff"
        stroke={stroke}
        strokeWidth={1}
      />
      <Rect
        x={wallW * 0.3}
        y={-halfH + roofH + baseH * 0.2}
        width={10}
        height={8}
        fill="#ffffff"
        stroke={stroke}
        strokeWidth={1}
      />
      <Rect
        x={wallW * 0.15}
        y={-halfH + roofH + baseH * 0.55}
        width={10}
        height={8}
        fill="#ffffff"
        stroke={stroke}
        strokeWidth={1}
      />
      <Rect
        x={wallW * 0.3}
        y={-halfH + roofH + baseH * 0.55}
        width={10}
        height={8}
        fill="#ffffff"
        stroke={stroke}
        strokeWidth={1}
      />

      {/* Icon Badge on Left Facade */}
      <Group x={-wallW * 0.25 - 8} y={-halfH + roofH + baseH * 0.15}>
        <MathIcon 
          url={null}
          iconName={iconName}
          color="#ffffff"
          width={16}
          height={16}
          opacity={0.9}
        />
      </Group>

      {/* Building Label */}
      {showLabel && label && (
        <Text
          text={label}
          x={-width}
          y={halfH + 6}
          width={width * 2}
          align="center"
          fontSize={11}
          fontStyle="bold"
          fill="#334155"
        />
      )}
    </Group>
  );
}

// Helper utility
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
