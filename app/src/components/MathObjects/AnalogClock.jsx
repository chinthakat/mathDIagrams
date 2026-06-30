import React from 'react';
import { Group, Circle, Line, Text } from 'react-konva';

/**
 * AnalogClock — fully-parametric analogue clock for math diagrams.
 * Props: radius, hours(0-11), minutes(0-59), seconds(0-59),
 *   showSeconds, showNumbers, showTicks, faceColor, rimColor,
 *   handColor, secondColor, label, rimWidth, style(classic|minimal|roman)
 */
export default function AnalogClock({ props = {} }) {
  const radius      = Number(props.radius      ?? 70);
  const hours       = Number(props.hours       ?? 10);
  const minutes     = Number(props.minutes     ?? 10);
  const seconds     = Number(props.seconds     ?? 0);
  const showSeconds = props.showSeconds === true || props.showSeconds === 'true';
  const showNumbers = props.showNumbers !== false && props.showNumbers !== 'false';
  const showTicks   = props.showTicks !== false && props.showTicks !== 'false';
  const faceColor   = props.faceColor   || '#ffffff';
  const rimColor    = props.rimColor    || '#1e293b';
  const handColor   = props.handColor   || '#1e293b';
  const secondColor = props.secondColor || '#ef4444';
  const label       = props.label       || '';
  const rimWidth    = Number(props.rimWidth ?? 4);
  const style       = props.style       || 'classic';

  const r = radius;

  // Hand angles — 0 deg = 12 o'clock (north), clockwise
  const minuteAngle = (minutes / 60) * 2 * Math.PI - Math.PI / 2;
  const hourAngle   = ((hours % 12) / 12 + minutes / 720) * 2 * Math.PI - Math.PI / 2;
  const secondAngle = (seconds / 60) * 2 * Math.PI - Math.PI / 2;

  const minuteHandLen = r * 0.78;
  const hourHandLen   = r * 0.54;
  const secondHandLen = r * 0.82;
  const minuteHandW   = Math.max(2, r * 0.045);
  const hourHandW     = Math.max(3, r * 0.065);

  const ticks = [];
  if (showTicks) {
    for (let i = 0; i < 60; i++) {
      const angle   = (i / 60) * 2 * Math.PI;
      const isMajor = i % 5 === 0;
      const inner   = isMajor ? r * 0.82 : r * 0.88;
      const outer   = r * 0.95;
      ticks.push(
        <Line
          key={`tick-${i}`}
          points={[Math.cos(angle)*inner, Math.sin(angle)*inner, Math.cos(angle)*outer, Math.sin(angle)*outer]}
          stroke={rimColor}
          strokeWidth={isMajor ? 2.5 : 1}
          opacity={isMajor ? 1 : 0.45}
          
        />
      );
    }
  }

  const romanNumerals = ['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
  const numRadius = r * 0.72;
  const numbers = showNumbers
    ? Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
        const tx = Math.cos(angle) * numRadius;
        const ty = Math.sin(angle) * numRadius;
        const numLabel = style === 'roman' ? romanNumerals[i] : String(i === 0 ? 12 : i);
        const fontSize = Math.max(8, r * (style === 'roman' ? 0.12 : 0.14));
        return (
          <Text
            key={`num-${i}`}
            x={tx - fontSize * (numLabel.length > 1 ? 0.85 : 0.38)}
            y={ty - fontSize * 0.55}
            text={numLabel}
            fontSize={fontSize}
            fontFamily="Arial"
            fontStyle="bold"
            fill={rimColor}
            
          />
        );
      })
    : [];

  return (
    <Group>
      {/* Drop shadow */}
      {style !== 'minimal' && (
        <Circle radius={r + rimWidth + 2} fill="rgba(0,0,0,0.12)" offsetX={-2} offsetY={-2}  />
      )}
      {/* Rim */}
      <Circle radius={r + rimWidth} fill={rimColor}  />
      {/* Face */}
      <Circle radius={r} fill={faceColor}  />
      {/* Inner ring (classic) */}
      {style === 'classic' && (
        <Circle radius={r * 0.96} fill="transparent" stroke={rimColor} strokeWidth={0.7} opacity={0.25}  />
      )}
      {/* Ticks */}
      {ticks}
      {/* Numbers */}
      {numbers}
      {/* Hour hand */}
      <Line
        points={[-Math.cos(hourAngle)*hourHandLen*0.17, -Math.sin(hourAngle)*hourHandLen*0.17,
                  Math.cos(hourAngle)*hourHandLen, Math.sin(hourAngle)*hourHandLen]}
        stroke={handColor} strokeWidth={hourHandW} lineCap="round" 
      />
      {/* Minute hand */}
      <Line
        points={[-Math.cos(minuteAngle)*minuteHandLen*0.14, -Math.sin(minuteAngle)*minuteHandLen*0.14,
                  Math.cos(minuteAngle)*minuteHandLen, Math.sin(minuteAngle)*minuteHandLen]}
        stroke={handColor} strokeWidth={minuteHandW} lineCap="round" 
      />
      {/* Second hand */}
      {showSeconds && (
        <>
          <Line
            points={[-Math.cos(secondAngle)*r*0.2, -Math.sin(secondAngle)*r*0.2,
                      Math.cos(secondAngle)*secondHandLen, Math.sin(secondAngle)*secondHandLen]}
            stroke={secondColor} strokeWidth={1.5} lineCap="round" 
          />
        </>
      )}
      {/* Centre pivot */}
      <Circle radius={r * 0.055} fill={handColor}  />
      {showSeconds && <Circle radius={r * 0.03} fill={secondColor}  />}
      {/* Label */}
      {label ? (
        <Text
          x={-r} y={r + rimWidth + 6} width={r * 2}
          text={label} fontSize={Math.max(10, r * 0.17)}
          fontFamily="Arial" fill="#1e293b" align="center" 
        />
      ) : null}
    </Group>
  );
}
