import React, { useState, useRef } from 'react';
import { X, Upload, Scan, RotateCcw, Check, ImagePlus } from 'lucide-react';
import { generateFromSampleImage, getApiKey, saveApiKey } from '../services/claudeService';
import ModelSelector from './ModelSelector';
import { OptionsGrid } from './OptionPreview';
import { Stage, Layer, Group } from 'react-konva';
import { ObjectRegistry } from '../registry/objectRegistry';

const PREVIEW_W = 560;
const PREVIEW_H = 280;
const CANVAS_W = 800;
const CANVAS_H = 600;
const SCALE = Math.min(PREVIEW_W / CANVAS_W, PREVIEW_H / CANVAS_H);

function DiagramPreview({ objects }) {
  if (!objects?.length) return null;
  return (
    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden', lineHeight: 0, marginBottom: '16px' }}>
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

const STEPS = ['upload', 'analysing', 'generating', 'verifying', 'review'];

export default function SampleImageModal({ isOpen, onClose, onGenerate, onQuestionGenerated }) {
  const [step, setStep] = useState('upload'); // upload | analysing | generating | review
  const [imageBase64, setImageBase64] = useState('');
  const [imageMime, setImageMime] = useState('image/png');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [yearLevel, setYearLevel] = useState(5);
  const [apiKey, setApiKeyState] = useState(getApiKey);
  const [showApiKey, setShowApiKey] = useState(!getApiKey());
  const [error, setError] = useState('');
  const [classification, setClassification] = useState(null);
  const [result, setResult] = useState(null);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const fileRef = useRef();

  if (!isOpen) return null;

  const reset = () => {
    setStep('upload');
    setImageBase64('');
    setImagePreviewUrl('');
    setClassification(null);
    setResult(null);
    setError('');
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setImagePreviewUrl(dataUrl);
      // Strip the data URL prefix to get raw base64
      setImageBase64(dataUrl.split(',')[1]);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const handleAnalyse = async () => {
    const key = apiKey || getApiKey();
    if (!key) { setShowApiKey(true); setError('Please enter your Claude API key.'); return; }
    if (!imageBase64) { setError('Please upload a sample image first.'); return; }

    saveApiKey(key);
    setError('');
    setStep('analysing');

    try {
      setStep('generating');
      // generateFromSampleImage internally runs verify step — we show 'verifying' briefly
      const resPromise = generateFromSampleImage(imageBase64, imageMime, key, yearLevel);
      // Switch to verifying label after ~3s (generation finishes, verification starts)
      const verifyTimer = setTimeout(() => setStep('verifying'), 3000);
      const res = await resPromise;
      clearTimeout(verifyTimer);
      setClassification(res.classification);
      setResult(res);
      const opts = [
        { ...res.correctAnswer, correct: true },
        ...res.distractors.map(d => ({ ...d, correct: false })),
      ].sort(() => Math.random() - 0.5);
      setShuffledOptions(opts);
      setStep('review');
    } catch (e) {
      setError(e.message);
      setStep('upload');
    }
  };

  const handleInsert = () => {
    if (!result) return;
    const withIds = (result.objects || []).map(o => ({
      ...o,
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
    }));
    onGenerate(withIds);
    onQuestionGenerated?.({ stem: result.question, options: shuffledOptions });
    onClose();
  };

  const isWorking = step === 'analysing' || step === 'generating' || step === 'verifying';

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.8)',
      backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1200,
    }}>
      <div style={{
        background: '#1e293b', border: '1px solid #334155', borderRadius: '14px',
        width: '680px', maxWidth: '96%', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, color: 'white', fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scan size={18} color="#f59e0b" /> Clone from Sample Image
            </h3>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Upload a sample question → AI identifies the type → generates a new similar question
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Year</span>
            <select value={yearLevel} onChange={e => setYearLevel(Number(e.target.value))}
              style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: 'white', padding: '3px 6px', fontSize: '12px' }}>
              {[2,3,4,5,6,7,8].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ModelSelector />
            <button onClick={() => setShowApiKey(v => !v)}
              style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#94a3b8', cursor: 'pointer', padding: '4px 8px', fontSize: '11px' }}>
              {getApiKey() ? '🔑 ✓' : '🔑'}
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
          </div>
        </div>

        {/* API Key */}
        {showApiKey && (
          <div style={{ padding: '8px 20px', background: '#0f172a', borderBottom: '1px solid #334155', display: 'flex', gap: '8px' }}>
            <input type="password" value={apiKey} onChange={e => setApiKeyState(e.target.value)}
              placeholder="sk-ant-..."
              style={{ flex: 1, background: '#1e293b', border: '1px solid #475569', borderRadius: '4px', color: 'white', padding: '6px 10px', fontSize: '13px' }} />
            <button onClick={() => { saveApiKey(apiKey); setShowApiKey(false); }}
              style={{ padding: '6px 14px', borderRadius: '4px', background: '#6366f1', border: 'none', color: 'white', fontSize: '13px', cursor: 'pointer' }}>Save</button>
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
            {[
              { key: 'upload', label: '1. Upload' },
              { key: 'analysing', label: '2. Classify' },
              { key: 'generating', label: '3. Generate' },
              { key: 'verifying', label: '4. Verify' },
              { key: 'review', label: '5. Review' },
            ].map((s, i) => {
              const done = STEPS.indexOf(step) > i;
              const active = step === s.key || (isWorking && (s.key === 'analysing' || s.key === 'generating'));
              return (
                <div key={s.key} style={{ flex: 1, textAlign: 'center', padding: '6px 4px', borderRadius: '6px',
                  background: done ? 'rgba(16,185,129,0.15)' : active ? 'rgba(245,158,11,0.15)' : '#0f172a',
                  border: `1px solid ${done ? '#10b981' : active ? '#f59e0b' : '#334155'}`,
                  fontSize: '11px', color: done ? '#10b981' : active ? '#f59e0b' : '#475569', fontWeight: 600 }}>
                  {done ? '✓ ' : ''}{s.label}
                </div>
              );
            })}
          </div>

          {/* Upload zone (shown until review) */}
          {step !== 'review' && (
            <div>
              <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

              {!imagePreviewUrl ? (
                <div
                  onClick={() => fileRef.current.click()}
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  style={{
                    border: '2px dashed #334155', borderRadius: '10px', padding: '40px 20px',
                    textAlign: 'center', cursor: 'pointer', marginBottom: '16px',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#f59e0b'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}
                >
                  <ImagePlus size={36} color="#475569" style={{ marginBottom: '10px' }} />
                  <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Drop a question image here, or click to browse</div>
                  <div style={{ color: '#475569', fontSize: '12px' }}>PNG, JPG, WEBP supported</div>
                </div>
              ) : (
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <img src={imagePreviewUrl} alt="Sample"
                    style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a' }} />
                  <button onClick={reset}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: '#ef4444', border: 'none', borderRadius: '50%', width: '24px', height: '24px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={13} />
                  </button>
                </div>
              )}

              {isWorking && (
                <div style={{ textAlign: 'center', padding: '16px', color: '#f59e0b', fontSize: '13px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    {step === 'analysing' ? '🔍 Haiku is classifying your question...' : step === 'verifying' ? '✅ Haiku is verifying the maths...' : '✨ Sonnet is generating a new similar question...'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {step === 'analysing' ? 'Step 1/3 — identifying math concept and diagram type' : step === 'verifying' ? 'Step 3/3 — checking answer correctness and question format' : 'Step 2/3 — creating new question, diagram and MCQ options'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Classification badge (shown during generating + review) */}
          {classification && (
            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Detected Question Type
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div><span style={{ color: '#64748b', fontSize: '11px' }}>Concept: </span><span style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }}>{classification.mathConcept}</span></div>
                <div><span style={{ color: '#64748b', fontSize: '11px' }}>Type: </span><span style={{ color: '#e2e8f0', fontSize: '12px' }}>{classification.questionType}</span></div>
                <div><span style={{ color: '#64748b', fontSize: '11px' }}>Year: </span><span style={{ color: '#e2e8f0', fontSize: '12px' }}>Y{classification.yearLevel}</span></div>
                <div><span style={{ color: '#64748b', fontSize: '11px' }}>Options: </span><span style={{ color: '#e2e8f0', fontSize: '12px' }}>{classification.answerStyle}</span></div>
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>{classification.diagramDescription}</div>
            </div>
          )}

          {/* Review: generated diagram + MCQ */}
          {step === 'review' && result && (
            <>
              {/* Side-by-side: original vs generated */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Original Sample</div>
                  <img src={imagePreviewUrl} alt="Original"
                    style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a' }} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>AI Generated</div>
                  <DiagramPreview objects={result.objects} />
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Generated MCQ
              </div>
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                <p style={{ color: '#e2e8f0', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>{result.question}</p>
              </div>
              <OptionsGrid options={shuffledOptions} showAnswer={true} style={{ marginBottom: '12px' }} />
            </>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '6px', color: '#fca5a5', fontSize: '13px', marginTop: '12px' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>
            Cancel
          </button>

          {step === 'review' ? (
            <>
              <button onClick={() => { reset(); }}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RotateCcw size={13} /> Try Another
              </button>
              <button onClick={handleInsert}
                style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} /> Insert Diagram + Question
              </button>
            </>
          ) : (
            <button onClick={handleAnalyse} disabled={isWorking || !imageBase64}
              style={{
                padding: '8px 20px', borderRadius: '6px', border: 'none',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white', cursor: isWorking || !imageBase64 ? 'not-allowed' : 'pointer',
                fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
                opacity: isWorking || !imageBase64 ? 0.6 : 1,
              }}>
              {isWorking
                ? <><RotateCcw size={14} style={{ animation: 'spin 1s linear infinite' }} /> {step === 'analysing' ? 'Classifying…' : 'Generating…'}</>
                : <><Scan size={14} /> Analyse & Generate</>
              }
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
