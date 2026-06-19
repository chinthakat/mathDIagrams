import React from 'react';
import { Group, Rect, Line } from 'react-konva';

export default function Road({ 
  width = 200, 
  height = 40, 
  fill = "#334155", 
  lineColor = "#fbbf24"
}) {
  return (
    <Group>
      {/* Asphalt Base with subtle gradient */}
      <Rect 
        x={-width/2} 
        y={-height/2} 
        width={width} 
        height={height} 
        fillLinearGradientStartPoint={{ x: 0, y: -height/2 }}
        fillLinearGradientEndPoint={{ x: 0, y: height/2 }}
        fillLinearGradientColorStops={[0, fill, 1, '#1e293b']}
        shadowColor="#000"
        shadowBlur={2}
        shadowOffset={{ x: 0, y: 1 }}
        shadowOpacity={0.15}
      />
      
      {/* Outer White Shoulders */}
      <Line
        points={[-width/2, -height/2 + 1.5, width/2, -height/2 + 1.5]}
        stroke="#e2e8f0"
        strokeWidth={2}
      />
      <Line
        points={[-width/2, height/2 - 1.5, width/2, height/2 - 1.5]}
        stroke="#e2e8f0"
        strokeWidth={2}
      />

      {/* Center Dashed Lane Divider */}
      <Line 
        points={[-width/2, 0, width/2, 0]} 
        stroke={lineColor} 
        strokeWidth={2.5} 
        dash={[12, 10]} 
      />
    </Group>
  );
}
