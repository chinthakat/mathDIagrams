import React from 'react';
import { Group, Line, Circle } from 'react-konva';

/**
 * RopeLoop — flexible rope/cord made of one or more curved strands, each
 * defined by a list of relative [x,y] points. Supports closed loops (for
 * draping over a hook), knot bumps at chosen points, and a lighter inner
 * highlight line for a twisted-rope look. Multiple strands let a diagram
 * show interlocking loops (e.g. one strand passing "under" another) by
 * simply listing them as separate point paths.
 */
export default function RopeLoop({
  strands = [{
    points: [[0, -50], [45, -65], [85, -25], [70, 35], [10, 40], [-25, -5]],
    closed: true,
    knots: [],
  }],
  stroke = '#7a4a24',
  highlightStroke = '#c9915a',
  strokeWidth = 8,
  tension = 0.5,
  showEndCaps = true,
}) {
  const list = Array.isArray(strands) && strands.length ? strands : [];

  return (
    <Group>
      {list.map((strand, i) => {
        const rawPoints = Array.isArray(strand.points) ? strand.points : [];
        const pts = rawPoints.flatMap(p => [Number(p[0]) || 0, Number(p[1]) || 0]);
        if (pts.length < 4) return null;
        const closed = strand.closed !== false;
        const knots = Array.isArray(strand.knots) ? strand.knots : [];

        return (
          <Group key={i}>
            {/* Outer rope body */}
            <Line
              points={pts}
              stroke={stroke}
              strokeWidth={strokeWidth}
              tension={tension}
              closed={closed}
              lineCap="round"
              lineJoin="round"
            />
            {/* Inner highlight strand — hints at a twisted rope texture */}
            <Line
              points={pts}
              stroke={highlightStroke}
              strokeWidth={Math.max(1, strokeWidth * 0.28)}
              tension={tension}
              closed={closed}
              lineCap="round"
              lineJoin="round"
              opacity={0.85}
              listening={false}
            />
            {/* Knot bumps at specified point indices */}
            {knots.map((k, ki) => {
              const idx = typeof k === 'object' && k !== null ? k.index : k;
              const size = (typeof k === 'object' && k !== null && k.size) ? k.size : strokeWidth * 1.15;
              const pt = rawPoints[idx];
              if (!pt) return null;
              return (
                <Circle
                  key={ki}
                  x={Number(pt[0]) || 0}
                  y={Number(pt[1]) || 0}
                  radius={size}
                  fill={stroke}
                  stroke={highlightStroke}
                  strokeWidth={Math.max(1, strokeWidth * 0.2)}
                />
              );
            })}
            {/* End caps for open (non-closed) strands */}
            {showEndCaps && !closed && (
              <>
                <Circle x={pts[0]} y={pts[1]} radius={strokeWidth * 0.6} fill={stroke} />
                <Circle x={pts[pts.length - 2]} y={pts[pts.length - 1]} radius={strokeWidth * 0.6} fill={stroke} />
              </>
            )}
          </Group>
        );
      })}
    </Group>
  );
}
