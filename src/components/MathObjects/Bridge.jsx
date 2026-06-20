import React from 'react';
import { Group, Rect, Line, Text } from 'react-konva';

export default function Bridge({
  length = 160,
  width = 60,
  fill = '#334155', // asphalt color
  lineColor = '#fbbf24', // dashed line color
  bridgeType = 'suspension', // 'suspension', 'beam', 'stone-arch'
  label = 'Golden Gate',
  labelColor = '#1e293b'
}) {
  const halfW = length / 2;
  const halfH = width / 2;
  const pylonH = width * 0.8;

  const renderBridgeStructure = () => {
    switch (bridgeType) {
      case 'stone-arch':
        return (
          <Group>
            {/* Stone side walls */}
            <Rect x={-halfW} y={-halfH - 8} width={length} height={16} fill="#78716c" cornerRadius={2} />
            <Rect x={-halfW} y={halfH - 8} width={length} height={16} fill="#78716c" cornerRadius={2} />
            {/* Texture lines */}
            <Line points={[-halfW + 15, -halfH - 8, -halfW + 15, -halfH + 8]} stroke="#57534e" strokeWidth={2} />
            <Line points={[-halfW + 45, -halfH - 8, -halfW + 45, -halfH + 8]} stroke="#57534e" strokeWidth={2} />
            <Line points={[0, -halfH - 8, 0, -halfH + 8]} stroke="#57534e" strokeWidth={2} />
            <Line points={[halfW - 45, -halfH - 8, halfW - 45, -halfH + 8]} stroke="#57534e" strokeWidth={2} />
            <Line points={[halfW - 15, -halfH - 8, halfW - 15, -halfH + 8]} stroke="#57534e" strokeWidth={2} />
            
            <Line points={[-halfW + 15, halfH - 8, -halfW + 15, halfH + 8]} stroke="#57534e" strokeWidth={2} />
            <Line points={[-halfW + 45, halfH - 8, -halfW + 45, halfH + 8]} stroke="#57534e" strokeWidth={2} />
            <Line points={[0, halfH - 8, 0, halfH + 8]} stroke="#57534e" strokeWidth={2} />
            <Line points={[halfW - 45, halfH - 8, halfW - 45, halfH + 8]} stroke="#57534e" strokeWidth={2} />
            <Line points={[halfW - 15, halfH - 8, halfW - 15, halfH + 8]} stroke="#57534e" strokeWidth={2} />
          </Group>
        );
      case 'beam':
        return (
          <Group>
            {/* Concrete barriers */}
            <Rect x={-halfW} y={-halfH - 4} width={length} height={8} fill="#94a3b8" />
            <Rect x={-halfW} y={halfH - 4} width={length} height={8} fill="#94a3b8" />
            {/* Support beams visible extending a bit */}
            <Rect x={-length * 0.3} y={-halfH - 8} width={12} height={width + 16} fill="#64748b" />
            <Rect x={length * 0.3 - 12} y={-halfH - 8} width={12} height={width + 16} fill="#64748b" />
          </Group>
        );
      case 'suspension':
      default:
        return (
          <Group>
            {/* Pylons */}
            <Rect x={-length * 0.3} y={-halfH - pylonH} width={12} height={width + pylonH * 2} fill="#64748b" cornerRadius={2} />
            <Rect x={length * 0.3 - 12} y={-halfH - pylonH} width={12} height={width + pylonH * 2} fill="#64748b" cornerRadius={2} />
            
            {/* Main Suspension Cables (Top edge) */}
            <Line
              points={[-halfW, -halfH, -length * 0.3 + 6, -halfH - pylonH + 4, 0, -halfH, length * 0.3 - 6, -halfH - pylonH + 4, halfW, -halfH]}
              stroke="#ef4444" strokeWidth={3} tension={0.4}
            />
            {/* Main Suspension Cables (Bottom edge) */}
            <Line
              points={[-halfW, halfH, -length * 0.3 + 6, halfH + pylonH - 4, 0, halfH, length * 0.3 - 6, halfH + pylonH - 4, halfW, halfH]}
              stroke="#ef4444" strokeWidth={3} tension={0.4}
            />

            {/* Vertical Hangers (Top) */}
            <Line points={[-length * 0.4, -halfH, -length * 0.4, -halfH - pylonH * 0.4]} stroke="#cbd5e1" strokeWidth={1} />
            <Line points={[-length * 0.15, -halfH, -length * 0.15, -halfH - pylonH * 0.4]} stroke="#cbd5e1" strokeWidth={1} />
            <Line points={[length * 0.15, -halfH, length * 0.15, -halfH - pylonH * 0.4]} stroke="#cbd5e1" strokeWidth={1} />
            <Line points={[length * 0.4, -halfH, length * 0.4, -halfH - pylonH * 0.4]} stroke="#cbd5e1" strokeWidth={1} />
            
            {/* Vertical Hangers (Bottom) */}
            <Line points={[-length * 0.4, halfH, -length * 0.4, halfH + pylonH * 0.4]} stroke="#cbd5e1" strokeWidth={1} />
            <Line points={[-length * 0.15, halfH, -length * 0.15, halfH + pylonH * 0.4]} stroke="#cbd5e1" strokeWidth={1} />
            <Line points={[length * 0.15, halfH, length * 0.15, halfH + pylonH * 0.4]} stroke="#cbd5e1" strokeWidth={1} />
            <Line points={[length * 0.4, halfH, length * 0.4, halfH + pylonH * 0.4]} stroke="#cbd5e1" strokeWidth={1} />
          </Group>
        );
    }
  };

  return (
    <Group>
      {/* 1. Underlying bridge structure */}
      {renderBridgeStructure()}

      {/* 2. Main Asphalt Roadway (matches Road.jsx) */}
      <Rect
        x={-halfW}
        y={-halfH}
        width={length}
        height={width}
        fillLinearGradientStartPoint={{ x: 0, y: -halfH }}
        fillLinearGradientEndPoint={{ x: 0, y: halfH }}
        fillLinearGradientColorStops={[0, fill, 1, '#1e293b']}
        shadowColor="#000"
        shadowBlur={4}
        shadowOffset={{ x: 0, y: 4 }}
        shadowOpacity={0.3}
      />
      
      {/* Outer White Shoulders */}
      <Line points={[-halfW, -halfH + 1.5, halfW, -halfH + 1.5]} stroke="#e2e8f0" strokeWidth={2} />
      <Line points={[-halfW, halfH - 1.5, halfW, halfH - 1.5]} stroke="#e2e8f0" strokeWidth={2} />

      {/* Center Dashed Lane Divider */}
      <Line points={[-halfW, 0, halfW, 0]} stroke={lineColor} strokeWidth={2.5} dash={[12, 10]} />

      {/* 3. Label */}
      {label && (
        <Text
          x={-halfW}
          y={-halfH - 24}
          width={length}
          text={label}
          fontSize={12}
          fontFamily="Inter"
          fontStyle="bold"
          fill={labelColor}
          align="center"
        />
      )}
    </Group>
  );
}
