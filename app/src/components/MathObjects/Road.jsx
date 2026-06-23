import React from 'react';
import { Group, Rect, Line } from 'react-konva';

export default function Road({ 
  width = 200, 
  height = 40, 
  fill = "#334155", 
  lineColor = "#fbbf24"
}) {
  const isVertical = height > width;

  const gradientStart = isVertical ? { x: -width/2, y: 0 } : { x: 0, y: -height/2 };
  const gradientEnd = isVertical ? { x: width/2, y: 0 } : { x: 0, y: height/2 };

  const shoulder1 = isVertical 
    ? [-width/2 + 1.5, -height/2, -width/2 + 1.5, height/2]
    : [-width/2, -height/2 + 1.5, width/2, -height/2 + 1.5];
    
  const shoulder2 = isVertical
    ? [width/2 - 1.5, -height/2, width/2 - 1.5, height/2]
    : [-width/2, height/2 - 1.5, width/2, height/2 - 1.5];

  const centerLine = isVertical
    ? [0, -height/2, 0, height/2]
    : [-width/2, 0, width/2, 0];

  return (
    <Group>
      {/* Asphalt Base with subtle gradient */}
      <Rect 
        x={-width/2} 
        y={-height/2} 
        width={width} 
        height={height} 
        fillLinearGradientStartPoint={gradientStart}
        fillLinearGradientEndPoint={gradientEnd}
        fillLinearGradientColorStops={[0, fill, 1, '#1e293b']}
        shadowColor="#000"
        shadowBlur={2}
        shadowOffset={{ x: 0, y: 1 }}
        shadowOpacity={0.15}
      />
      
      {/* Outer White Shoulders */}
      <Line
        points={shoulder1}
        stroke="#e2e8f0"
        strokeWidth={2}
      />
      <Line
        points={shoulder2}
        stroke="#e2e8f0"
        strokeWidth={2}
      />

      {/* Center Dashed Lane Divider */}
      <Line 
        points={centerLine} 
        stroke={lineColor} 
        strokeWidth={2.5} 
        dash={[12, 10]} 
      />
    </Group>
  );
}
