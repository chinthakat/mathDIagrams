import React from 'react';
import { Star } from 'react-konva';

export default function StarShape({ width = 80, height = 80, numPoints = 5, innerRatio = 0.45, fill = '#f59e0b', stroke = '#b45309', strokeWidth = 1.5 }) {
  const outerR = Math.min(Number(width) || 80, Number(height) || 80) / 2;
  const innerR = outerR * Math.min(0.95, Math.max(0.1, Number(innerRatio) || 0.45));
  const pts = Math.max(3, Math.round(Number(numPoints) || 5));
  return <Star numPoints={pts} innerRadius={innerR} outerRadius={outerR} fill={fill} stroke={stroke} strokeWidth={strokeWidth} listening={false} />;
}
