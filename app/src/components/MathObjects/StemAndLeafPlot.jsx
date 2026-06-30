import React from 'react';
import { Group, Rect, Line, Text } from 'react-konva';

/**
 * StemAndLeafPlot — renders a traditional stem-and-leaf display.
 *
 * Props:
 *   stems   — [{ stem: string|number, leaves: number[] }]
 *             e.g. [{ stem: 1, leaves: [2,4,7] }, { stem: 2, leaves: [0,3,3,9] }]
 *   title
 *   keyText — key explanation, e.g. "1|2 means 12"
 *   width, height
 *   stroke, strokeWidth
 *   fontSize
 */
export default function StemAndLeafPlot({
  width = 300,
  height = 220,
  stems,
  title = '',
  keyText = '',
  stroke = '#334155',
  strokeWidth = 1.5,
  fontSize = 13,
}) {
  const safeStems = (stems && stems.length) ? stems : [
    { stem: 1, leaves: [2, 4, 7] },
    { stem: 2, leaves: [0, 3, 3, 9] },
    { stem: 3, leaves: [1, 5] },
  ];

  const PAD        = 12;
  const TITLE_H    = title ? 26 : 8;
  const KEY_H      = keyText ? 22 : 0;
  const ROW_H      = fontSize + 10;
  const STEM_COL_W = 40;
  const SEP_X      = PAD + STEM_COL_W;

  // auto-size height if not constrained
  const neededH = TITLE_H + KEY_H + safeStems.length * ROW_H + PAD * 2;
  const drawH   = Math.max(height, neededH);

  return (
    <Group>
      <Rect x={0} y={0} width={width} height={drawH} fill="transparent" />

      {/* Title */}
      {title ? (
        <Text text={title} x={0} y={PAD / 2} width={width} align="center"
          fontSize={13} fontStyle="bold" fill={stroke} fontFamily="Arial" />
      ) : null}

      {/* Header row */}
      <Text text="Stem" x={PAD} y={TITLE_H} width={STEM_COL_W} align="center"
        fontSize={11} fontStyle="bold" fill={stroke} fontFamily="Arial" />
      <Text text="Leaves" x={SEP_X + 10} y={TITLE_H}
        fontSize={11} fontStyle="bold" fill={stroke} fontFamily="Arial" />
      <Line
        points={[PAD, TITLE_H + fontSize + 2, width - PAD, TITLE_H + fontSize + 2]}
        stroke={stroke} strokeWidth={strokeWidth * 0.7} opacity={0.4}
      />

      {/* Stem rows */}
      {safeStems.map((row, i) => {
        const y = TITLE_H + fontSize + 8 + i * ROW_H;
        return (
          <Group key={i}>
            {/* Stem value */}
            <Text
              text={String(row.stem)}
              x={PAD} y={y}
              width={STEM_COL_W} align="center"
              fontSize={fontSize} fontStyle="bold"
              fill={stroke} fontFamily="monospace"
            />
            {/* Divider */}
            <Line
              points={[SEP_X, y - 4, SEP_X, y + fontSize + 2]}
              stroke={stroke} strokeWidth={strokeWidth}
            />
            {/* Leaves */}
            <Text
              text={row.leaves.map(l => String(l)).join('  ')}
              x={SEP_X + 8} y={y}
              fontSize={fontSize}
              fill={stroke} fontFamily="monospace"
            />
          </Group>
        );
      })}

      {/* Key */}
      {keyText ? (
        <Text
          text={`Key: ${keyText}`}
          x={PAD} y={drawH - KEY_H - 2}
          fontSize={10} fontStyle="italic"
          fill={stroke} fontFamily="Arial" opacity={0.75}
        />
      ) : null}
    </Group>
  );
}
