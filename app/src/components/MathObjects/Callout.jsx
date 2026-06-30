import React from 'react';
import { Path, Text } from 'react-konva';

/**
 * Speech-bubble / callout shape centred at (0,0).
 * The bubble body is a rounded rectangle; the tail points in `tailDir`
 * (bottom-left | bottom-right | top-left | top-right).
 */
export default function Callout({
  width = 140, height = 80,
  cornerRadius = 12,
  tailDir = 'bottom-left',
  tailSize = 22,
  fill = '#ffffff', stroke = '#334155', strokeWidth = 1.5,
  label = '',
  fontSize = 14, fontColor = '#1e293b',
}) {
  const w  = Math.max(20, Number(width)  || 140);
  const h  = Math.max(20, Number(height) || 80);
  const r  = Math.min(cornerRadius, w / 3, h / 3);
  const ts = Math.max(8, Number(tailSize) || 22);

  const hw = w / 2, hh = h / 2;

  // Build rounded-rect path + tail using SVG arc commands.
  // Body: top-left corner at (-hw, -hh)
  const body = [
    `M ${-hw + r} ${-hh}`,
    `L ${hw - r} ${-hh}`,
    `Q ${hw} ${-hh} ${hw} ${-hh + r}`,
    `L ${hw} ${hh - r}`,
    `Q ${hw} ${hh} ${hw - r} ${hh}`,
    `L ${-hw + r} ${hh}`,
    `Q ${-hw} ${hh} ${-hw} ${hh - r}`,
    `L ${-hw} ${-hh + r}`,
    `Q ${-hw} ${-hh} ${-hw + r} ${-hh}`,
    'Z',
  ].join(' ');

  // Tail path — a small triangle that pokes out from a corner of the body
  const tailPaths = {
    'bottom-left':  `M ${-hw + r + ts} ${hh} L ${-hw - ts * 0.3} ${hh + ts} L ${-hw + r + ts * 1.4} ${hh} Z`,
    'bottom-right': `M ${hw - r - ts} ${hh} L ${hw + ts * 0.3} ${hh + ts} L ${hw - r - ts * 1.4} ${hh} Z`,
    'top-left':     `M ${-hw + r + ts} ${-hh} L ${-hw - ts * 0.3} ${-hh - ts} L ${-hw + r + ts * 1.4} ${-hh} Z`,
    'top-right':    `M ${hw - r - ts} ${-hh} L ${hw + ts * 0.3} ${-hh - ts} L ${hw - r - ts * 1.4} ${-hh} Z`,
  };

  const tailPath = tailPaths[tailDir] || tailPaths['bottom-left'];

  return (
    <>
      <Path data={body}     fill={fill} stroke={stroke} strokeWidth={strokeWidth}  />
      <Path data={tailPath} fill={fill} stroke={stroke} strokeWidth={strokeWidth}  />
      {label ? (
        <Text
          text={label}
          x={-hw + r} y={-hh + 6}
          width={w - r * 2} height={h - 12}
          align="center" verticalAlign="middle"
          fontSize={fontSize} fill={fontColor}
          
        />
      ) : null}
    </>
  );
}
