import React, { useState, useRef, useCallback } from 'react';
import { Stage, Layer, Group as KonvaGroup } from 'react-konva';
import {
  X, Sparkles, CheckCircle, XCircle, Loader, Save, RotateCcw,
  ChevronRight, Image as ImageIcon, Key, Download, Trash2,
} from 'lucide-react';
import { ObjectRegistry } from '../registry/objectRegistry';
import { getApiKey, saveApiKey } from '../services/claudeService';
import { repairDiagramWithRetry } from '../services/diagramRepairService';
import { resolveImageUrl, updateQuestion, uploadDiagramImage } from '../services/lmsApiService';
import { downloadLog, clearServerLog } from '../services/pipelineLogger';
import {
  getGeminiApiKey, saveGeminiApiKey,
  GEMINI_IMAGE_MODELS, GEMINI_VISION_MODELS,
} from '../services/geminiService';

// ── Progress log entry ────────────────────────────────────────────────────────

function ProgressEntry({ entry }) {
  const icon = {
    analyzing:  <Loader size={13} className="spin" style={{ color: '#60a5fa' }} />,
    analyzed:   <CheckCircle size={13} color="#34d399" />,
    generating: <Loader size={13} className="spin" style={{ color: '#a78bfa' }} />,
    generated:  <CheckCircle size={13} color="#34d399" />,
    rendering:  <Loader size={13} className="spin" style={{ color: '#fb923c' }} />,
    validating: <Loader size={13} className="spin" style={{ color: '#fbbf24' }} />,
    validated:  entry.validation?.isCorrect ? <CheckCircle size={13} color="#34d399" /> : <XCircle size={13} color="#f87171" />,
    retry:         <RotateCcw size={13} color="#f59e0b" />,
    error:         <XCircle size={13} color="#f87171" />,
    attempt_error: <XCircle size={13} color="#f87171" />,
  }[entry.stage] || <ChevronRight size={13} color="#64748b" />;

  const label = {
    analyzing:       'Analysing existing diagram with Haiku vision…',
    analyzed:        `Classified: ${entry.analysis?.diagramType || 'diagram'}`,
    refining_prompt: `Attempt ${entry.attempt}/${entry.maxAttempts} — Refining image prompt with Claude…`,
    prompt_refined:  `Attempt ${entry.attempt} — Image prompt refined`,
    generating:      `Attempt ${entry.attempt}/${entry.maxAttempts} — Generating shapes with Sonnet…`,
    generated:     entry.image
      ? `Attempt ${entry.attempt} — Gemini image generated`
      : `Attempt ${entry.attempt} — ${entry.shapes?.length || 0} shapes generated`,
    rendering:     `Attempt ${entry.attempt} — Rendering Konva canvas…`,
    validating:    `Attempt ${entry.attempt} — Validating screenshot with Haiku vision…`,
    validated:     entry.validation?.isCorrect
      ? `Attempt ${entry.attempt} — ✓ PASSED (score: ${entry.validation?.score ?? '—'})`
      : `Attempt ${entry.attempt} — ✗ FAILED: ${entry.validation?.feedback || ''}`,
    retry:         `Attempt ${entry.attempt} done — retrying with feedback…`,
    error:         `⚠ ${entry.message || 'Unknown error'}`,
    attempt_error: `⚠ Attempt ${entry.attempt} error — retrying: ${entry.message || ''}`,
  }[entry.stage] || entry.stage;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '4px 0', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4 }}>
      <span style={{ marginTop: '1px', flexShrink: 0 }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  overlay:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modal:     { background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', width: '1160px', maxWidth: '96vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', background: '#1e293b', borderBottom: '1px solid #334155', flexShrink: 0 },
  body:      { display: 'flex', flex: 1, overflow: 'hidden' },
  left:      { width: '310px', borderRight: '1px solid #1e293b', overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 },
  right:     { flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' },
  footer:    { display: 'flex', gap: '8px', padding: '11px 18px', background: '#1e293b', borderTop: '1px solid #334155', flexShrink: 0, alignItems: 'center' },
  label:     { fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' },
  text:      { fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 },
  imgBox:    { background: '#1e293b', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155' },
  img:       { width: '100%', objectFit: 'contain', maxHeight: '190px' },
  canvasBox: { background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '2px solid #334155', width: '640px', height: '400px' },
  log:       { background: '#1e293b', borderRadius: '8px', padding: '10px 12px', overflowY: 'auto', maxHeight: '180px', border: '1px solid #334155', minHeight: '80px' },
  logEmpty:  { color: '#475569', fontSize: '12px', textAlign: 'center', padding: '16px 0' },
  input:     { width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', color: '#e2e8f0', fontSize: '12px', outline: 'none', boxSizing: 'border-box' },
  textarea:  { width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '8px 10px', color: '#e2e8f0', fontSize: '12px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: '70px', lineHeight: 1.5, fontFamily: 'system-ui, sans-serif' },
  btn:       { padding: '7px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' },
  btnPrimary:{ background: '#7c3aed', color: '#fff' },
  btnSuccess:{ background: '#059669', color: '#fff' },
  btnGhost:  { background: 'transparent', color: '#94a3b8', border: '1px solid #334155' },
  btnDanger: { background: 'transparent', color: '#ef4444', border: '1px solid #7f1d1d' },
  tag:       { display: 'inline-block', padding: '2px 7px', borderRadius: '4px', fontSize: '10px', background: '#1e3a5f', color: '#60a5fa', marginRight: '4px', marginBottom: '3px' },
};

// ── Modal ─────────────────────────────────────────────────────────────────────

// ── Model toggle ──────────────────────────────────────────────────────────────

function ModeToggle({ label, options, value, onChange, disabled }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>{label}</div>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {options.map(o => (
          <button
            key={o.value}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            style={{
              padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: disabled ? 'default' : 'pointer',
              fontSize: '11px', fontWeight: 600, transition: 'all 0.15s',
              background: value === o.value ? o.activeColor || '#7c3aed' : '#1e293b',
              color: value === o.value ? '#fff' : '#94a3b8',
              opacity: disabled ? 0.6 : 1,
            }}
          >{o.label}</button>
        ))}
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function QuestionEditModal({ question, onClose, onSaved }) {
  const [apiKey, setApiKeyState] = useState(getApiKey);
  const [geminiKey, setGeminiKeyState] = useState(getGeminiApiKey);
  const [userInstructions, setUserInstructions] = useState('');
  const [generationMode, setGenerationMode] = useState('konva');
  const [validationMode, setValidationMode] = useState('claude');
  const [geminiImageModel, setGeminiImageModel] = useState(GEMINI_IMAGE_MODELS[0].id);
  const [geminiVisionModel, setGeminiVisionModel] = useState(GEMINI_VISION_MODELS[0].id);
  const [shapes, setShapes] = useState([]);
  const [generatedImage, setGeneratedImage] = useState(null); // base64 for Gemini mode
  const [progressLog, setProgressLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const stageRef = useRef(null);

  const needsGeminiKey = generationMode === 'gemini' || validationMode === 'gemini';

  const imageUrl = resolveImageUrl(question.image || question.imageUrl || question.imageKey);

  // Render shapes on the Konva canvas and capture screenshot
  const renderAndCapture = useCallback(async (newShapes) => {
    setShapes(newShapes);
    await new Promise(r => setTimeout(r, 250)); // let React paint
    if (stageRef.current) return stageRef.current.toDataURL({ pixelRatio: 1 });
    throw new Error('Canvas not ready');
  }, []);

  const runPipeline = async () => {
    if (!apiKey) return;
    if (needsGeminiKey && !geminiKey) { alert('Gemini API key is required for the selected mode.'); return; }
    if (!imageUrl) { alert('This question has no image to repair.'); return; }
    saveApiKey(apiKey);
    if (geminiKey) saveGeminiApiKey(geminiKey);
    setRunning(true);
    setProgressLog([]);
    setResult(null);
    setShapes([]);
    setGeneratedImage(null);

    try {
      const outcome = await repairDiagramWithRetry({
        questionData: question,
        imageUrl,
        userInstructions,
        apiKey,
        geminiApiKey: geminiKey,
        generationMode,
        validationMode,
        geminiImageModel,
        geminiVisionModel,
        onProgress: entry => {
          setProgressLog(prev => [...prev, entry]);
          // Live-update preview as each attempt completes
          if (entry.image) setGeneratedImage(entry.image);
          if (entry.shapes) setShapes(entry.shapes);
        },
        renderAndCapture,
        maxRetries: 5,
      });
      setResult(outcome);
      if (outcome.image) setGeneratedImage(outcome.image);
      if (outcome.shapes) setShapes(outcome.shapes);
    } catch (e) {
      setProgressLog(prev => [...prev, { stage: 'error', message: e.message }]);
    } finally {
      setRunning(false);
    }
  };

  const handleSave = async () => {
    if (!shapes.length && !generatedImage) return;
    setSaving(true);
    setSaveError(null);
    try {
      let imagePublicUrl = null;
      if (generatedImage) {
        // Gemini mode — upload raster image directly
        imagePublicUrl = await uploadDiagramImage(generatedImage, 'diagram-editor/repaired');
      } else if (stageRef.current) {
        // Konva mode — capture stage
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
        imagePublicUrl = await uploadDiagramImage(dataUrl, 'diagram-editor/repaired');
      }
      const updates = {
        ...(shapes.length ? { diagramShapes: shapes } : {}),
        ...(imagePublicUrl ? { image: imagePublicUrl } : {}),
      };
      const updated = await updateQuestion(question.id, updates);
      onSaved?.(updated || { ...question, ...updates });
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadLog = () => downloadLog(`repair_${question.id}_${Date.now()}.json`);
  const handleClearLog = async () => { await clearServerLog(); setProgressLog([]); setResult(null); };

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>

        {/* Header */}
        <div style={S.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={17} color="#a78bfa" />
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>Diagram Repair — Agentic Pipeline</span>
            {result && (
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: result.success ? '#064e3b' : '#450a0a', color: result.success ? '#34d399' : '#f87171', fontWeight: 600 }}>
                {result.success ? `✓ Passed in ${result.attempts} attempt${result.attempts !== 1 ? 's' : ''}` : `✗ Best after ${result.attempts} attempts`}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}><X size={18} /></button>
        </div>

        <div style={S.body}>

          {/* ── Left panel ── */}
          <div style={S.left}>

            {/* Question text */}
            <div>
              <div style={S.label}>Question</div>
              <p style={S.text}>{question.text || question.stem || '(No text)'}</p>
            </div>

            {/* Tags */}
            {question.tags?.length > 0 && (
              <div>
                <div style={S.label}>Tags</div>
                <div>{question.tags.map(t => <span key={t} style={S.tag}>{t}</span>)}</div>
              </div>
            )}

            {/* Original image */}
            {imageUrl ? (
              <div>
                <div style={S.label}>Original Image</div>
                <div style={S.imgBox}>
                  <img src={imageUrl} alt="original" style={S.img} onError={e => { e.target.style.display = 'none'; }} />
                </div>
              </div>
            ) : (
              <div style={{ padding: '14px', background: '#1e293b', borderRadius: '8px', color: '#64748b', fontSize: '12px', textAlign: 'center' }}>
                <ImageIcon size={26} style={{ margin: '0 auto 6px', display: 'block' }} />
                No image attached
              </div>
            )}

            {/* Generation mode */}
            <ModeToggle
              label="Image Generation"
              disabled={running}
              value={generationMode}
              onChange={setGenerationMode}
              options={[
                { value: 'konva', label: 'Konva (Claude)', activeColor: '#7c3aed' },
                { value: 'gemini', label: 'Gemini Image', activeColor: '#1a73e8' },
              ]}
            />

            {/* Gemini image model selector */}
            {generationMode === 'gemini' && (
              <div>
                <div style={S.label}>Gemini Image Model</div>
                <select
                  value={geminiImageModel}
                  onChange={e => setGeminiImageModel(e.target.value)}
                  disabled={running}
                  style={{ ...S.input, appearance: 'auto' }}
                >
                  {GEMINI_IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
            )}

            {/* Validation mode */}
            <ModeToggle
              label="Validation"
              disabled={running}
              value={validationMode}
              onChange={setValidationMode}
              options={[
                { value: 'claude', label: 'Claude Haiku', activeColor: '#7c3aed' },
                { value: 'gemini', label: 'Gemini Vision', activeColor: '#1a73e8' },
              ]}
            />

            {/* Gemini vision model selector */}
            {validationMode === 'gemini' && (
              <div>
                <div style={S.label}>Gemini Vision Model</div>
                <select
                  value={geminiVisionModel}
                  onChange={e => setGeminiVisionModel(e.target.value)}
                  disabled={running}
                  style={{ ...S.input, appearance: 'auto' }}
                >
                  {GEMINI_VISION_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
            )}

            {/* User instructions */}
            <div>
              <div style={S.label}>Additional Instructions <span style={{ color: '#475569', textTransform: 'none', fontWeight: 400 }}>(optional)</span></div>
              <textarea
                style={S.textarea}
                placeholder="e.g. Use blue bars, add a title, label both axes…"
                value={userInstructions}
                onChange={e => setUserInstructions(e.target.value)}
                disabled={running}
              />
            </div>

            {/* Claude API key */}
            <div>
              <div style={S.label}><Key size={10} style={{ display: 'inline', marginRight: '4px' }} />Claude API Key</div>
              <input type="password" value={apiKey} onChange={e => setApiKeyState(e.target.value)} placeholder="sk-ant-…" style={S.input} />
            </div>

            {/* Gemini API key */}
            {needsGeminiKey && (
              <div>
                <div style={S.label}><Key size={10} style={{ display: 'inline', marginRight: '4px' }} />Gemini API Key</div>
                <input type="password" value={geminiKey} onChange={e => setGeminiKeyState(e.target.value)} placeholder="AIza…" style={S.input} />
              </div>
            )}

          </div>

          {/* ── Right panel ── */}
          <div style={S.right}>

            {/* Progress log header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={S.label} style={{ margin: 0 }}>Pipeline Progress</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button style={{ ...S.btn, ...S.btnGhost, padding: '4px 10px', fontSize: '11px' }} onClick={handleDownloadLog} title="Download full log JSON">
                  <Download size={12} /> Log
                </button>
                <button style={{ ...S.btn, ...S.btnDanger, padding: '4px 10px', fontSize: '11px' }} onClick={handleClearLog} title="Clear log file">
                  <Trash2 size={12} /> Clear
                </button>
              </div>
            </div>

            {/* Progress log */}
            <div style={S.log}>
              {progressLog.length === 0 ? (
                <div style={S.logEmpty}>
                  Click "Generate Diagram" to start the agentic pipeline.<br />
                  Haiku analyses the image → Sonnet generates shapes → Haiku validates → up to 5 retries.
                </div>
              ) : (
                progressLog.map((entry, i) => <ProgressEntry key={i} entry={entry} />)
              )}
            </div>

            {/* Result banner */}
            {result && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                background: result.success ? '#064e3b' : '#450a0a', borderRadius: '8px',
                border: `1px solid ${result.success ? '#059669' : '#dc2626'}`,
              }}>
                {result.success ? <CheckCircle size={17} color="#34d399" /> : <XCircle size={17} color="#f87171" />}
                <div>
                  <div style={{ fontSize: '13px', color: result.success ? '#34d399' : '#f87171', fontWeight: 600 }}>
                    {result.success ? 'Diagram validated successfully' : 'Best result after all attempts (not validated)'}
                  </div>
                  {result.validation?.feedback && !result.success && (
                    <div style={{ fontSize: '11px', color: '#f87171', marginTop: '3px' }}>{result.validation.feedback}</div>
                  )}
                </div>
              </div>
            )}

            {/* Canvas / image preview */}
            {(shapes.length > 0 || generatedImage || running) && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={S.label}>Generated Diagram Preview</div>
                  <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: generationMode === 'gemini' ? '#1a3a6e' : '#2e1065', color: generationMode === 'gemini' ? '#60a5fa' : '#a78bfa' }}>
                    {generationMode === 'gemini' ? 'Gemini Image' : 'Konva Canvas'}
                  </span>
                </div>

                {generationMode === 'gemini' ? (
                  /* Raster image from Gemini */
                  <div style={{ ...S.canvasBox, width: '640px', height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                    {generatedImage
                      ? <img src={generatedImage} alt="generated diagram" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                      : <div style={{ color: '#475569', fontSize: '12px' }}>Generating…</div>
                    }
                  </div>
                ) : (
                  /* Konva stage */
                  <div style={{ ...S.canvasBox, overflow: 'hidden' }}>
                    <Stage ref={stageRef} width={800} height={500} style={{ background: '#fff', transform: 'scale(0.8)', transformOrigin: 'top left', display: 'block', width: '800px', height: '500px' }}>
                      <Layer>
                        {shapes.map((s, i) => {
                          const regObj = ObjectRegistry[s.type];
                          if (!regObj?.Component) return null;
                          const Comp = regObj.Component;
                          return (
                            <KonvaGroup key={i} x={s.x || 0} y={s.y || 0} rotation={s.rotation || 0}>
                              <Comp props={s} />
                            </KonvaGroup>
                          );
                        })}
                      </Layer>
                    </Stage>
                  </div>
                )}
              </div>
            )}

            {saveError && (
              <div style={{ padding: '9px 12px', background: '#450a0a', borderRadius: '6px', color: '#f87171', fontSize: '12px' }}>
                Save error: {saveError}
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <button
            style={{ ...S.btn, ...S.btnPrimary, opacity: running || !imageUrl ? 0.5 : 1 }}
            onClick={runPipeline}
            disabled={running || !imageUrl}
          >
            {running ? <Loader size={14} className="spin" /> : <Sparkles size={14} />}
            {running ? 'Running pipeline…' : 'Generate Diagram'}
          </button>

          {(shapes.length > 0 || generatedImage) && (
            <button
              style={{ ...S.btn, ...S.btnSuccess, opacity: saving ? 0.5 : 1 }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader size={14} className="spin" /> : <Save size={14} />}
              {saving ? 'Saving…' : 'Save to DB'}
            </button>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
            {progressLog.length > 0 && (
              <button style={{ ...S.btn, ...S.btnGhost }} onClick={handleDownloadLog}>
                <Download size={13} /> Download Log
              </button>
            )}
            <button style={{ ...S.btn, ...S.btnGhost }} onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
