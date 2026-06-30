import React from 'react';
import { Group, Rect, Line, Text } from 'react-konva';

/**
 * TallyChart — renders category names, tally marks grouped by 5, and total frequency.
 *
 * Props:
 *   width, height — outer dimensions
 *   title        — optional table header title
 *   categories   — [{ id, label, count }]
 *   stroke       — border / lines color
 *   strokeWidth  — lines thickness
 *   textColor    — category and title text color
 *   fontSize     — font size for labels
 */
export default function TallyChart({
  width = 340,
  height = 200,
  title = '',
  categories,
  stroke = '#334155',
  strokeWidth = 1.5,
  textColor = '#1e293b',
  fontSize = 12,
}) {
  const safeCategories = (categories && categories.length) ? categories : [
    { id: 'cat1', label: 'Apples', count: 7 },
    { id: 'cat2', label: 'Oranges', count: 4 },
    { id: 'cat3', label: 'Bananas', count: 12 },
  ];

  const PAD = 10;
  const HEADER_H = title ? 28 : 0;
  const COL_LABEL_H = fontSize + 10;
  const PLOT_TOP = HEADER_H + COL_LABEL_H + PAD;
  const PLOT_H = height - PLOT_TOP - PAD;

  const numRows = safeCategories.length;
  const rowH = numRows > 0 ? PLOT_H / numRows : 30;

  // Columns layout width
  const col1W = width * 0.35; // Label column
  const col2W = width * 0.45; // Tally column
  const col3W = width * 0.20; // Total column

  // Render a single tally mark group
  const renderTallies = (count, startX, centerY) => {
    const marks = [];
    const spacing = 5;
    const markH = rowH * 0.6;
    const topY = centerY - markH / 2;
    const botY = centerY + markH / 2;

    const numGroups = Math.floor(count / 5);
    const remainder = count % 5;

    let currentX = startX;

    // Groups of 5
    for (let g = 0; g < numGroups; g++) {
      const gx = currentX;
      // 4 vertical lines
      for (let i = 0; i < 4; i++) {
        const lx = gx + i * spacing;
        marks.push(
          <Line
            key={`grp-${g}-v-${i}`}
            points={[lx, topY, lx, botY]}
            stroke={stroke}
            strokeWidth={strokeWidth + 0.5}
            lineCap="round"
          />
        );
      }
      // 1 diagonal cross line
      marks.push(
        <Line
          key={`grp-${g}-diag`}
          points={[gx - 2, botY - 2, gx + 3 * spacing + 2, topY + 2]}
          stroke={stroke}
          strokeWidth={strokeWidth + 0.5}
          lineCap="round"
        />
      );
      currentX += 4 * spacing + 14; // Group spacer width
    }

    // Remainder individual tallies
    for (let r = 0; r < remainder; r++) {
      const lx = currentX + r * spacing;
      marks.push(
        <Line
          key={`rem-${r}`}
          points={[lx, topY, lx, botY]}
          stroke={stroke}
          strokeWidth={strokeWidth + 0.5}
          lineCap="round"
        />
      );
    }

    return marks;
  };

  return (
    <Group>
      {/* Table border grid background */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="#ffffff"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />

      {/* Header title */}
      {title && (
        <Group>
          <Rect
            x={0}
            y={0}
            width={width}
            height={HEADER_H}
            fill="#cbd5e1"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <Text
            text={title}
            x={PAD}
            y={(HEADER_H - 13) / 2}
            width={width - PAD * 2}
            align="center"
            fontSize={12}
            fontStyle="bold"
            fill={textColor}
            fontFamily="Arial"
          />
        </Group>
      )}

      {/* Columns Headers */}
      <Group y={HEADER_H}>
        <Rect
          x={0}
          y={0}
          width={width}
          height={COL_LABEL_H}
          fill="#f1f5f9"
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        {/* Column 1: Category */}
        <Text
          text="Category"
          x={PAD}
          y={(COL_LABEL_H - 11) / 2}
          width={col1W - PAD * 2}
          align="left"
          fontSize={10}
          fontStyle="bold"
          fill={textColor}
          fontFamily="Arial"
        />
        {/* Divider 1 */}
        <Line points={[col1W, 0, col1W, height - HEADER_H]} stroke={stroke} strokeWidth={strokeWidth} />
        {/* Column 2: Tally */}
        <Text
          text="Tally"
          x={col1W + PAD}
          y={(COL_LABEL_H - 11) / 2}
          width={col2W - PAD * 2}
          align="left"
          fontSize={10}
          fontStyle="bold"
          fill={textColor}
          fontFamily="Arial"
        />
        {/* Divider 2 */}
        <Line points={[col1W + col2W, 0, col1W + col2W, height - HEADER_H]} stroke={stroke} strokeWidth={strokeWidth} />
        {/* Column 3: Total */}
        <Text
          text="Frequency"
          x={col1W + col2W + PAD}
          y={(COL_LABEL_H - 11) / 2}
          width={col3W - PAD * 2}
          align="center"
          fontSize={10}
          fontStyle="bold"
          fill={textColor}
          fontFamily="Arial"
        />
      </Group>

      {/* Rows */}
      {safeCategories.map((cat, i) => {
        const ry = HEADER_H + COL_LABEL_H + i * rowH;

        return (
          <Group key={cat.id || i}>
            {/* Horizontal divider row line */}
            <Line
              points={[0, ry + rowH, width, ry + rowH]}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />

            {/* Category label */}
            <Text
              text={cat.label}
              x={PAD}
              y={ry + (rowH - fontSize) / 2}
              width={col1W - PAD * 2}
              align="left"
              fontSize={fontSize}
              fill={textColor}
              fontFamily="Arial"
              ellipsis={true}
              wrap="none"
            />

            {/* Tallies */}
            {renderTallies(cat.count, col1W + PAD + 6, ry + rowH / 2)}

            {/* Total frequency number */}
            <Text
              text={String(cat.count)}
              x={col1W + col2W + PAD}
              y={ry + (rowH - fontSize) / 2}
              width={col3W - PAD * 2}
              align="center"
              fontSize={fontSize}
              fontStyle="bold"
              fill={textColor}
              fontFamily="Arial"
            />
          </Group>
        );
      })}
    </Group>
  );
}
