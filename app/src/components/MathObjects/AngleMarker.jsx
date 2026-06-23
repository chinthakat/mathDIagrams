import React from 'react';
import { Group, Arc, Line, Text } from 'react-konva';

export default function AngleMarker({ radius, angle, stroke, strokeWidth, label }) {
  // Convert angle to radians for calculating the line endpoint
  const angleRad = (angle * Math.PI) / 180;
  
  // Length of the intersecting lines (longer than the arc)
  const lineLength = radius * 2;

  const endX = lineLength * Math.cos(angleRad);
  const endY = -lineLength * Math.sin(angleRad); // Negative because Y goes down in canvas

  // Label positioning (bisecting the angle)
  const labelRad = (angle / 2) * Math.PI / 180;
  const labelDist = radius + 15;
  const labelX = labelDist * Math.cos(labelRad) - 5;
  const labelY = -labelDist * Math.sin(labelRad) - 5;

  return (
    <Group>
      {/* Base Line */}
      <Line points={[0, 0, lineLength, 0]} stroke="#334155" strokeWidth={2} />
      
      {/* Intersecting Line */}
      <Line points={[0, 0, endX, endY]} stroke="#334155" strokeWidth={2} />

      {/* The Arc Marker */}
      <Arc 
        x={0} 
        y={0} 
        innerRadius={radius} 
        outerRadius={radius} 
        angle={angle} 
        rotation={-angle} // Rotate to start from base line going counter-clockwise
        stroke={stroke} 
        strokeWidth={strokeWidth} 
      />

      {/* The Text Label */}
      {label && (
        <Text 
          text={label} 
          x={labelX} 
          y={labelY} 
          fontSize={16} 
          fill={stroke} 
          fontStyle="italic"
        />
      )}
    </Group>
  );
}
