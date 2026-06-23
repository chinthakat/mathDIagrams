import React from 'react';

// Generates an SVG path or polygons for standard nets and incorrect distractors
export default function ShapeNet({ shapeType, variant = 'correct', size = 100, strokeWidth = 2 }) {
  const getNetPaths = () => {
    const stroke = "black";
    const fill = "none";
    
    switch (shapeType) {
      case 'cube':
      case 'cuboid':
        if (variant === 'correct') {
          return [
            <rect key="1" x={size} y={0} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="2" x={size} y={size} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="3" x={size} y={size*2} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="4" x={size} y={size*3} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="5" x={0} y={size} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="6" x={size*2} y={size} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        } else if (variant === 'incorrect1') { // 5 sides (missing one)
          return [
            <rect key="1" x={size} y={0} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="2" x={size} y={size} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="3" x={size} y={size*2} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="4" x={0} y={size} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="5" x={size*2} y={size} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        } else if (variant === 'incorrect2') { // 6 sides, two on same edge
          return [
            <rect key="1" x={size} y={0} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="2" x={size} y={size} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="3" x={size} y={size*2} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="4" x={size} y={size*3} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="5" x={0} y={size} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="6" x={0} y={size*2} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        } else { // incorrect3: 6 in a line
          return Array.from({length: 6}).map((_, i) => (
            <rect key={i} x={size} y={size*i} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ));
        }

      case 'cylinder':
        if (variant === 'correct') {
          return [
            <rect key="1" x={0} y={size/2} width={size*3} height={size*1.5} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <circle key="2" cx={size*1.5} cy={size/2} r={size/2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <circle key="3" cx={size*1.5} cy={size*2} r={size/2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        } else if (variant === 'incorrect1') { // Both circles on same side
          return [
            <rect key="1" x={0} y={size/2} width={size*3} height={size*1.5} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <circle key="2" cx={size} cy={size/2} r={size/2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <circle key="3" cx={size*2} cy={size/2} r={size/2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        } else if (variant === 'incorrect2') { // Only one circle
          return [
            <rect key="1" x={0} y={size/2} width={size*3} height={size*1.5} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <circle key="2" cx={size*1.5} cy={size/2} r={size/2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        } else { // incorrect3: Circles on the short edges
          return [
            <rect key="1" x={size/2} y={0} width={size*1.5} height={size*2.5} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <circle key="2" cx={size/2} cy={size*1.25} r={size/2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <circle key="3" cx={size*2} cy={size*1.25} r={size/2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        }

      case 'cone':
        if (variant === 'correct') {
          return [
            <path key="1" d={`M ${size*1.5} ${size*2} L ${size*0.5} ${size*0.5} A ${size*1.2} ${size*1.2} 0 0 1 ${size*2.5} ${size*0.5} Z`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <circle key="2" cx={size*1.5} cy={size*2.5} r={size*0.5} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        } else if (variant === 'incorrect1') { // Circle on the straight edge
          return [
            <path key="1" d={`M ${size*1.5} ${size*2} L ${size*0.5} ${size*0.5} A ${size*1.2} ${size*1.2} 0 0 1 ${size*2.5} ${size*0.5} Z`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <circle key="2" cx={size} cy={size*1.25} r={size*0.5} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        } else if (variant === 'incorrect2') { // Two circles
          return [
            <path key="1" d={`M ${size*1.5} ${size*2} L ${size*0.5} ${size*0.5} A ${size*1.2} ${size*1.2} 0 0 1 ${size*2.5} ${size*0.5} Z`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <circle key="2" cx={size*1.5} cy={size*2.5} r={size*0.5} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <circle key="3" cx={size*1.5} cy={size*3.5} r={size*0.5} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        } else { // incorrect3: Plain triangle instead of sector
          return [
            <polygon key="1" points={`${size*1.5},${size*2} ${size*0.5},${size*0.5} ${size*2.5},${size*0.5}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <circle key="2" cx={size*1.5} cy={size*2.5} r={size*0.5} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        }

      case 'squarePyramid':
        if (variant === 'correct') {
          return [
            <rect key="1" x={size} y={size} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="2" points={`${size},${size} ${size*2},${size} ${size*1.5},0`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="3" points={`${size*2},${size} ${size*2},${size*2} ${size*3},${size*1.5}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="4" points={`${size},${size*2} ${size*2},${size*2} ${size*1.5},${size*3}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="5" points={`${size},${size} ${size},${size*2} 0,${size*1.5}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        } else if (variant === 'incorrect1') { // 5 triangles
          return [
            <rect key="1" x={size} y={size} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="2" points={`${size},${size} ${size*2},${size} ${size*1.5},0`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="3" points={`${size*2},${size} ${size*2},${size*2} ${size*3},${size*1.5}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="4" points={`${size},${size*2} ${size*2},${size*2} ${size*1.5},${size*3}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="5" points={`${size},${size} ${size},${size*2} 0,${size*1.5}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="6" points={`${size*1.5},${size*3} ${size*2.5},${size*3} ${size*2},${size*4}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        } else if (variant === 'incorrect2') { // 2 triangles on same edge
          return [
            <rect key="1" x={size} y={size} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="2" points={`${size},${size} ${size*2},${size} ${size*1.5},0`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="3" points={`${size*2},${size} ${size*2},${size*2} ${size*3},${size*1.5}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="4" points={`${size},${size} ${size*2},${size} ${size*2.5},0`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />, // overlapping
            <polygon key="5" points={`${size},${size} ${size},${size*2} 0,${size*1.5}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        } else { // incorrect3: 3 triangles
          return [
            <rect key="1" x={size} y={size} width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="2" points={`${size},${size} ${size*2},${size} ${size*1.5},0`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="3" points={`${size*2},${size} ${size*2},${size*2} ${size*3},${size*1.5}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="4" points={`${size},${size} ${size},${size*2} 0,${size*1.5}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        }

      case 'tetrahedron':
        const h = size * Math.sqrt(3) / 2;
        if (variant === 'correct') {
          return [
            <polygon key="1" points={`${size/2},${h} ${size*1.5},${h} ${size},${h*2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="2" points={`${size/2},${h} ${size},0 ${size*1.5},${h}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="3" points={`0,${h*2} ${size},${h*2} ${size/2},${h}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="4" points={`${size},${h*2} ${size*2},${h*2} ${size*1.5},${h}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        } else if (variant === 'incorrect1') { // straight line
          return [
            <polygon key="1" points={`${size/2},${h} ${size*1.5},${h} ${size},${h*2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="2" points={`${size/2},${h} ${size},0 ${size*1.5},${h}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="3" points={`${size*1.5},${h} ${size*2},0 ${size*2.5},${h}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="4" points={`${size*2.5},${h} ${size*3},0 ${size*3.5},${h}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        } else if (variant === 'incorrect2') { // overlapping
          return [
            <polygon key="1" points={`${size/2},${h} ${size*1.5},${h} ${size},${h*2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="2" points={`${size/2},${h} ${size},0 ${size*1.5},${h}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="3" points={`0,${h*2} ${size},${h*2} ${size/2},${h}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="4" points={`${size*0.5},0 ${size*1.5},0 ${size},${h}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        } else { // incorrect3: 3 triangles
          return [
            <polygon key="1" points={`${size/2},${h} ${size*1.5},${h} ${size},${h*2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="2" points={`${size/2},${h} ${size},0 ${size*1.5},${h}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="3" points={`0,${h*2} ${size},${h*2} ${size/2},${h}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        }

      case 'triangularPrism':
        const th = size * Math.sqrt(3) / 2;
        if (variant === 'correct') {
          return [
            <rect key="1" x={size} y={th} width={size} height={size*2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="2" x={0} y={th} width={size} height={size*2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="3" x={size*2} y={th} width={size} height={size*2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="4" points={`${size},${th} ${size*2},${th} ${size*1.5},0`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="5" points={`${size},${th + size*2} ${size*2},${th + size*2} ${size*1.5},${th*2 + size*2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        } else if (variant === 'incorrect1') { // triangles on same side
          return [
            <rect key="1" x={size} y={th} width={size} height={size*2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="2" x={0} y={th} width={size} height={size*2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="3" x={size*2} y={th} width={size} height={size*2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="4" points={`${size},${th} ${size*2},${th} ${size*1.5},0`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="5" points={`${0},${th} ${size},${th} ${size*0.5},0`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        } else if (variant === 'incorrect2') { // 4 rectangles
          return [
            <rect key="1" x={size} y={th} width={size} height={size*2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="2" x={0} y={th} width={size} height={size*2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="3" x={size*2} y={th} width={size} height={size*2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="4" x={size*3} y={th} width={size} height={size*2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="5" points={`${size},${th} ${size*2},${th} ${size*1.5},0`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        } else { // incorrect3: 2 rectangles, 3 triangles
          return [
            <rect key="1" x={size} y={th} width={size} height={size*2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <rect key="2" x={0} y={th} width={size} height={size*2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="3" points={`${size},${th} ${size*2},${th} ${size*1.5},0`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="4" points={`${size},${th + size*2} ${size*2},${th + size*2} ${size*1.5},${th*2 + size*2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="5" points={`${0},${th + size*2} ${size},${th + size*2} ${size*0.5},${th*2 + size*2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        }

      case 'octahedron':
        const oh = size * Math.sqrt(3) / 2;
        if (variant === 'correct') {
          return [
            <polygon key="1" points={`${size/2},${oh} ${size*1.5},${oh} ${size},${oh*2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="2" points={`${size/2},${oh} ${size},0 ${size*1.5},${oh}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="3" points={`${size*1.5},${oh} ${size*2},0 ${size*2.5},${oh}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="4" points={`${size*1.5},${oh} ${size*2.5},${oh} ${size*2},${oh*2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="5" points={`${size},${oh*2} ${size*2},${oh*2} ${size*1.5},${oh*3}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="6" points={`0,${oh*2} ${size},${oh*2} ${size/2},${oh*3}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="7" points={`${size/2},${oh*3} ${size*1.5},${oh*3} ${size},${oh*4}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="8" points={`${size/2},${oh*3} ${size},${oh*2} ${size*1.5},${oh*3}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        } else if (variant === 'incorrect1') { // 7 triangles
          return [
            <polygon key="1" points={`${size/2},${oh} ${size*1.5},${oh} ${size},${oh*2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="2" points={`${size/2},${oh} ${size},0 ${size*1.5},${oh}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="3" points={`${size*1.5},${oh} ${size*2},0 ${size*2.5},${oh}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="4" points={`${size*1.5},${oh} ${size*2.5},${oh} ${size*2},${oh*2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="5" points={`${size},${oh*2} ${size*2},${oh*2} ${size*1.5},${oh*3}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="6" points={`0,${oh*2} ${size},${oh*2} ${size/2},${oh*3}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="7" points={`${size/2},${oh*3} ${size*1.5},${oh*3} ${size},${oh*4}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        } else if (variant === 'incorrect2') { // straight line of 8
          return Array.from({length: 8}).map((_, i) => {
            const yOffset = (i % 2 === 0) ? 0 : oh;
            const pts = (i % 2 === 0) 
              ? `${(i/2)*size},${oh} ${((i/2)+1)*size},${oh} ${((i/2)+0.5)*size},0`
              : `${((i-1)/2+0.5)*size},${oh} ${((i-1)/2+1.5)*size},${oh} ${((i-1)/2+1)*size},${oh*2}`;
            return <polygon key={i} points={pts} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          });
        } else { // incorrect3: 9 triangles
          return [
            <polygon key="1" points={`${size/2},${oh} ${size*1.5},${oh} ${size},${oh*2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="2" points={`${size/2},${oh} ${size},0 ${size*1.5},${oh}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="3" points={`${size*1.5},${oh} ${size*2},0 ${size*2.5},${oh}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="4" points={`${size*1.5},${oh} ${size*2.5},${oh} ${size*2},${oh*2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="5" points={`${size},${oh*2} ${size*2},${oh*2} ${size*1.5},${oh*3}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="6" points={`0,${oh*2} ${size},${oh*2} ${size/2},${oh*3}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="7" points={`${size/2},${oh*3} ${size*1.5},${oh*3} ${size},${oh*4}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="8" points={`${size/2},${oh*3} ${size},${oh*2} ${size*1.5},${oh*3}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
            <polygon key="9" points={`${size*1.5},${oh*3} ${size*2.5},${oh*3} ${size*2},${oh*4}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          ];
        }

      default:
        return null;
    }
  };

  return (
    <svg width="100%" height="100%" viewBox={`-10 -10 ${size*4} ${size*5}`} style={{ overflow: 'visible' }}>
      {getNetPaths()}
    </svg>
  );
}
