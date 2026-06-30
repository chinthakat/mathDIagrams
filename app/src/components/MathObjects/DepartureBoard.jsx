import React from 'react';
import { Group, Rect, Text } from 'react-konva';

/**
 * DepartureBoard — train/airport departure information board
 * Props:
 *   title      – board header e.g. "DEPARTURES"       (default 'DEPARTURES')
 *   times      – comma-separated list of times        (default '08:15,08:45,09:15,?')
 *   width      – board width                          (default 240)
 *   height     – board height                         (default 160)
 *   bgColor    – board background                     (default '#0f0f0f')
 *   textColor  – row text color                       (default '#ffa500')
 *   titleColor – header color                         (default '#ffa500')
 *   label      – caption beneath                      (default '')
 */
export default function DepartureBoard({ props = {} }) {
  const title      = props.title      || 'DEPARTURES';
  const timesRaw   = props.times      || '08:15,08:45,09:15,?';
  const width      = Number(props.width      ?? 240);
  const height     = Number(props.height     ?? 160);
  const bgColor    = props.bgColor    || '#0f0f0f';
  const textColor  = props.textColor  || '#ffa500';
  const titleColor = props.titleColor || '#ffa500';
  const label      = props.label      || '';

  const times = String(timesRaw).split(',').map(t => t.trim());

  const padding    = 12;
  const titleH     = height * 0.22;
  const rowH       = (height - titleH - padding * 2) / Math.max(times.length, 1);
  const fontSize   = Math.min(rowH * 0.65, 18);
  const titleSize  = Math.min(titleH * 0.6, 16);

  return (
    <Group>
      {/* Outer border */}
      <Rect
        x={-width / 2 - 2} y={-height / 2 - 2}
        width={width + 4} height={height + 4}
        cornerRadius={4}
        fill="#333333"
        
      />
      {/* Main board */}
      <Rect
        x={-width / 2} y={-height / 2}
        width={width} height={height}
        cornerRadius={3}
        fill={bgColor}
        
      />
      {/* Title bar */}
      <Rect
        x={-width / 2} y={-height / 2}
        width={width} height={titleH}
        cornerRadius={3}
        fill="rgba(255,255,255,0.06)"
        
      />
      {/* Title text */}
      <Text
        x={-width / 2} y={-height / 2 + titleH * 0.18}
        width={width}
        text={title}
        fontSize={titleSize}
        fontFamily="Courier New"
        fontStyle="bold"
        fill={titleColor}
        align="center"
        letterSpacing={3}
        
      />
      {/* Divider */}
      <Rect
        x={-width / 2 + 8} y={-height / 2 + titleH}
        width={width - 16} height={1}
        fill={titleColor}
        opacity={0.3}
        
      />
      {/* Time rows */}
      {times.map((t, i) => (
        <Group key={i}>
          {/* Row highlight for question mark */}
          {t.trim() === '?' && (
            <Rect
              x={-width / 2 + 4}
              y={-height / 2 + titleH + padding + i * rowH}
              width={width - 8}
              height={rowH}
              fill="rgba(255,255,255,0.07)"
              cornerRadius={2}
              
            />
          )}
          <Text
            x={-width / 2 + padding}
            y={-height / 2 + titleH + padding + i * rowH + rowH * 0.15}
            width={width - padding * 2}
            text={t}
            fontSize={fontSize}
            fontFamily="Courier New"
            fontStyle={t.trim() === '?' ? 'bold' : 'normal'}
            fill={t.trim() === '?' ? '#ffffff' : textColor}
            align="center"
            
          />
        </Group>
      ))}
      {/* Caption */}
      {label ? (
        <Text
          x={-width / 2} y={height / 2 + 6}
          width={width}
          text={label}
          fontSize={12}
          fontFamily="Arial"
          fill="#1e293b"
          align="center"
          
        />
      ) : null}
    </Group>
  );
}
