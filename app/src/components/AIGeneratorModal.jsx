import React, { useState } from 'react';
import { X, Sparkles, Send, RotateCcw, Check } from 'lucide-react';

import { generateDiagramFromPrompt, getApiKey, saveApiKey } from '../services/claudeService';
import { OptionsGrid } from './OptionPreview';
import ModelSelector from './ModelSelector';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const EXAMPLE_PROMPTS = [
  { text: 'Draw a right triangle with base 6 cm and height 8 cm. Find the hypotenuse.', yearLevel: 5 },
  { text: 'Show a fraction circle with 3 out of 8 sectors shaded.', yearLevel: 4 },
  { text: 'Create a number line from 0 to 20 with missing values.', yearLevel: 3 },
  { text: 'Draw a coordinate plane and plot points A(2,3) and B(5,1).', yearLevel: 6 },
  { text: 'Show a bar graph of students who prefer each colour: red 8, blue 12, green 5.', yearLevel: 4 },
  { text: 'Draw a probability spinner with 4 equal sectors.', yearLevel: 5 },
];

export default function AIGeneratorModal({ isOpen, onClose, onGenerate, onQuestionGenerated }) {
  const [prompt, setPrompt] = useState('');
  const [yearLevel, setYearLevel] = useState(5);
  const [apiKey, setApiKeyState] = useState(getApiKey);
  const [showApiKey, setShowApiKey] = useState(!getApiKey());

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { objects, question, correctAnswer, distractors }
  const [shuffledOptions, setShuffledOptions] = useState([]);

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    saveApiKey(apiKey);
    setShowApiKey(false);
  };

  const handleGenerate = async () => {
    const key = apiKey || getApiKey();
    if (!key) {
      setShowApiKey(true);
      setError('Please enter your Claude API key.');
      return;
    }
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError('');
    setResult(null);
    try {
      const res = await generateDiagramFromPrompt(prompt, key, yearLevel);
      setResult(res);
      // Build shuffled option list
      const options = [
        { ...res.correctAnswer, correct: true },
        ...res.distractors.map(d => ({ ...d, correct: false })),
      ].sort(() => Math.random() - 0.5);
      setShuffledOptions(options);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsert = () => {
    if (!result) return;
    onGenerate(result.objects);
    onQuestionGenerated?.({ stem: result.question, options: shuffledOptions });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.75)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#1e293b', border: '1px solid #334155', borderRadius: '12px',
        width: '680px', maxWidth: '95%', maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} color="#8b5cf6" />
            <h3 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: 600 }}>AI Diagram Generator</h3>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Year</span>
            <select
              value={yearLevel}
              onChange={e => setYearLevel(Number(e.target.value))}
              style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: 'white', padding: '3px 6px', fontSize: '12px' }}
            >
              {[2,3,4,5,6,7,8].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ModelSelector />
            <button
              onClick={() => setShowApiKey(v => !v)}
              style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#94a3b8', cursor: 'pointer', padding: '4px 8px', fontSize: '11px' }}
            >
              {getApiKey() ? '🔑 ✓' : '🔑'}
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* API Key */}
        {showApiKey && (
          <div style={{ padding: '10px 20px', background: '#0f172a', borderBottom: '1px solid #334155', display: 'flex', gap: '8px' }}>
            <input
              type="password" value={apiKey} onChange={e => setApiKeyState(e.target.value)}
              placeholder="Paste your Claude API key (sk-ant-...)"
              style={{ flex: 1, background: '#1e293b', border: '1px solid #475569', borderRadius: '4px', color: 'white', padding: '6px 10px', fontSize: '13px' }}
            />
            <button onClick={handleSaveApiKey} style={{ padding: '6px 14px', borderRadius: '4px', background: '#6366f1', border: 'none', color: 'white', fontSize: '13px', cursor: 'pointer' }}>Save</button>
            <button onClick={() => setShowApiKey(false)} style={{ padding: '6px 10px', borderRadius: '4px', background: '#334155', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* Prompt input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#e2e8f0', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>Describe your diagram and question:</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. Draw a right triangle with base 6 cm and height 8 cm. What is the hypotenuse?"
              style={{
                width: '100%', minHeight: '90px', background: '#0f172a', border: '1px solid #334155',
                borderRadius: '8px', color: 'white', padding: '10px 12px', fontSize: '13px',
                outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate(); }}
            />
          </div>

          {/* Examples */}
          {!result && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Try an example:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {EXAMPLE_PROMPTS.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => { setPrompt(ex.text); setYearLevel(ex.yearLevel); }}
                    style={{
                      textAlign: 'left', background: '#0f172a', border: '1px solid #334155',
                      borderRadius: '6px', padding: '8px 12px', color: '#cbd5e1', cursor: 'pointer', fontSize: '12px',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#8b5cf6'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}
                  >
                    <span style={{ color: '#64748b', fontSize: '11px', marginRight: '6px' }}>Y{ex.yearLevel}</span>
                    {ex.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '6px', color: '#fca5a5', fontSize: '13px', marginBottom: '14px' }}>
              {error}
            </div>
          )}

          {/* Result preview */}
          {result && (
            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Generated MCQ
              </div>
              <p style={{ color: '#e2e8f0', fontSize: '14px', margin: '0 0 12px 0', lineHeight: 1.6 }}>{result.question}</p>
              <OptionsGrid options={shuffledOptions} showAnswer={true} />
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
                {result.objects?.length ?? 0} diagram object(s) will be placed on the canvas.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: '6px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>
            Cancel
          </button>

          {result ? (
            <>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{ padding: '9px 16px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCcw size={13} /> Regenerate
              </button>
              <button
                onClick={handleInsert}
                style={{ padding: '9px 20px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Check size={14} /> Insert Diagram + Question
              </button>
            </>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              style={{
                padding: '9px 20px', borderRadius: '6px', border: 'none',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                color: 'white', cursor: isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer',
                fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
                opacity: isGenerating || !prompt.trim() ? 0.6 : 1,
              }}
            >
              {isGenerating
                ? <><RotateCcw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                : <><Send size={15} /> Generate</>
              }
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
