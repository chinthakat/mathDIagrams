import React from 'react';
import { Group, Rect, Text, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { resolveClipArtSrc } from '../../assets/clipartLibrary.js';

/**
 * Pictograph — icon-based pictogram chart.
 * Each icon represents `iconValue` units. Partial icons are shown as fractions.
 *
 * Props:
 *   rows       — [{ id, label, count }]  count = number of units (not icons)
 *   iconSrc    — clipart id string (e.g. "star", "apple", "person")
 *   iconValue  — how many units one icon represents (default 1)
 *   iconSize   — pixel size of each icon (default 28)
 *   maxIcons   — max icons per row before wrapping (default 10)
 *   title
 *   keyText    — e.g. "Each  = 2 votes"  (if empty, auto-generated)
 *   width, height
 *   stroke
 */
function IconCell({ src, size, opacity = 1 }) {
  const [img] = useImage(src, 'anonymous');
  return (
    <KonvaImage
      image={img}
      width={size}
      height={size}
      opacity={opacity}
    />
  );
}

export default function Pictograph({
  width = 380,
  height = 260,
  rows,
  iconSrc = 'star',
  iconValue = 1,
  iconSize = 26,
  maxIcons = 10,
  title = '',
  keyText = '',
  stroke = '#334155',
}) {
  const safeRows = (rows && rows.length) ? rows : [
    { id: 'r1', label: 'Monday',    count: 4 },
    { id: 'r2', label: 'Tuesday',   count: 6 },
    { id: 'r3', label: 'Wednesday', count: 3 },
    { id: 'r4', label: 'Thursday',  count: 5 },
  ];

  const TITLE_H    = title ? 28 : 8;
  const KEY_H      = 24;
  const LABEL_W    = 90;
  const ROW_H      = iconSize + 8;
  const PAD        = 10;

  const resolvedSrc = resolveClipArtSrc(iconSrc) || resolveClipArtSrc('star');
  const autoKey = keyText || `Each icon = ${iconValue} unit${iconValue !== 1 ? 's' : ''}`;

  return (
    <Group>
      <Rect x={0} y={0} width={width} height={height} fill="transparent" />

      {/* Title */}
      {title ? <Text text={title} x={0} y={PAD / 2} width={width} align="center"
        fontSize={13} fontStyle="bold" fill={stroke} fontFamily="Arial" /> : null}

      {/* Rows */}
      {safeRows.map((row, ri) => {
        const y = TITLE_H + PAD + ri * ROW_H;
        const numIcons = row.count / iconValue;
        const fullIcons = Math.floor(numIcons);
        const partial   = numIcons - fullIcons;

        return (
          <Group key={row.id || ri}>
            {/* Row label */}
            <Text text={row.label} x={PAD} y={y + (iconSize - 13) / 2}
              width={LABEL_W - 6} align="right" fontSize={12}
              fill={stroke} fontFamily="Arial" />

            {/* Full icons */}
            {Array.from({ length: Math.min(fullIcons, maxIcons) }, (_, ii) => (
              <Group key={ii} x={LABEL_W + PAD + ii * (iconSize + 4)} y={y}>
                <IconCell src={resolvedSrc} size={iconSize} />
              </Group>
            ))}

            {/* Partial icon */}
            {partial > 0 && fullIcons < maxIcons && (
              <Group x={LABEL_W + PAD + fullIcons * (iconSize + 4)} y={y}>
                <Rect x={0} y={0} width={iconSize * partial} height={iconSize}
                  fill="transparent" />
                <IconCell src={resolvedSrc} size={iconSize} opacity={partial} />
              </Group>
            )}
          </Group>
        );
      })}

      {/* Key */}
      <Group y={TITLE_H + PAD + safeRows.length * ROW_H + 6}>
        <IconCell src={resolvedSrc} size={iconSize * 0.8} />
        <Text text={` = ${iconValue}`} x={iconSize * 0.85} y={(iconSize * 0.8 - 12) / 2}
          fontSize={11} fill={stroke} fontFamily="Arial" />
        <Text text={autoKey} x={0} y={iconSize * 0.85 + 2}
          fontSize={10} fill={stroke} fontFamily="Arial" opacity={0.7} />
      </Group>
    </Group>
  );
}
