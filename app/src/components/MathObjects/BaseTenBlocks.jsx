import React from 'react';
import { Group, Rect, Line, Path } from 'react-konva';

/**
 * BaseTenBlocks — Renders place value blocks (Thousands blocks, Hundreds flats, Tens rods, Ones units).
 * Renders them side by side in neat groupings.
 *
 * Props:
 *   ones, tens, hundreds, thousands — counts for each place value block
 *   width, height — outer bounding area
 *   fillColor — default fill color for the blocks
 *   stroke — outline color
 *   strokeWidth — outline thickness
 */
export default function BaseTenBlocks({
  width = 400,
  height = 200,
  ones = 3,
  tens = 2,
  hundreds = 1,
  thousands = 1,
  fillColor = '#a78bfa', // beautiful default lavender purple
  stroke = '#1e1b4b',
  strokeWidth = 1,
}) {
  const PAD = 10;
  const colW = (width - PAD * 5) / 4; // divide width into 4 columns

  // Component render helpers
  const drawUnit = (x, y, size = 12) => (
    <Rect
      x={x}
      y={y}
      width={size}
      height={size}
      fill={fillColor}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );

  const drawRod = (x, y, size = 12) => {
    const rodW = size;
    const rodH = size * 10;
    const segments = [];
    for (let i = 0; i < 10; i++) {
      segments.push(
        <Rect
          key={`rod-seg-${i}`}
          x={x}
          y={y + i * size}
          width={rodW}
          height={size}
          fill={fillColor}
          stroke={stroke}
          strokeWidth={strokeWidth * 0.5}
        />
      );
    }
    return (
      <Group>
        <Rect x={x} y={y} width={rodW} height={rodH} fill="transparent" stroke={stroke} strokeWidth={strokeWidth} />
        {segments}
      </Group>
    );
  };

  const drawFlat = (x, y, size = 10) => {
    const flatSize = size * 10;
    const cells = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        cells.push(
          <Rect
            key={`flat-cell-${r}-${c}`}
            x={x + c * size}
            y={y + r * size}
            width={size}
            height={size}
            fill={fillColor}
            stroke={stroke}
            strokeWidth={strokeWidth * 0.3}
          />
        );
      }
    }
    return (
      <Group>
        <Rect x={x} y={y} width={flatSize} height={flatSize} fill="transparent" stroke={stroke} strokeWidth={strokeWidth} />
        {cells}
      </Group>
    );
  };

  // Draw a 3D isometric cube block (thousand)
  const drawThousandBlock = (x, y, size = 70) => {
    // Face math
    const isoScale = 0.4;
    const w = size;
    const h = size;

    const topFace = [
      x, y - h * isoScale,
      x + w, y - h * isoScale * 2,
      x + w * 2, y - h * isoScale,
      x + w, y,
    ];

    const leftFace = [
      x, y - h * isoScale,
      x + w, y,
      x + w, y + h,
      x, y - h * isoScale + h,
    ];

    const rightFace = [
      x + w, y,
      x + w * 2, y - h * isoScale,
      x + w * 2, y - h * isoScale + h,
      x + w, y + h,
    ];

    // Grid overlays on left, right and top faces to show 10x10 cubes
    const gridLines = [];
    const segments = 10;
    const step = 1 / segments;

    // Helper: interpolate between two points
    const interp = (p1, p2, t) => [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t];

    // Left face grids
    const lf_tl = [x, y - h * isoScale];
    const lf_tr = [x + w, y];
    const lf_br = [x + w, y + h];
    const lf_bl = [x, y - h * isoScale + h];

    for (let i = 1; i < segments; i++) {
      const t = i * step;
      // vertical lines
      const p1 = interp(lf_tl, lf_tr, t);
      const p2 = interp(lf_bl, lf_br, t);
      gridLines.push(<Line key={`lf-v-${i}`} points={[...p1, ...p2]} stroke={stroke} strokeWidth={strokeWidth * 0.3} />);

      // horizontal lines
      const p3 = interp(lf_tl, lf_bl, t);
      const p4 = interp(lf_tr, lf_br, t);
      gridLines.push(<Line key={`lf-h-${i}`} points={[...p3, ...p4]} stroke={stroke} strokeWidth={strokeWidth * 0.3} />);
    }

    // Right face grids
    const rf_tl = [x + w, y];
    const rf_tr = [x + w * 2, y - h * isoScale];
    const rf_br = [x + w * 2, y - h * isoScale + h];
    const rf_bl = [x + w, y + h];

    for (let i = 1; i < segments; i++) {
      const t = i * step;
      // vertical lines
      const p1 = interp(rf_tl, rf_tr, t);
      const p2 = interp(rf_bl, rf_br, t);
      gridLines.push(<Line key={`rf-v-${i}`} points={[...p1, ...p2]} stroke={stroke} strokeWidth={strokeWidth * 0.3} />);

      // horizontal lines
      const p3 = interp(rf_tl, rf_bl, t);
      const p4 = interp(rf_tr, rf_br, t);
      gridLines.push(<Line key={`rf-h-${i}`} points={[...p3, ...p4]} stroke={stroke} strokeWidth={strokeWidth * 0.3} />);
    }

    return (
      <Group>
        {/* Fill top face */}
        <Path data={`M ${topFace.join(' ')} Z`} fill={fillColor} stroke={stroke} strokeWidth={strokeWidth} />
        {/* Fill left face */}
        <Path data={`M ${leftFace.join(' ')} Z`} fill={fillColor} stroke={stroke} strokeWidth={strokeWidth} />
        {/* Fill right face */}
        <Path data={`M ${rightFace.join(' ')} Z`} fill={fillColor} stroke={stroke} strokeWidth={strokeWidth} />
        {gridLines}
      </Group>
    );
  };

  // Render lists of items with vertical/grid layouts
  const colY = height - 20;

  return (
    <Group>
      {/* Background invisible wrapper */}
      <Rect x={0} y={0} width={width} height={height} fill="transparent" />

      {/* 1. Thousands column (Leftmost) */}
      {Array.from({ length: thousands }).map((_, i) => {
        const tx = PAD + i * 24;
        const ty = colY - 90 - i * 15;
        return (
          <Group key={`thousand-${i}`}>
            {drawThousandBlock(tx, ty, 60)}
          </Group>
        );
      })}

      {/* 2. Hundreds column */}
      {Array.from({ length: hundreds }).map((_, i) => {
        const hx = PAD + colW + 15 + i * 14;
        const hy = colY - 110 - i * 12;
        return (
          <Group key={`hundred-${i}`}>
            {drawFlat(hx, hy, 10)}
          </Group>
        );
      })}

      {/* 3. Tens column */}
      {Array.from({ length: tens }).map((_, i) => {
        const rx = PAD + colW * 2 + 30 + i * 18;
        const ry = colY - 120;
        return (
          <Group key={`ten-${i}`}>
            {drawRod(rx, ry, 12)}
          </Group>
        );
      })}

      {/* 4. Ones column (Rightmost) */}
      {Array.from({ length: ones }).map((_, i) => {
        // Arrange ones in a neat 3x3 grid
        const row = Math.floor(i / 3);
        const col = i % 3;
        const ux = PAD + colW * 3 + 40 + col * 16;
        const uy = colY - 16 - row * 16;
        return (
          <Group key={`one-${i}`}>
            {drawUnit(ux, uy, 12)}
          </Group>
        );
      })}
    </Group>
  );
}
