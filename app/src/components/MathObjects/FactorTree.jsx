import React from 'react';
import { Group, Line, Circle, Text } from 'react-konva';

// Helper function to build a factor tree structure recursively
function buildTree(value, x, y, dx, dy) {
  if (value <= 1) {
    return { value, x, y, children: [] };
  }

  // Find the smallest prime factor
  let factor = 2;
  while (factor <= Math.sqrt(value)) {
    if (value % factor === 0) {
      break;
    }
    factor++;
  }

  if (factor > Math.sqrt(value)) {
    // Prime number, leaf node
    return { value, x, y, isPrime: true, children: [] };
  }

  const leftValue = factor;
  const rightValue = value / factor;

  const leftChild = buildTree(leftValue, x - dx, y + dy, dx * 0.7, dy);
  const rightChild = buildTree(rightValue, x + dx, y + dy, dx * 0.8, dy);

  return {
    value,
    x,
    y,
    isPrime: false,
    children: [leftChild, rightChild]
  };
}

export default function FactorTree({ rootValue, levelHeight = 50, initialSpread = 80, stroke = '#2563eb', strokeWidth = 2 }) {
  // Pre-calculate tree node layout
  const treeRoot = React.useMemo(() => {
    return buildTree(rootValue, 0, 0, initialSpread, levelHeight);
  }, [rootValue, levelHeight, initialSpread]);

  const nodes = [];
  const lines = [];

  function traverse(node, parent = null) {
    if (!node) return;

    if (parent) {
      lines.push(
        <Line
          key={`line-${parent.x}-${parent.y}-to-${node.x}-${node.y}`}
          points={[parent.x, parent.y, node.x, node.y]}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    }

    // Leaf nodes or prime numbers get a nice circled accent
    const radius = 16;
    nodes.push(
      <Group key={`node-${node.x}-${node.y}`}>
        {node.isPrime ? (
          <Circle
            x={node.x}
            y={node.y}
            radius={radius}
            fill="#dbeafe"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        ) : (
          <Circle
            x={node.x}
            y={node.y}
            radius={radius}
            fill="#ffffff"
            stroke="#94a3b8"
            strokeWidth={1}
          />
        )}
        <Text
          text={node.value.toString()}
          x={node.x - 10}
          y={node.y - 7}
          width={20}
          align="center"
          fontSize={14}
          fontStyle="bold"
          fill="#1e293b"
        />
      </Group>
    );

    node.children.forEach(child => traverse(child, node));
  }

  traverse(treeRoot);

  return (
    <Group>
      {lines}
      {nodes}
    </Group>
  );
}
