import React from 'react';
import { Group, Rect, Line, Text, Arc } from 'react-konva';
import MathIcon from './MathIcon';

// A labelled 2.5D map structure. `buildingType` picks the silhouette so a set of
// landmarks on the same map can look visually distinct rather than recoloured copies
// of the same house shape.
export default function MapBuilding({
  width = 80,
  height = 60,
  buildingType = 'house', // 'house' | 'flatBlock' | 'tower' | 'dome' | 'hangar'
  fill = "#3b82f6",
  stroke = "#1d4ed8",
  strokeWidth = 2,
  label = "School",
  iconName = "School",
  showLabel = true
}) {
  const halfW = width / 2;
  const halfH = height / 2;

  const shadowColor = adjustColorBrightness(fill, -25);
  const roofColor = adjustColorBrightness(fill, -40);
  const wallColorL = adjustColorBrightness(fill, 10);
  const wallColorR = shadowColor;

  const groundShadow = (
    <Rect x={-halfW * 1.1} y={halfH - 4} width={width * 1.1} height={8} fill="rgba(0,0,0,0.12)" cornerRadius={4} />
  );

  const iconBadge = (bx, by) => (
    <Group x={bx} y={by}>
      <MathIcon url={null} iconName={iconName} color="#ffffff" width={16} height={16} opacity={0.9} />
    </Group>
  );

  const labelText = showLabel && label && (
    <Text text={label} x={-width} y={halfH + 6} width={width * 2} align="center" fontSize={11} fontStyle="bold" fill="#334155" />
  );

  if (buildingType === 'flatBlock') {
    const wallW = width * 0.9;
    return (
      <Group>
        {groundShadow}
        <Rect x={-wallW / 2} y={-halfH} width={wallW / 2} height={height} fill={wallColorL} stroke={stroke} strokeWidth={1} />
        <Rect x={0} y={-halfH} width={wallW / 2} height={height} fill={wallColorR} stroke={stroke} strokeWidth={1} />
        {/* Flat roof cap */}
        <Rect x={-wallW / 2 - 3} y={-halfH - 5} width={wallW + 6} height={5} fill={roofColor} stroke={stroke} strokeWidth={1} />
        {/* Window grid on both facades */}
        {[0.2, 0.5, 0.8].map((f, i) => (
          <Rect key={`wl-${i}`} x={-wallW * 0.4} y={-halfH + height * f} width={10} height={8} fill="#fef08a" stroke={stroke} strokeWidth={1} />
        ))}
        {[0.2, 0.5, 0.8].map((f, i) => (
          <Rect key={`wr-${i}`} x={wallW * 0.15} y={-halfH + height * f} width={10} height={8} fill="#ffffff" stroke={stroke} strokeWidth={1} />
        ))}
        {iconBadge(-wallW * 0.25 - 8, -halfH + 8)}
        {labelText}
      </Group>
    );
  }

  if (buildingType === 'tower') {
    const baseW = width * 0.7;
    const topW = width * 0.36;
    const baseH = height * 0.65;
    const topH = height * 0.35;
    const shaftTopY = halfH - baseH - topH;
    return (
      <Group>
        {groundShadow}
        <Rect x={-baseW / 2} y={halfH - baseH} width={baseW / 2} height={baseH} fill={wallColorL} stroke={stroke} strokeWidth={1} />
        <Rect x={0} y={halfH - baseH} width={baseW / 2} height={baseH} fill={wallColorR} stroke={stroke} strokeWidth={1} />
        {/* Narrower shaft above the base */}
        <Rect x={-topW / 2} y={shaftTopY} width={topW} height={topH} fill={roofColor} stroke={stroke} strokeWidth={strokeWidth} />
        {/* Antenna / mast */}
        <Line points={[0, shaftTopY, 0, shaftTopY - 14]} stroke={stroke} strokeWidth={2} />
        <Rect x={-6} y={shaftTopY - 18} width={12} height={4} fill={stroke} />
        {iconBadge(-baseW * 0.25 - 8, halfH - baseH + 6)}
        {labelText}
      </Group>
    );
  }

  if (buildingType === 'dome') {
    const baseH = height * 0.45;
    const domeR = halfW * 0.85;
    const baseTopY = halfH - baseH;
    return (
      <Group>
        {groundShadow}
        <Rect x={-halfW * 0.75} y={baseTopY} width={halfW * 0.75} height={baseH} fill={wallColorL} stroke={stroke} strokeWidth={1} />
        <Rect x={0} y={baseTopY} width={halfW * 0.75} height={baseH} fill={wallColorR} stroke={stroke} strokeWidth={1} />
        {/* Dome */}
        <Arc x={0} y={baseTopY} innerRadius={0} outerRadius={domeR} angle={180} rotation={180} fill={roofColor} stroke={stroke} strokeWidth={strokeWidth} />
        {iconBadge(-domeR * 0.35, baseTopY - domeR * 0.55)}
        {labelText}
      </Group>
    );
  }

  if (buildingType === 'hangar') {
    const baseH = height * 0.5;
    const archR = halfW * 0.95;
    const baseTopY = halfH - baseH;
    return (
      <Group>
        {groundShadow}
        <Rect x={-halfW * 0.9} y={baseTopY} width={halfW * 1.8} height={baseH} fill={wallColorR} stroke={stroke} strokeWidth={1} />
        {/* Arched roof */}
        <Arc x={0} y={baseTopY} innerRadius={0} outerRadius={archR} angle={180} rotation={180} fill={roofColor} stroke={stroke} strokeWidth={strokeWidth} />
        {/* Hangar bay door */}
        <Rect x={-14} y={halfH - baseH * 0.72} width={28} height={baseH * 0.72} fill="#1e293b" stroke={stroke} strokeWidth={1} />
        {iconBadge(halfW * 0.35, baseTopY + 6)}
        {labelText}
      </Group>
    );
  }

  // Default: 'house' — pitched-roof structure
  const roofH = height * 0.25;
  const baseH = height * 0.75;
  const wallW = width * 0.9;

  return (
    <Group>
      {groundShadow}
      <Rect x={-wallW / 2} y={-halfH + roofH} width={wallW / 2} height={baseH} fill={wallColorL} stroke={stroke} strokeWidth={1} />
      <Rect x={0} y={-halfH + roofH} width={wallW / 2} height={baseH} fill={wallColorR} stroke={stroke} strokeWidth={1} />
      <Line
        points={[
          -wallW / 2 - 4, -halfH + roofH,
          -wallW / 4, -halfH,
          0, -halfH + roofH / 2,
          wallW / 4, -halfH,
          wallW / 2 + 4, -halfH + roofH
        ]}
        fill={roofColor}
        stroke={stroke}
        strokeWidth={strokeWidth}
        closed={true}
      />
      <Rect x={-wallW * 0.25 - 6} y={halfH - baseH * 0.4} width={12} height={baseH * 0.4} fill="#fef08a" stroke={stroke} strokeWidth={1} cornerRadius={1} />
      <Rect x={wallW * 0.15} y={-halfH + roofH + baseH * 0.2} width={10} height={8} fill="#ffffff" stroke={stroke} strokeWidth={1} />
      <Rect x={wallW * 0.3} y={-halfH + roofH + baseH * 0.2} width={10} height={8} fill="#ffffff" stroke={stroke} strokeWidth={1} />
      <Rect x={wallW * 0.15} y={-halfH + roofH + baseH * 0.55} width={10} height={8} fill="#ffffff" stroke={stroke} strokeWidth={1} />
      <Rect x={wallW * 0.3} y={-halfH + roofH + baseH * 0.55} width={10} height={8} fill="#ffffff" stroke={stroke} strokeWidth={1} />
      {iconBadge(-wallW * 0.25 - 8, -halfH + roofH + baseH * 0.15)}
      {labelText}
    </Group>
  );
}

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
