import React from 'react';
import { Path, Text } from 'react-konva';

export default function TagLabel({ width = 110, height = 50, cornerRadius = 6, fill = '#fef3c7', stroke = '#d97706', strokeWidth = 1.5, label = '', fontSize = 13, fontColor = '#92400e' }) {
  const w = Math.max(20, Number(width) || 110);
  const h = Math.max(10, Number(height) || 50);
  const r = Math.min(Number(cornerRadius) || 6, h / 3);
  const hw = w / 2, hh = h / 2;
  const tailW = hh * 0.6;  // pointed tail on right side

  // Rounded rect body with V-notch on right (tag shape)
  const d = [
    `M ${-hw + r} ${-hh}`,
    `L ${hw - tailW} ${-hh}`,
    `L ${hw} 0`,
    `L ${hw - tailW} ${hh}`,
    `L ${-hw + r} ${hh}`,
    `Q ${-hw} ${hh} ${-hw} ${hh - r}`,
    `L ${-hw} ${-hh + r}`,
    `Q ${-hw} ${-hh} ${-hw + r} ${-hh}`,
    'Z',
  ].join(' ');

  return (
    <>
      <Path data={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth}  />
      {label ? (
        <Text text={label} x={-hw + r + 2} y={-hh + 4} width={w - tailW - r - 4} height={h - 8}
          align="center" verticalAlign="middle" fontSize={fontSize} fill={fontColor}  />
      ) : null}
    </>
  );
}
