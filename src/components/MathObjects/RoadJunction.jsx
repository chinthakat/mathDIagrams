import React from 'react';
import { Group, Rect, Line, Circle, Path } from 'react-konva';

export default function RoadJunction({ 
  size = 150, 
  fill = "#334155", 
  lineColor = "#fbbf24",
  junctionType = "cross"
}) {
  const roadW = size * 0.4;
  const halfS = size / 2;
  const halfR = roadW / 2;

  // Shared asphalt settings
  const shadowProps = {
    shadowColor: "#000",
    shadowBlur: 2,
    shadowOffset: { x: 0, y: 1 },
    shadowOpacity: 0.15
  };

  const renderCross = () => (
    <Group>
      {/* Asphalt Base - Vertical */}
      <Rect x={-halfR} y={-halfS} width={roadW} height={size} fill={fill} {...shadowProps} />
      {/* Asphalt Base - Horizontal */}
      <Rect x={-halfS} y={-halfR} width={size} height={roadW} fill={fill} {...shadowProps} />
      
      {/* Shoulders */}
      {/* Top Left */}
      <Path data={`M ${-halfR} ${-halfS} L ${-halfR} ${-halfR} L ${-halfS} ${-halfR}`} stroke="#e2e8f0" strokeWidth={2} />
      {/* Top Right */}
      <Path data={`M ${halfR} ${-halfS} L ${halfR} ${-halfR} L ${halfS} ${-halfR}`} stroke="#e2e8f0" strokeWidth={2} />
      {/* Bottom Left */}
      <Path data={`M ${-halfR} ${halfS} L ${-halfR} ${halfR} L ${-halfS} ${halfR}`} stroke="#e2e8f0" strokeWidth={2} />
      {/* Bottom Right */}
      <Path data={`M ${halfR} ${halfS} L ${halfR} ${halfR} L ${halfS} ${halfR}`} stroke="#e2e8f0" strokeWidth={2} />

      {/* Dashed Lines */}
      {/* Vertical dashes (leaving middle empty) */}
      <Line points={[0, -halfS, 0, -halfR*1.2]} stroke={lineColor} strokeWidth={2.5} dash={[10, 8]} />
      <Line points={[0, halfS, 0, halfR*1.2]} stroke={lineColor} strokeWidth={2.5} dash={[10, 8]} />
      {/* Horizontal dashes */}
      <Line points={[-halfS, 0, -halfR*1.2, 0]} stroke={lineColor} strokeWidth={2.5} dash={[10, 8]} />
      <Line points={[halfS, 0, halfR*1.2, 0]} stroke={lineColor} strokeWidth={2.5} dash={[10, 8]} />
    </Group>
  );

  const renderTJunction = () => (
    <Group>
      {/* Main horizontal road */}
      <Rect x={-halfS} y={-halfR} width={size} height={roadW} fill={fill} {...shadowProps} />
      {/* Stem vertical road extending downwards */}
      <Rect x={-halfR} y={halfR} width={roadW} height={halfS - halfR} fill={fill} {...shadowProps} />

      {/* Shoulders */}
      {/* Top straight shoulder */}
      <Line points={[-halfS, -halfR, halfS, -halfR]} stroke="#e2e8f0" strokeWidth={2} />
      {/* Bottom Left curve shoulder */}
      <Path data={`M ${-halfS} ${halfR} L ${-halfR} ${halfR} L ${-halfR} ${halfS}`} stroke="#e2e8f0" strokeWidth={2} />
      {/* Bottom Right curve shoulder */}
      <Path data={`M ${halfS} ${halfR} L ${halfR} ${halfR} L ${halfR} ${halfS}`} stroke="#e2e8f0" strokeWidth={2} />

      {/* Dashed Lines */}
      {/* Horizontal dashes running fully across */}
      <Line points={[-halfS, 0, halfS, 0]} stroke={lineColor} strokeWidth={2.5} dash={[10, 8]} />
      {/* Stem dash */}
      <Line points={[0, halfS, 0, halfR*1.2]} stroke={lineColor} strokeWidth={2.5} dash={[10, 8]} />
      
      {/* Yield line */}
      <Line points={[-halfR, halfR*1.2, halfR, halfR*1.2]} stroke="#e2e8f0" strokeWidth={3} dash={[8, 6]} />
    </Group>
  );

  const renderYJunction = () => {
    // Y Junction: Stem at bottom, splitting diagonally top-left and top-right
    return (
      <Group>
        {/* Base Stem */}
        <Rect x={-halfR} y={0} width={roadW} height={halfS} fill={fill} {...shadowProps} />
        {/* Diagonal Arms */}
        <Group rotation={35} y={halfR}>
          <Rect x={-halfR} y={-halfS*1.2} width={roadW} height={halfS*1.2} fill={fill} {...shadowProps} />
        </Group>
        <Group rotation={-35} y={halfR}>
          <Rect x={-halfR} y={-halfS*1.2} width={roadW} height={halfS*1.2} fill={fill} {...shadowProps} />
        </Group>

        {/* Outer Shoulders */}
        <Path data={`M ${-halfR} ${halfS} L ${-halfR} ${halfR*1.5} Q ${-halfR} ${0} ${-halfR - halfS*0.6} ${-halfS*0.8}`} stroke="#e2e8f0" strokeWidth={2} />
        <Path data={`M ${halfR} ${halfS} L ${halfR} ${halfR*1.5} Q ${halfR} ${0} ${halfR + halfS*0.6} ${-halfS*0.8}`} stroke="#e2e8f0" strokeWidth={2} />
        {/* Inner Wedge Shoulder */}
        <Path data={`M ${-halfR*0.7} ${-halfS} Q 0 ${-halfR*1.5} ${halfR*0.7} ${-halfS}`} stroke="#e2e8f0" strokeWidth={2} />

        {/* Center Dashes */}
        <Line points={[0, halfS, 0, halfR]} stroke={lineColor} strokeWidth={2.5} dash={[10, 8]} />
      </Group>
    );
  };

  const renderRoundabout = () => {
    const centerR = roadW * 0.9;
    const innerGrassR = centerR * 0.45;

    return (
      <Group>
        {/* 4 approach roads */}
        <Rect x={-halfR} y={-halfS} width={roadW} height={size} fill={fill} />
        <Rect x={-halfS} y={-halfR} width={size} height={roadW} fill={fill} />
        
        {/* The Roundabout Circle */}
        <Circle x={0} y={0} radius={centerR} fill={fill} {...shadowProps} />
        
        {/* Shoulders on Approach roads */}
        <Path data={`M ${-halfR} ${-halfS} L ${-halfR} ${-centerR}`} stroke="#e2e8f0" strokeWidth={2} />
        <Path data={`M ${halfR} ${-halfS} L ${halfR} ${-centerR}`} stroke="#e2e8f0" strokeWidth={2} />
        <Path data={`M ${-halfR} ${halfS} L ${-halfR} ${centerR}`} stroke="#e2e8f0" strokeWidth={2} />
        <Path data={`M ${halfR} ${halfS} L ${halfR} ${centerR}`} stroke="#e2e8f0" strokeWidth={2} />
        
        <Path data={`M ${-halfS} ${-halfR} L ${-centerR} ${-halfR}`} stroke="#e2e8f0" strokeWidth={2} />
        <Path data={`M ${-halfS} ${halfR} L ${-centerR} ${halfR}`} stroke="#e2e8f0" strokeWidth={2} />
        <Path data={`M ${halfS} ${-halfR} L ${centerR} ${-halfR}`} stroke="#e2e8f0" strokeWidth={2} />
        <Path data={`M ${halfS} ${halfR} L ${centerR} ${halfR}`} stroke="#e2e8f0" strokeWidth={2} />

        {/* Roundabout Outer Curve Shoulders */}
        <Path data={`M ${-centerR} ${-halfR} A ${centerR} ${centerR} 0 0 1 ${-halfR} ${-centerR}`} stroke="#e2e8f0" strokeWidth={2} />
        <Path data={`M ${halfR} ${-centerR} A ${centerR} ${centerR} 0 0 1 ${centerR} ${-halfR}`} stroke="#e2e8f0" strokeWidth={2} />
        <Path data={`M ${centerR} ${halfR} A ${centerR} ${centerR} 0 0 1 ${halfR} ${centerR}`} stroke="#e2e8f0" strokeWidth={2} />
        <Path data={`M ${-halfR} ${centerR} A ${centerR} ${centerR} 0 0 1 ${-centerR} ${halfR}`} stroke="#e2e8f0" strokeWidth={2} />

        {/* Center Island */}
        <Circle x={0} y={0} radius={innerGrassR} fill="#bbf7d0" stroke="#e2e8f0" strokeWidth={2} />
        
        {/* Dashed circle lines in roundabout */}
        <Circle x={0} y={0} radius={centerR * 0.72} stroke={lineColor} strokeWidth={2} dash={[8, 8]} />

        {/* Approach dashed lines */}
        <Line points={[0, -halfS, 0, -centerR - 5]} stroke={lineColor} strokeWidth={2.5} dash={[10, 8]} />
        <Line points={[0, halfS, 0, centerR + 5]} stroke={lineColor} strokeWidth={2.5} dash={[10, 8]} />
        <Line points={[-halfS, 0, -centerR - 5, 0]} stroke={lineColor} strokeWidth={2.5} dash={[10, 8]} />
        <Line points={[halfS, 0, centerR + 5, 0]} stroke={lineColor} strokeWidth={2.5} dash={[10, 8]} />
      </Group>
    );
  };

  switch (junctionType) {
    case 't-junction': return renderTJunction();
    case 'y-junction': return renderYJunction();
    case 'roundabout': return renderRoundabout();
    case 'cross':
    default: return renderCross();
  }
}
