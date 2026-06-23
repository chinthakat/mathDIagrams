import React from 'react';
import { Group, Circle, Path, Text } from 'react-konva';
import MathIcon from './MathIcon';

export default function MapMarker({ 
  radius = 25, 
  color = "#ef4444", 
  label = "", 
  iconName = "MapPin", 
  showLabel = true 
}) {
  // Map pin scaling factor
  const size = radius * 1.8;
  const pinW = size * 0.7;
  const pinH = size;

  // SVG teardrop pin path pointing to 0,0 at its bottom
  const pinPath = `
    M 0 0 
    C ${-pinW * 0.4} ${-pinH * 0.3} ${-pinW * 0.5} ${-pinH * 0.6} ${-pinW * 0.5} ${-pinH * 0.75} 
    A ${pinW * 0.5} ${pinW * 0.5} 0 0 1 ${pinW * 0.5} ${-pinH * 0.75} 
    C ${pinW * 0.5} ${-pinH * 0.6} ${pinW * 0.4} ${-pinH * 0.3} 0 0 
    Z
  `;

  // Shading highlight path
  const highlightPath = `
    M 0 ${-pinH * 0.25}
    C ${pinW * 0.25} ${-pinH * 0.4} ${pinW * 0.4} ${-pinH * 0.6} ${pinW * 0.4} ${-pinH * 0.75} 
    A ${pinW * 0.4} ${pinW * 0.4} 0 0 1 0 ${-pinH * 0.35}
    Z
  `;

  return (
    <Group>
      {/* Drop Shadow underneath the pin tip */}
      <Circle 
        radius={radius * 0.45} 
        scaleY={0.25} 
        fill="rgba(0,0,0,0.3)" 
        y={1}
      />

      {/* Main Teardrop Pin body */}
      <Path 
        data={pinPath} 
        fillLinearGradientStartPoint={{ x: 0, y: -pinH }}
        fillLinearGradientEndPoint={{ x: 0, y: 0 }}
        fillLinearGradientColorStops={[0, color, 1, adjustColorBrightness(color, -25)]}
        shadowColor="#000"
        shadowBlur={4}
        shadowOffset={{ x: 1, y: 2 }}
        shadowOpacity={0.15}
      />

      {/* 3D Gloss Highlight */}
      <Path 
        data={highlightPath}
        fill="rgba(255,255,255,0.15)"
      />

      {/* White Dial Center */}
      <Circle 
        y={-pinH * 0.75} 
        radius={radius * 0.45} 
        fill="#ffffff" 
        shadowColor="#000"
        shadowBlur={2}
        shadowOffset={{ x: 0, y: 1 }}
        shadowOpacity={0.1}
      />

      {/* Icon inside the Dial */}
      <Group x={-radius * 0.25} y={-pinH * 0.75 - radius * 0.25}>
        <MathIcon 
          url={null}
          iconName={iconName}
          color={color}
          width={radius * 0.5}
          height={radius * 0.5}
          opacity={1}
        />
      </Group>

      {/* Label Text below */}
      {showLabel && label && (
        <Text
          text={label}
          x={-radius * 2}
          y={radius * 0.4}
          width={radius * 4}
          align="center"
          fontSize={11}
          fontStyle="bold"
          fill="#1e293b"
          shadowColor="#fff"
          shadowBlur={2}
          shadowOpacity={0.8}
        />
      )}
    </Group>
  );
}

// Utility to darken/lighten hex colors for gradients
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
