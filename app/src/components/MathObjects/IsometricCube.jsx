import React from 'react';
import { Group, Line } from 'react-konva';

/**
 * Isometric cube — three visible faces drawn from centre.
 * w/h/d control width, height and depth of the cube in px.
 * Face colours: topFill, leftFill, rightFill.
 */
export default function IsometricCube({
  width = 80, height = 50, depth = 50,
  topFill = '#60a5fa', leftFill = '#1d4ed8', rightFill = '#3b82f6',
  stroke = '#1e3a8a', strokeWidth = 1.5,
}) {
  const w = Math.max(4, Number(width)  || 80);
  const h = Math.max(4, Number(height) || 50);
  const d = Math.max(4, Number(depth)  || 50);

  // Isometric projection offsets
  // Origin at visual centre of the whole shape.
  // Top face corners (diamond):   T(top), L(left), C(centre/front), R(right)
  const hw = w / 2;
  const hh = h / 2;   // half height of side faces
  const hd = d / 2;

  // Top face — parallelogram viewed from above
  const T  = [0,          -(hh + hd)];   // top point
  const TL = [-hw,        -hh];           // top-left
  const TR = [ hw,        -hh];           // top-right
  const TF = [0,           0];            // front (bottom of top face)

  // Left face
  const BL = [-hw,  hh];                  // bottom-left
  // Right face
  const BR = [ hw,  hh];                  // bottom-right
  // Front bottom
  const BF = [0,    hh + hd];             // front-bottom

  const flat = pts => pts.flat();

  return (
    <Group>
      {/* Top face */}
      <Line
        points={flat([T, TR, TF, TL])}
        fill={topFill} stroke={stroke} strokeWidth={strokeWidth}
        closed 
      />
      {/* Left face */}
      <Line
        points={flat([TL, TF, BF, BL])}
        fill={leftFill} stroke={stroke} strokeWidth={strokeWidth}
        closed 
      />
      {/* Right face */}
      <Line
        points={flat([TR, BR, BF, TF])}
        fill={rightFill} stroke={stroke} strokeWidth={strokeWidth}
        closed 
      />
    </Group>
  );
}
