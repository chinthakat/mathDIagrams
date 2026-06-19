import React from 'react';
import { Group, Rect, Path, Circle } from 'react-konva';

export default function Flag({ 
  radius = 25, 
  color = "#ef4444", 
  label = "Flag", 
  showLabel = true,
  rotation = 0
}) {
  const height = radius * 2.2;
  const poleWidth = Math.max(2, radius * 0.08);

  // Waving flag path path definition
  // Starts at top of pole, waves right and down, then waves left back to pole
  const flagW = radius * 1.3;
  const flagH = radius * 0.8;
  const flagPath = `
    M 0 0 
    Q ${flagW * 0.3} ${-flagH * 0.15} ${flagW * 0.5} 0 
    T ${flagW} 0 
    L ${flagW} ${flagH} 
    Q ${flagW * 0.6} ${flagH * 1.15} ${flagW * 0.5} ${flagH} 
    T 0 ${flagH} 
    Z
  `;

  // Waving flag highlight / shadow path
  const shadowPath = `
    M ${flagW * 0.5} 0 
    Q ${flagW * 0.75} ${flagH * 0.05} ${flagW} 0 
    L ${flagW} ${flagH} 
    Q ${flagW * 0.6} ${flagH * 1.15} ${flagW * 0.5} ${flagH} 
    Z
  `;

  return (
    <Group rotation={rotation}>
      {/* Stand Base */}
      <Rect
        x={-radius * 0.3}
        y={height - radius * 0.15}
        width={radius * 0.6}
        height={radius * 0.15}
        fill="#475569"
        cornerRadius={2}
      />
      
      {/* Flagpole */}
      <Rect
        x={-poleWidth / 2}
        y={0}
        width={poleWidth}
        height={height}
        fillLinearGradientStartPoint={{ x: -poleWidth/2, y: 0 }}
        fillLinearGradientEndPoint={{ x: poleWidth/2, y: 0 }}
        fillLinearGradientColorStops={[0, '#cbd5e1', 0.5, '#94a3b8', 1, '#475569']}
      />

      {/* Gold sphere at the top */}
      <Circle
        x={0}
        y={0}
        radius={radius * 0.1}
        fillLinearGradientStartPoint={{ x: -2, y: -2 }}
        fillLinearGradientEndPoint={{ x: 2, y: 2 }}
        fillLinearGradientColorStops={[0, '#fef08a', 0.5, '#eab308', 1, '#a16207']}
      />

      {/* Waving Flag Fabric */}
      <Group x={poleWidth / 2} y={radius * 0.2}>
        {/* Main flag body with color */}
        <Path
          data={flagPath}
          fill={color}
          shadowColor="#000"
          shadowBlur={3}
          shadowOffset={{ x: 1, y: 2 }}
          shadowOpacity={0.2}
        />
        {/* Shadow Overlay for wave depth */}
        <Path
          data={shadowPath}
          fill="rgba(0, 0, 0, 0.12)"
        />
      </Group>
    </Group>
  );
}
