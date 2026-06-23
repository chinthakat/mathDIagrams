import React, { useState } from 'react';
import { RotateCcw, Copy, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { OptionsGrid } from './OptionPreview';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function QuestionPanel({ question, onRegenerate, onDismiss, isRegenerating }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (!question) return null;

  const { stem, options } = question;
  const correctIndex = options.findIndex(o => o.correct);

  const copyText = () => {
    const text = [
      stem,
      '',
      ...options.map((o, i) => `${OPTION_LABELS[i]}) ${o.text || '(diagram)'}`),
      '',
      `Answer: ${OPTION_LABELS[correctIndex]}) ${options[correctIndex]?.text ?? ''}`,
    ].join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div style={{
      borderTop: '1px solid #334155',
      background: '#0f172a',
      padding: collapsed ? '8px 16px' : '16px',
      flexShrink: 0,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: collapsed ? 0 : '12px' }}>
        <span style={{ color: '#8b5cf6', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Generated Question
        </span>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button onClick={copyText} title="Copy question text" style={iconBtn}>
            <Copy size={14} />
          </button>
          <button onClick={() => setShowAnswer(v => !v)} title={showAnswer ? 'Hide answer' : 'Show answer'} style={iconBtn}>
            {showAnswer ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button onClick={onRegenerate} disabled={isRegenerating} title="Regenerate" style={iconBtn}>
            <RotateCcw size={14} style={{ animation: isRegenerating ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button onClick={() => setCollapsed(v => !v)} style={iconBtn}>
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {onDismiss && (
            <button onClick={onDismiss} style={{ ...iconBtn, marginLeft: '4px', color: '#ef4444' }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <>
          <p style={{ color: '#e2e8f0', fontSize: '14px', margin: '0 0 12px 0', lineHeight: 1.5 }}>{stem}</p>

          <OptionsGrid options={options} showAnswer={showAnswer} />

          {showAnswer && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
              Correct answer: {OPTION_LABELS[correctIndex]}) {options[correctIndex]?.text || '(see diagram)'}
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const iconBtn = {
  background: 'transparent',
  border: '1px solid #334155',
  borderRadius: '4px',
  color: '#94a3b8',
  cursor: 'pointer',
  padding: '4px 6px',
  display: 'flex',
  alignItems: 'center',
  lineHeight: 1,
};
