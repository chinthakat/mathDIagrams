import React from 'react';
import { Group, Rect, Circle } from 'react-konva';

export default function Tree({ 
  trunkWidth = 12, 
  trunkHeight = 35, 
  canopyRadius = 26, 
  trunkColor = "#78350f", 
  canopyColor = "#16a34a"
}) {
  const canopyDark = adjustColorBrightness(canopyColor, -20);
  const canopyLight = adjustColorBrightness(canopyColor, 20);

  return (
    <Group>
      {/* Soft Ground Shadow */}
      <Circle
        radius={canopyRadius * 0.9}
        scaleY={0.3}
        fill="rgba(0,0,0,0.1)"
        y={trunkHeight}
      />

      {/* Trunk with Bark Gradients */}
      <Rect 
        x={-trunkWidth/2} 
        y={0} 
        width={trunkWidth} 
        height={trunkHeight} 
        fillLinearGradientStartPoint={{ x: -trunkWidth/2, y: 0 }}
        fillLinearGradientEndPoint={{ x: trunkWidth/2, y: 0 }}
        fillLinearGradientColorStops={[0, adjustColorBrightness(trunkColor, -15), 0.5, trunkColor, 1, adjustColorBrightness(trunkColor, -30)]}
        cornerRadius={1.5}
      />

      {/* Layered Leaf Canopy (Deciduous Style) */}
      {/* Layer 1: Back Shaded Leaf Dome */}
      <Circle 
        x={-canopyRadius * 0.3} 
        y={0} 
        radius={canopyRadius * 0.75} 
        fill={canopyDark} 
      />
      <Circle 
        x={canopyRadius * 0.3} 
        y={0} 
        radius={canopyRadius * 0.75} 
        fill={canopyDark} 
      />

      {/* Layer 2: Main Middle Canopy */}
      <Circle 
        x={0} 
        y={-canopyRadius * 0.2} 
        radius={canopyRadius * 0.95} 
        fillLinearGradientStartPoint={{ x: -canopyRadius, y: -canopyRadius }}
        fillLinearGradientEndPoint={{ x: canopyRadius, y: canopyRadius }}
        fillLinearGradientColorStops={[0, canopyLight, 0.6, canopyColor, 1, canopyDark]}
        shadowColor="#000"
        shadowBlur={4}
        shadowOffset={{ x: 0, y: 2 }}
        shadowOpacity={0.12}
      />

      {/* Layer 3: Sunlit Front highlights */}
      <Circle 
        x={-canopyRadius * 0.25} 
        y={-canopyRadius * 0.35} 
        radius={canopyRadius * 0.5} 
        fill={canopyLight} 
        opacity={0.8}
      />

      {/* Cute little red fruit details */}
      <Circle x={-canopyRadius * 0.4} y={-canopyRadius * 0.1} radius={canopyRadius * 0.08} fill="#ef4444" />
      <Circle x={canopyRadius * 0.35} y={-canopyRadius * 0.2} radius={canopyRadius * 0.08} fill="#ef4444" />
      <Circle x={canopyRadius * 0.1} y={canopyRadius * 0.2} radius={canopyRadius * 0.08} fill="#ef4444" />
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
