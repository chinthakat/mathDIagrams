import React from 'react';
import { Group, Ellipse, Line, Circle, Text } from 'react-konva';

/**
 * SpiderIcon — stylised ant/spider creature with 6 legs (ant-style) and a label.
 * props: size, fill, stroke, strokeWidth, label, labelPos
 */
export default function SpiderIcon({
  size = 24,
  fill = '#1e293b',
  stroke = '#0f172a',
  strokeWidth = 1.5,
  label = '',
  labelPos = 'top',
}) {
  const s = size;
  // Three body segments (ant): head, thorax, abdomen
  const headR = s * 0.18;
  const thoraxRX = s * 0.14;
  const thoraxRY = s * 0.16;
  const abdomenRX = s * 0.22;
  const abdomenRY = s * 0.26;

  const headY    = -s * 0.52;
  const thoraxY  = -s * 0.24;
  const abdomenY =  s * 0.14;

  // Legs — 3 pairs attached to thorax
  const legSpread = s * 0.55;
  const legLen = s * 0.46;
  const legPairs = [
    { ty: thoraxY - s * 0.08, angle: -55 },
    { ty: thoraxY,            angle: -80 },
    { ty: thoraxY + s * 0.08, angle: -110 },
  ];

  const legLines = [];
  legPairs.forEach(({ ty, angle }, i) => {
    const rad = (angle * Math.PI) / 180;
    // left leg
    legLines.push(
      <Line
        key={`ll${i}`}
        points={[0, ty, Math.cos(rad) * legLen, ty + Math.sin(rad) * legLen]}
        stroke={stroke}
        strokeWidth={strokeWidth}
        lineCap="round"
      />
    );
    // right leg (mirror)
    legLines.push(
      <Line
        key={`rl${i}`}
        points={[0, ty, -Math.cos(rad) * legLen, ty + Math.sin(rad) * legLen]}
        stroke={stroke}
        strokeWidth={strokeWidth}
        lineCap="round"
      />
    );
  });

  // Antennae from head
  const antAngle1 = (-50 * Math.PI) / 180;
  const antAngle2 = (-130 * Math.PI) / 180;
  const antLen = s * 0.35;

  // Label placement
  const labelOffset = s * 0.72;
  const labelX = -s * 0.2;
  const labelY = labelPos === 'bottom' ? abdomenY + abdomenRY + 4 : headY - headR - labelOffset;

  return (
    <Group>
      {/* Antennae */}
      <Line
        points={[0, headY, Math.cos(antAngle1) * antLen, headY + Math.sin(antAngle1) * antLen]}
        stroke={stroke} strokeWidth={strokeWidth} lineCap="round"
      />
      <Line
        points={[0, headY, Math.cos(antAngle2) * antLen, headY + Math.sin(antAngle2) * antLen]}
        stroke={stroke} strokeWidth={strokeWidth} lineCap="round"
      />

      {/* Legs */}
      {legLines}

      {/* Abdomen */}
      <Ellipse
        radiusX={abdomenRX} radiusY={abdomenRY}
        y={abdomenY}
        fill={fill} stroke={stroke} strokeWidth={strokeWidth}
      />

      {/* Thorax */}
      <Ellipse
        radiusX={thoraxRX} radiusY={thoraxRY}
        y={thoraxY}
        fill={fill} stroke={stroke} strokeWidth={strokeWidth}
      />

      {/* Head */}
      <Circle
        radius={headR}
        y={headY}
        fill={fill} stroke={stroke} strokeWidth={strokeWidth}
      />

      {/* Label e.g. (A) */}
      {label ? (
        <Text
          text={label}
          x={labelX}
          y={labelY}
          fontSize={Math.max(10, s * 0.4)}
          fontStyle="bold"
          fill={stroke}
        />
      ) : null}
    </Group>
  );
}
