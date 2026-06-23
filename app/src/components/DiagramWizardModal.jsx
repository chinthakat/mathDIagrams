import React, { useState, useMemo } from 'react';
import { Stage, Layer, Group } from 'react-konva';
import { X, Compass, Search, Sparkles, ChevronRight, RotateCcw, Check } from 'lucide-react';
import { DIAGRAM_TEMPLATES, getTemplatesByCategory, getDefaultConfig, getTemplateById } from '../registry/diagramTemplateRegistry';
import { generateFromTemplate, getApiKey, saveApiKey } from '../services/claudeService';
import { ObjectRegistry } from '../registry/objectRegistry';
import { OptionsGrid } from './OptionPreview';
import ModelSelector from './ModelSelector';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const PREVIEW_W = 560;
const PREVIEW_H = 300;
const CANVAS_W = 800;
const CANVAS_H = 600;
const SCALE = Math.min(PREVIEW_W / CANVAS_W, PREVIEW_H / CANVAS_H);

function DiagramPreview({ objects }) {
  return (
    <div style={{
      background: '#0f172a', border: '1px solid #334155', borderRadius: '10px',
      overflow: 'hidden', marginBottom: '16px', lineHeight: 0,
    }}>
      <Stage width={PREVIEW_W} height={PREVIEW_H} scaleX={SCALE} scaleY={SCALE} style={{ display: 'block' }}>
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
    </div>
  );
}

// Generic config field renderer driven by configSchema entry
function ConfigField({ field, value, onChange }) {
  const inputStyle = {
    width: '100%', padding: '6px 8px', background: '#0f172a',
    border: '1px solid #334155', borderRadius: '4px', color: 'white', fontSize: '13px',
  };

  if (field.type === 'number') {
    return (
      <div>
        <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
          {field.label}: <strong style={{ color: 'white' }}>{value}</strong>
        </label>
        <input
          type="range" min={field.min} max={field.max} value={value}
          onChange={e => onChange(field.key, Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
    );
  }

  if (field.type === 'text') {
    return (
      <div>
        <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>{field.label}</label>
        <input type="text" value={value} onChange={e => onChange(field.key, e.target.value)} style={inputStyle} />
      </div>
    );
  }

  if (field.type === 'boolean') {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
        <input type="checkbox" checked={value} onChange={e => onChange(field.key, e.target.checked)} />
        {field.label}
      </label>
    );
  }

  if (field.type === 'select') {
    return (
      <div>
        <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>{field.label}</label>
        <select value={value} onChange={e => onChange(field.key, e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          {field.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'bars') {
    // Simple bar list display (read-only in wizard; editable via PropertiesPanel after insert)
    return (
      <div>
        <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>{field.label}</label>
        <div style={{ fontSize: '11px', color: '#64748b', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', padding: '8px' }}>
          {value.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: b.color, display: 'inline-block' }} />
              <span style={{ color: '#cbd5e1' }}>{b.label}: {b.value}</span>
            </div>
          ))}
          <div style={{ color: '#64748b', marginTop: '4px' }}>Edit bars in Properties panel after inserting.</div>
        </div>
      </div>
    );
  }

  return null;
}

export default function DiagramWizardModal({ isOpen, onClose, onSelectTemplate, onQuestionGenerated }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(DIAGRAM_TEMPLATES[0].id);
  const [config, setConfig] = useState(() => getDefaultConfig(DIAGRAM_TEMPLATES[0]));
  const [yearLevel, setYearLevel] = useState(5);
  const [apiKey, setApiKeyState] = useState(getApiKey);
  const [showApiKey, setShowApiKey] = useState(false);

  // AI generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [generatedResult, setGeneratedResult] = useState(null); // { objects, question, correctAnswer, distractors }

  // Review tab state
  const [tab, setTab] = useState('browse'); // 'browse' | 'configure' | 'review'

  const categorised = useMemo(() => getTemplatesByCategory(), []);

  const filteredTemplates = useMemo(() => {
    if (!search.trim()) return DIAGRAM_TEMPLATES;
    const q = search.toLowerCase();
    return DIAGRAM_TEMPLATES.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  }, [search]);

  const currentTemplate = getTemplateById(selectedId) || DIAGRAM_TEMPLATES[0];

  const selectTemplate = (t) => {
    setSelectedId(t.id);
    setConfig(getDefaultConfig(t));
    setGeneratedResult(null);
    setGenerationError('');
    setTab('configure');
  };

  const handleConfigChange = (key, val) => {
    setConfig(prev => ({ ...prev, [key]: val }));
  };

  const handleSaveApiKey = () => {
    saveApiKey(apiKey);
    setShowApiKey(false);
  };

  const handleGenerateQuestion = async () => {
    const key = apiKey || getApiKey();
    if (!key) {
      setShowApiKey(true);
      setGenerationError('Please enter your Claude API key to generate questions.');
      return;
    }
    setIsGenerating(true);
    setGenerationError('');
    try {
      const result = await generateFromTemplate(currentTemplate, config, key, yearLevel);
      setGeneratedResult(result);
      setTab('review');
    } catch (e) {
      setGenerationError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsertTemplate = () => {
    // Prefer AI-generated objects; fall back to template objects if no AI result
    const objects = (generatedResult?.objects?.length ? generatedResult.objects : currentTemplate.objects(config));
    const withIds = objects.map(o => ({ ...o, id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9) }));
    onSelectTemplate(withIds);

    if (generatedResult) {
      const { question, correctAnswer, distractors } = generatedResult;
      const allOptions = [
        { ...correctAnswer, correct: true },
        ...distractors.map(d => ({ ...d, correct: false })),
      ].sort(() => Math.random() - 0.5);
      onQuestionGenerated?.({ stem: question, options: allOptions });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.8)',
      backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1100,
    }}>
      <div style={{
        background: '#1e293b', border: '1px solid #334155', borderRadius: '16px',
        width: '980px', maxWidth: '96%', height: '88vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #334155' }}>
          <div>
            <h3 style={{ margin: 0, color: 'white', fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={22} color="#6366f1" /> Diagram Wizard
            </h3>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Browse templates → configure → generate MCQ with Claude AI
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Year level selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Year</span>
              <select
                value={yearLevel}
                onChange={e => setYearLevel(Number(e.target.value))}
                style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: 'white', padding: '4px 6px', fontSize: '12px' }}
              >
                {[2,3,4,5,6,7,8].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <ModelSelector />
            {/* API key toggle */}
            <button
              onClick={() => setShowApiKey(v => !v)}
              style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', padding: '5px 10px', fontSize: '11px' }}
            >
              {getApiKey() ? '🔑 ✓' : '🔑'}
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* API Key input (shown inline when needed) */}
        {showApiKey && (
          <div style={{ padding: '10px 24px', background: '#0f172a', borderBottom: '1px solid #334155', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKeyState(e.target.value)}
              placeholder="sk-ant-..."
              style={{ flex: 1, background: '#1e293b', border: '1px solid #475569', borderRadius: '4px', color: 'white', padding: '6px 10px', fontSize: '13px' }}
            />
            <button onClick={handleSaveApiKey} style={{ padding: '6px 14px', borderRadius: '4px', background: '#6366f1', border: 'none', color: 'white', fontSize: '13px', cursor: 'pointer' }}>
              Save
            </button>
            <button onClick={() => setShowApiKey(false)} style={{ padding: '6px 10px', borderRadius: '4px', background: '#334155', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #334155', padding: '0 24px' }}>
          {[
            { id: 'browse', label: 'Browse Templates' },
            { id: 'configure', label: 'Configure' },
            { id: 'review', label: 'Review & Insert', disabled: !generatedResult },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => !t.disabled && setTab(t.id)}
              style={{
                padding: '10px 18px', border: 'none', background: 'transparent',
                borderBottom: `2px solid ${tab === t.id ? '#6366f1' : 'transparent'}`,
                color: tab === t.id ? 'white' : t.disabled ? '#475569' : '#94a3b8',
                cursor: t.disabled ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: tab === t.id ? 700 : 400,
                transition: 'all 0.15s',
              }}
            >
              {t.label}
              {t.id === 'review' && generatedResult && <span style={{ marginLeft: '6px', background: '#10b981', borderRadius: '50%', width: '8px', height: '8px', display: 'inline-block' }} />}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

          {/* BROWSE TAB */}
          {tab === 'browse' && (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Category sidebar */}
              <div style={{ width: '180px', background: '#0f172a', borderRight: '1px solid #334155', overflowY: 'auto', padding: '12px 8px' }}>
                {Object.keys(categorised).map(cat => (
                  <div key={cat} style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px', marginBottom: '2px' }}>{cat}</div>
                    {categorised[cat].map(t => (
                      <button
                        key={t.id}
                        onClick={() => selectTemplate(t)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: '6px',
                          background: selectedId === t.id ? '#1e293b' : 'transparent',
                          border: `1px solid ${selectedId === t.id ? '#475569' : 'transparent'}`,
                          color: selectedId === t.id ? 'white' : '#94a3b8',
                          fontSize: '12px', cursor: 'pointer', display: 'block',
                        }}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {/* Template grid */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: '#64748b' }} />
                  <input
                    type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search templates..."
                    style={{ width: '100%', padding: '7px 10px 7px 30px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: 'white', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  {filteredTemplates.map(t => (
                    <div
                      key={t.id}
                      onClick={() => selectTemplate(t)}
                      style={{
                        background: '#0f172a', border: `1px solid ${selectedId === t.id ? '#6366f1' : '#334155'}`,
                        borderRadius: '10px', padding: '14px', cursor: 'pointer',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                        boxShadow: selectedId === t.id ? '0 0 0 1px #6366f1' : 'none',
                      }}
                      onMouseEnter={e => { if (selectedId !== t.id) e.currentTarget.style.borderColor = '#475569'; }}
                      onMouseLeave={e => { if (selectedId !== t.id) e.currentTarget.style.borderColor = '#334155'; }}
                    >
                      {t.thumbnail ? (
                        <img src={t.thumbnail} alt={t.name} style={{ width: '100%', height: '80px', objectFit: 'contain', marginBottom: '8px', borderRadius: '4px' }} />
                      ) : (
                        <div style={{ width: '100%', height: '80px', background: '#1e293b', borderRadius: '4px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '11px' }}>
                          No preview
                        </div>
                      )}
                      <div style={{ color: 'white', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{t.name}</div>
                      <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '6px' }}>{t.category}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>{t.description}</div>
                      <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {t.yearLevels.map(y => (
                          <span key={y} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', padding: '1px 5px', fontSize: '10px', color: '#94a3b8' }}>Y{y}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CONFIGURE TAB */}
          {tab === 'configure' && (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                {/* Template header */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: 'white', margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700 }}>{currentTemplate.name}</h4>
                    <div style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.5 }}>{currentTemplate.description}</div>
                    <div style={{ marginTop: '6px', display: 'flex', gap: '4px' }}>
                      {currentTemplate.yearLevels.map(y => (
                        <span key={y} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', padding: '1px 6px', fontSize: '11px', color: '#64748b' }}>Year {y}</span>
                      ))}
                    </div>
                  </div>
                  {currentTemplate.thumbnail && (
                    <img src={currentTemplate.thumbnail} alt="" style={{ height: '80px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #334155' }} />
                  )}
                </div>

                {/* Live diagram preview */}
                <DiagramPreview objects={currentTemplate.objects(config)} />

                {/* Config fields */}
                <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>Configuration</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {currentTemplate.configSchema.map(field => (
                      <div key={field.key} style={field.type === 'bars' ? { gridColumn: '1 / -1' } : {}}>
                        <ConfigField field={field} value={config[field.key]} onChange={handleConfigChange} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Object preview list */}
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Objects that will be inserted</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {currentTemplate.objects(config).map((obj, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#0f172a', borderRadius: '6px', border: '1px solid #334155' }}>
                        <span style={{ background: '#3b82f6', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace' }}>{obj.type}</span>
                        {obj.text && <span style={{ color: '#64748b', fontSize: '12px' }}>"{obj.text}"</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REVIEW TAB */}
          {tab === 'review' && generatedResult && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {/* Diagram preview */}
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Diagram Preview — AI Generated
              </div>
              <DiagramPreview objects={generatedResult.objects?.length ? generatedResult.objects : currentTemplate.objects(config)} />

              <div style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                Generated MCQ
              </div>

              {/* Question */}
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>Question</div>
                <p style={{ color: '#e2e8f0', fontSize: '15px', margin: 0, lineHeight: 1.6 }}>{generatedResult.question}</p>
              </div>

              {/* Options */}
              <OptionsGrid
                options={[
                  { ...generatedResult.correctAnswer, correct: true },
                  ...generatedResult.distractors.map(d => ({ ...d, correct: false })),
                ].sort(() => Math.random() - 0.5)}
                showAnswer={true}
                style={{ marginBottom: '16px' }}
              />

              <div style={{ fontSize: '12px', color: '#64748b' }}>
                ✓ Correct answer is highlighted. After inserting, the Question Panel below the canvas will show all 4 options in shuffled order.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #334155', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {tab !== 'browse' && (
              <button
                onClick={() => setTab(tab === 'review' ? 'configure' : 'browse')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}
              >
                ← Back
              </button>
            )}
            {generationError && (
              <span style={{ color: '#ef4444', fontSize: '12px' }}>{generationError}</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>
              Cancel
            </button>

            {tab === 'browse' && (
              <button
                onClick={() => selectTemplate(currentTemplate)}
                style={btnPrimary}
              >
                Configure <ChevronRight size={14} />
              </button>
            )}

            {tab === 'configure' && (
              <>
                {/* Insert without question */}
                <button
                  onClick={handleInsertTemplate}
                  style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: '#cbd5e1', cursor: 'pointer', fontSize: '13px' }}
                >
                  Insert Only
                </button>
                {/* Generate MCQ */}
                <button
                  onClick={handleGenerateQuestion}
                  disabled={isGenerating}
                  style={{ ...btnPrimary, opacity: isGenerating ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isGenerating ? (
                    <><RotateCcw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                  ) : (
                    <><Sparkles size={14} /> Generate Question</>
                  )}
                </button>
              </>
            )}

            {tab === 'review' && (
              <>
                <button
                  onClick={handleGenerateQuestion}
                  disabled={isGenerating}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RotateCcw size={13} /> Regenerate
                </button>
                <button onClick={handleInsertTemplate} style={btnPrimary}>
                  <Check size={14} /> Insert Diagram + Question
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const btnPrimary = {
  padding: '8px 18px', borderRadius: '6px', border: 'none',
  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
  display: 'flex', alignItems: 'center', gap: '6px',
  boxShadow: '0 4px 6px -1px rgba(99,102,241,0.3)',
};
