import React from 'react';
import { Stage, Layer, Group } from 'react-konva';
import { ObjectRegistry } from '../registry/objectRegistry';

const OPT_W = 400;
const OPT_H = 300;

// Renders a single MCQ option — either a diagram canvas or plain text
export function OptionCard({ opt, label, revealed, style }) {
  const hasDiagram = opt.objects && opt.objects.length > 0;
  const borderColor = revealed ? '#10b981' : '#334155';
  const bg = revealed ? 'rgba(16,185,129,0.12)' : '#1e293b';

  return (
    <div style={{
      borderRadius: '8px', border: `1px solid ${borderColor}`,
      background: bg, overflow: 'hidden', ...style,
    }}>
      {/* Label badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: hasDiagram ? '8px 10px 4px' : '8px 12px' }}>
        <span style={{
          width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: revealed ? '#10b981' : '#334155',
          color: 'white', fontSize: '12px', fontWeight: 700,
        }}>
          {label}
        </span>
        {opt.text && (
          <span style={{ color: revealed ? '#6ee7b7' : '#cbd5e1', fontSize: '13px', flex: 1 }}>
            {opt.text}
          </span>
        )}
      </div>

      {/* Diagram canvas */}
      {hasDiagram && (
        <div style={{ lineHeight: 0, background: '#0f172a', margin: '0 8px 8px' }}>
          <DiagramThumb objects={opt.objects} />
        </div>
      )}
    </div>
  );
}

// Tiny Konva stage for an option's objects, scaled to fit a fixed display size
const DISPLAY_W = 260;
const DISPLAY_H = 160;
const SCALE = Math.min(DISPLAY_W / OPT_W, DISPLAY_H / OPT_H);

function DiagramThumb({ objects }) {
  return (
    <Stage width={DISPLAY_W} height={DISPLAY_H} scaleX={SCALE} scaleY={SCALE} style={{ display: 'block', borderRadius: '4px' }}>
      <Layer>
        {objects.map((obj, i) => {
          const entry = ObjectRegistry[obj.type];
          if (!entry) return null;
          const { x = 0, y = 0, rotation = 0, scaleX = 1, scaleY = 1, ...rest } = obj;
          return (
            <Group key={i} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} listening={false}>
              <entry.Component props={{ ...rest, x, y }} />
            </Group>
          );
        })}
      </Layer>
    </Stage>
  );
}

// Grid of 4 option cards — adapts layout based on whether options have diagrams
export function OptionsGrid({ options, showAnswer, style }) {
  const hasDiagrams = options.some(o => o.objects && o.objects.length > 0);
  const LABELS = ['A', 'B', 'C', 'D'];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: hasDiagrams ? '1fr 1fr' : '1fr 1fr',
      gap: hasDiagrams ? '12px' : '8px',
      ...style,
    }}>
      {options.map((opt, i) => (
        <OptionCard
          key={i}
          opt={opt}
          label={LABELS[i]}
          revealed={showAnswer && opt.correct}
        />
      ))}
    </div>
  );
}
