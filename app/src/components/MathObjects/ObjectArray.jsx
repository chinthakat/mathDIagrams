import React from 'react';
import { Group, Rect, Circle, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { resolveClipArtSrc } from '../../assets/clipartLibrary.js';

/**
 * ImageCell — renders a clipart image with cached loading.
 */
function ClipartImage({ src, size }) {
  const [img] = useImage(src, 'anonymous');
  return (
    <KonvaImage
      image={img}
      width={size}
      height={size}
      offsetX={size / 2}
      offsetY={size / 2}
    />
  );
}

/**
 * ObjectArray — displays collection displays/arrays of circles or clipart objects.
 * Supports:
 *  - Grid layout (rows x cols) for arrays.
 *  - Scatter layout (random dispersion) for counting items.
 *  - Clipart icons (e.g. apple, star, fish) or solid colored circles.
 *
 * Props:
 *   width, height — boundary area
 *   count         — total items (auto-calculated from rows * cols if grid layout and count is null)
 *   rows, cols    — grid dimensions (for 'grid' layout)
 *   layout        — 'grid' | 'scatter' (default 'grid')
 *   iconSrc       — clipart ID (e.g. 'apple', 'star') or empty for circles
 *   iconSize      — width/height of each item (default 24)
 *   spacing       — gap spacer (for 'grid' layout)
 *   fillColor     — color of circles if iconSrc is not used
 */
export default function ObjectArray({
  width = 300,
  height = 200,
  count = 12,
  rows = 3,
  cols = 4,
  layout = 'grid',
  iconSrc = '',
  iconSize = 28,
  spacing = 10,
  fillColor = '#3b82f6',
}) {
  const resolvedSrc = resolveClipArtSrc(iconSrc);

  const drawItem = (key, cx, cy) => {
    if (resolvedSrc) {
      return <ClipartImage key={key} src={resolvedSrc} size={iconSize} />;
    }
    return (
      <Circle
        key={key}
        x={cx}
        y={cy}
        radius={iconSize / 2}
        fill={fillColor}
        stroke="#1e293b"
        strokeWidth={1}
      />
    );
  };

  const items = [];

  if (layout === 'grid') {
    // Grid alignment
    const gridCols = cols || 4;
    const gridRows = rows || 3;
    const totalSlots = gridCols * gridRows;
    const limit = count != null ? Math.min(count, totalSlots) : totalSlots;

    // Center the grid inside the bounding box
    const totalGridW = gridCols * iconSize + (gridCols - 1) * spacing;
    const totalGridH = gridRows * iconSize + (gridRows - 1) * spacing;

    const startX = (width - totalGridW) / 2 + iconSize / 2;
    const startY = (height - totalGridH) / 2 + iconSize / 2;

    for (let i = 0; i < limit; i++) {
      const r = Math.floor(i / gridCols);
      const c = i % gridCols;
      const cx = startX + c * (iconSize + spacing);
      const cy = startY + r * (iconSize + spacing);
      items.push(drawItem(`item-${i}`, cx, cy));
    }
  } else {
    // Scatter layout: deterministic random scattering based on indices
    // We use a simple hash function of the index to generate fixed random offsets
    const limit = count || 10;
    const margin = iconSize / 2 + 10;

    for (let i = 0; i < limit; i++) {
      // Deterministic "pseudo-random" coordinates inside the box
      const seedX = Math.sin(i * 12.9898) * 43758.5453;
      const seedY = Math.cos(i * 78.233) * 43758.5453;
      const randX = seedX - Math.floor(seedX);
      const randY = seedY - Math.floor(seedY);

      const cx = margin + randX * (width - margin * 2);
      const cy = margin + randY * (height - margin * 2);

      items.push(drawItem(`item-${i}`, cx, cy));
    }
  }

  return (
    <Group>
      <Rect x={0} y={0} width={width} height={height} fill="transparent" />
      {items}
    </Group>
  );
}
