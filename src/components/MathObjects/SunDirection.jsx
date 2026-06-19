import React from 'react';
import { Group, Circle, Line, Text } from 'react-konva';

export default function SunDirection({
  radius = 40,
  color = '#eab308', // gold/yellow
  label = 'N',
  rotation = 0
}) {
  const sunR = radius * 0.4;
  const rayMax = radius * 0.85;
  const rayMin = radius * 0.65;

  // Let's create beautiful pointed triangular rays
  // Draw 8 rays: 4 long cardinal rays, 4 shorter intermediate rays
  const rays = [0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
    const isCardinal = i % 2 === 0;
    const rLen = isCardinal ? rayMax : rayMin;
    const rad = (angle * Math.PI) / 180;
    
    // Coordinates of ray tip
    const tx = Math.cos(rad) * rLen;
    const ty = Math.sin(rad) * rLen;
    
    // Coordinates of base corners (width of ray base)
    const baseW = isCardinal ? sunR * 0.45 : sunR * 0.3;
    const bx1 = Math.cos(rad + Math.PI/2) * baseW;
    const by1 = Math.sin(rad + Math.PI/2) * baseW;
    const bx2 = Math.cos(rad - Math.PI/2) * baseW;
    const by2 = Math.sin(rad - Math.PI/2) * baseW;

    return (
      <Line
        key={`ray-${i}`}
        points={[bx1, by1, tx, ty, bx2, by2]}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: tx, y: ty }}
        fillLinearGradientColorStops={[0, adjustColorBrightness(color, 15), 1, adjustColorBrightness(color, -20)]}
        closed={true}
        opacity={isCardinal ? 1 : 0.8}
      />
    );
  });

  return (
    <Group rotation={rotation}>
      {/* 1. Rays behind */}
      {rays}

      {/* 2. Sun Disk with radial glow gradient */}
      <Circle
        radius={sunR}
        fillRadialGradientStartPoint={{ x: -2, y: -2 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndRadius={sunR}
        fillRadialGradientColorStops={[0, '#ffffff', 0.4, '#fef08a', 0.9, color, 1, adjustColorBrightness(color, -25)]}
        shadowColor={color}
        shadowBlur={6}
        shadowOpacity={0.4}
      />

      {/* 3. Outer delicate circle ring */}
      <Circle
        radius={sunR * 1.2}
        stroke={color}
        strokeWidth={1}
        dash={[2, 3]}
        opacity={0.6}
      />

      {/* Direction label */}
      {label && (
        <Text
          text={label}
          x={-radius}
          y={-radius - 22}
          width={radius * 2}
          align="center"
          fontSize={13}
          fontStyle="bold"
          fill={adjustColorBrightness(color, -20)}
          shadowColor="#fff"
          shadowBlur={1}
          shadowOpacity={0.8}
        />
      )}
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
