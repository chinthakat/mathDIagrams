import React from 'react';
import { Group, Rect, Circle, Line, Text, Ellipse, Arc } from 'react-konva';

export default function Robot({
  width = 100,
  height = 150,
  label = '',
  fill = '#ffffff',
  stroke = '#000000',
  strokeWidth = 2,
}) {
  const w = Number(width);
  const h = Number(height);
  const sw = Number(strokeWidth);

  // Proportions relative to width and height
  const headW = w * 0.45;
  const headH = h * 0.22;
  const bodyW = w * 0.65;
  const bodyH = h * 0.42;
  const neckW = w * 0.15;
  const neckH = h * 0.05;

  const headY = -h * 0.22;
  const neckY = headY + headH / 2 + neckH / 2;
  const bodyY = neckY + neckH / 2 + bodyH / 2;

  const eyeRadius = headW * 0.1;
  const earW = w * 0.06;
  const earH = headH * 0.35;
  const antennaH = headH * 0.3;
  const antennaRadius = headW * 0.08;

  const legW = w * 0.12;
  const legH = h * 0.18;
  const legY = bodyY + bodyH / 2 + legH / 2;

  const armW = w * 0.08;
  const armH = bodyH * 0.65;

  return (
    <Group>
      {/* Antenna */}
      <Line
        points={[0, headY - headH / 2, 0, headY - headH / 2 - antennaH]}
        stroke={stroke}
        strokeWidth={sw}
      />
      <Circle
        x={0}
        y={headY - headH / 2 - antennaH - antennaRadius}
        radius={antennaRadius}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />

      {/* Ears */}
      <Rect
        x={-headW / 2 - earW}
        y={headY - earH / 2}
        width={earW}
        height={earH}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />
      <Rect
        x={headW / 2}
        y={headY - earH / 2}
        width={earW}
        height={earH}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />

      {/* Head */}
      <Rect
        x={-headW / 2}
        y={headY - headH / 2}
        width={headW}
        height={headH}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        cornerRadius={4}
      />

      {/* Eyes */}
      <Circle
        x={-headW * 0.22}
        y={headY - headH * 0.1}
        radius={eyeRadius}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />
      <Circle
        x={headW * 0.22}
        y={headY - headH * 0.1}
        radius={eyeRadius}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />

      {/* Mouth */}
      <Line
        points={[-headW * 0.2, headY + headH * 0.2, headW * 0.2, headY + headH * 0.2]}
        stroke={stroke}
        strokeWidth={sw}
      />

      {/* Neck */}
      <Rect
        x={-neckW / 2}
        y={neckY - neckH / 2}
        width={neckW}
        height={neckH}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />

      {/* Legs */}
      <Rect
        x={-bodyW * 0.22 - legW / 2}
        y={legY - legH / 2}
        width={legW}
        height={legH}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />
      <Rect
        x={bodyW * 0.22 - legW / 2}
        y={legY - legH / 2}
        width={legW}
        height={legH}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />

      {/* Feet */}
      <Ellipse
        x={-bodyW * 0.22}
        y={legY + legH / 2}
        radiusX={legW * 1.5}
        radiusY={legW * 0.6}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />
      <Ellipse
        x={bodyW * 0.22}
        y={legY + legH / 2}
        radiusX={legW * 1.5}
        radiusY={legW * 0.6}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />

      {/* Left Arm */}
      <Group x={-bodyW / 2} y={bodyY - bodyH * 0.25}>
        <Line
          points={[0, 0, -w * 0.12, 0]}
          stroke={stroke}
          strokeWidth={sw}
        />
        <Line
          points={[-w * 0.12, 0, -w * 0.12, armH]}
          stroke={stroke}
          strokeWidth={sw}
        />
        <Arc
          x={-w * 0.12}
          y={armH}
          innerRadius={w * 0.05}
          outerRadius={w * 0.05}
          angle={180}
          rotation={90}
          stroke={stroke}
          strokeWidth={sw}
        />
      </Group>

      {/* Right Arm */}
      <Group x={bodyW / 2} y={bodyY - bodyH * 0.25}>
        <Line
          points={[0, 0, w * 0.12, 0]}
          stroke={stroke}
          strokeWidth={sw}
        />
        <Line
          points={[w * 0.12, 0, w * 0.12, armH]}
          stroke={stroke}
          strokeWidth={sw}
        />
        <Arc
          x={w * 0.12}
          y={armH}
          innerRadius={w * 0.05}
          outerRadius={w * 0.05}
          angle={180}
          rotation={-90}
          stroke={stroke}
          strokeWidth={sw}
        />
      </Group>

      {/* Body */}
      <Rect
        x={-bodyW / 2}
        y={bodyY - bodyH / 2}
        width={bodyW}
        height={bodyH}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        cornerRadius={6}
      />

      {/* Body Label */}
      {label && (
        <Text
          text={label}
          x={-bodyW / 2}
          y={bodyY - bodyH * 0.25}
          width={bodyW}
          align="center"
          fontSize={bodyH * 0.5}
          fontStyle="bold"
          fill={stroke}
        />
      )}
    </Group>
  );
}
