import React from 'react';
import { Group, Rect, Text } from 'react-konva';

/**
 * DigitalClock — LCD/LED digital clock display for math diagrams.
 * Props:
 *   timeText    – exact string to display e.g. "3:15 PM" or "09:45"  (default '10:10 AM')
 *   width       – box width   (default 160)
 *   height      – box height  (default 80)
 *   style       – 'lcd'(default) | 'led' | 'alarm' | 'station'
 *   bgColor     – display background    (default style-dependent)
 *   textColor   – digit color           (default style-dependent)
 *   borderColor – outer border          (default '#1e293b')
 *   label       – caption beneath       (default '')
 *   showColon   – show colon separator  (default true)
 *   fontSize    – override font size    (default auto)
 */
export default function DigitalClock({ props = {} }) {
  const timeText    = props.timeText    || '10:10 AM';
  const width       = Number(props.width       ?? 160);
  const height      = Number(props.height      ?? 80);
  const style       = props.style       || 'lcd';
  const label       = props.label       || '';
  const borderColor = props.borderColor || '#1e293b';

  // Style-dependent colour defaults
  const styleDefs = {
    lcd:     { bg: '#b8d4a0', text: '#1a2a12', border: '#3a5a28' },
    led:     { bg: '#0a0a0a', text: '#ff4500', border: '#1a1a1a' },
    alarm:   { bg: '#0d0d0d', text: '#00e5ff', border: '#003344' },
    station: { bg: '#0f0f0f', text: '#ffa500', border: '#1a1a1a' },
  };
  const def = styleDefs[style] || styleDefs.lcd;
  const bgColor   = props.bgColor   || def.bg;
  const textColor = props.textColor || def.text;

  const fontFamilyMap = { lcd: 'Courier New', led: 'Courier New', alarm: 'Courier New', station: 'Courier New' };
  const fontFamily = fontFamilyMap[style] || 'Courier New';

  const autoFontSize = Math.min(height * 0.52, width * 0.28);
  const fontSize = Number(props.fontSize ?? autoFontSize);

  const bw = Number(props.borderWidth ?? 3);
  const cornerRadius = style === 'station' ? 2 : 6;

  return (
    <Group>
      {/* Outer shell shadow */}
      <Rect
        x={-width / 2 + 2} y={-height / 2 + 2}
        width={width} height={height}
        cornerRadius={cornerRadius + 2}
        fill="rgba(0,0,0,0.25)"
        
      />
      {/* Outer border */}
      <Rect
        x={-width / 2} y={-height / 2}
        width={width} height={height}
        cornerRadius={cornerRadius + 2}
        fill={borderColor}
        
      />
      {/* Screen bezel */}
      <Rect
        x={-width / 2 + bw} y={-height / 2 + bw}
        width={width - bw * 2} height={height - bw * 2}
        cornerRadius={cornerRadius}
        fill={bgColor}
        
      />
      {/* Screen glare (lcd/alarm) */}
      {(style === 'lcd' || style === 'alarm') && (
        <Rect
          x={-width / 2 + bw + 2} y={-height / 2 + bw + 2}
          width={(width - bw * 2) * 0.45} height={(height - bw * 2) * 0.35}
          cornerRadius={3}
          fill="rgba(255,255,255,0.12)"
          
        />
      )}
      {/* Time text */}
      <Text
        x={-width / 2 + bw}
        y={-fontSize * 0.6}
        width={width - bw * 2}
        text={timeText}
        fontSize={fontSize}
        fontFamily={fontFamily}
        fontStyle="bold"
        fill={textColor}
        align="center"
        letterSpacing={style === 'station' ? 2 : 1}
        
      />
      {/* LED glow effect */}
      {(style === 'led' || style === 'station') && (
        <Text
          x={-width / 2 + bw}
          y={-fontSize * 0.6}
          width={width - bw * 2}
          text={timeText}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontStyle="bold"
          fill={textColor}
          align="center"
          letterSpacing={style === 'station' ? 2 : 1}
          opacity={0.25}
          shadowColor={textColor}
          shadowBlur={8}
          shadowOpacity={0.9}
          
        />
      )}
      {/* Caption label */}
      {label ? (
        <Text
          x={-width / 2} y={height / 2 + 5}
          width={width}
          text={label}
          fontSize={Math.max(10, height * 0.15)}
          fontFamily="Arial"
          fill="#1e293b"
          align="center"
          
        />
      ) : null}
    </Group>
  );
}
