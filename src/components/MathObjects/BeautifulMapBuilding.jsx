import React from 'react';
import { Group } from 'react-konva';
import MathIcon from './MathIcon';

export default function BeautifulMapBuilding({ 
  width = 100, 
  height = 80, 
  fill = "#64748b", 
  stroke = "#475569", 
  strokeWidth = 2,
  label = "Castle",
  iconName = "Building",
  showLabel = true
}) {
  return (
    <Group>
      {/* Base building body */}
      <MathIcon
        url={null}
        iconName={iconName}
        color={stroke}
        width={width}
        height={height}
        opacity={1}
      />
    </Group>
  );
}
