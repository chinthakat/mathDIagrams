/**
 * QuestionEditorModal — unified "Edit / Repair" modal.
 *
 * Left panel  : editable question text, answer options, correct answer, explanation
 *               + AI repair controls (what to fix, feedback, provider/key settings)
 * Centre      : full Konva canvas (CanvasEditor2D) showing the diagram
 * Right panel : shape PropertiesPanel + pipeline progress log + AI suggestions
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Sparkles, Loader, Save, CheckCircle, XCircle, RotateCcw,
  ChevronRight, Key, Image as ImageIcon, Wand2, FileText, List,
  CheckSquare, AlignLeft, ChevronLeft, Crop, GripVertical,
} from 'lucide-react';
import CanvasEditor2D from './CanvasEditor2D';
import PropertiesPanel from './PropertiesPanel';
import { ObjectRegistry } from '../registry/objectRegistry';
import { getApiKey, saveApiKey, analyseImageForEditing } from '../services/claudeService';
import { resolveImageUrl, uploadDiagramImage, updateQuestion } from '../services/lmsApiService';
import { repairDiagramWithRetry } from '../services/diagramRepairService';
import { exportCroppedDataUrl } from '../utils/canvasUtils';
import { computeShapesBoundingBox } from '../utils/canvasUtils';
import {
  getGeminiApiKey, saveGeminiApiKey,
  GEMINI_VISION_MODELS,
} from '../services/geminiService';

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  overlay:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 9000, display: 'flex', flexDirection: 'column' },
  header:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#0f172a', borderBottom: '1px solid #334155', flexShrink: 0 },
  body:     { display: 'flex', flex: 1, overflow: 'hidden' },
  footer:   { display: 'flex', gap: '8px', padding: '10px 16px', background: '#0f172a', borderTop: '1px solid #334155', flexShrink: 0, alignItems: 'center' },

  leftPanel:  { borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, background: '#0f172a' },
  rightPanel: { width: '270px', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, background: '#0f172a' },
  centre:     { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1e293b', position: 'relative' },

  scroll:   { flex: 1, overflowY: 'auto', padding: '12px' },
  section:  { marginBottom: '14px' },
  label:    { fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' },
  textarea: { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '7px 10px', color: '#e2e8f0', fontSize: '12px', outline: 'none', resize: 'vertical', lineHeight: 1.5, fontFamily: 'inherit', boxSizing: 'border-box' },
  input:    { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', color: '#e2e8f0', fontSize: '12px', outline: 'none', boxSizing: 'border-box' },
  btn:      { padding: '7px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' },
  optionRow:{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '5px' },
  optionKey:{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', width: '14px', flexShrink: 0 },
  check:    { display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#cbd5e1', userSelect: 'none' },
  logBox:   { flex: 1, overflowY: 'auto', padding: '8px 10px', background: '#0a0f1a', borderTop: '1px solid #1e293b', minHeight: '120px' },
  logEntry: { display: 'flex', alignItems: 'flex-start', gap: '7px', padding: '3px 0', fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 },
};

// ── Option letter labels ──────────────────────────────────────────────────────

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E'];

// ── Progress entry ────────────────────────────────────────────────────────────

function ProgressEntry({ entry }) {
  const isGemini = entry.pipelineProvider === 'gemini';
  const vModel = entry.geminiVisionModel || 'Gemini';
  const analysisModel = isGemini ? vModel : 'Claude Haiku';
  const genModel = isGemini ? vModel : 'Claude Sonnet';

  const icon = {
    analyzing:          <Loader size={11} className="spin" style={{ color: '#60a5fa', flexShrink: 0 }} />,
    analyzed:           <CheckCircle size={11} color="#34d399" style={{ flexShrink: 0 }} />,
    extracting_values:  <Loader size={11} className="spin" style={{ color: '#a78bfa', flexShrink: 0 }} />,
    generating:         <Loader size={11} className="spin" style={{ color: '#a78bfa', flexShrink: 0 }} />,
    generated:          <CheckCircle size={11} color="#34d399" style={{ flexShrink: 0 }} />,
    rendering:          <Loader size={11} className="spin" style={{ color: '#fb923c', flexShrink: 0 }} />,
    validating:         <Loader size={11} className="spin" style={{ color: '#fbbf24', flexShrink: 0 }} />,
    validated:          entry.validation?.isCorrect ? <CheckCircle size={11} color="#34d399" style={{ flexShrink: 0 }} /> : <XCircle size={11} color="#f87171" style={{ flexShrink: 0 }} />,
    retry:              <RotateCcw size={11} color="#f59e0b" style={{ flexShrink: 0 }} />,
    error:              <XCircle size={11} color="#f87171" style={{ flexShrink: 0 }} />,
    attempt_error:      <XCircle size={11} color="#f87171" style={{ flexShrink: 0 }} />,
    missing_components: <XCircle size={11} color="#f59e0b" style={{ flexShrink: 0 }} />,
    preflight_checking: <Loader size={11} className="spin" style={{ color: '#38bdf8', flexShrink: 0 }} />,
    preflight_ok:       <CheckCircle size={11} color="#34d399" style={{ flexShrink: 0 }} />,
    preflight_blocked:  <XCircle size={11} color="#f59e0b" style={{ flexShrink: 0 }} />,
    reviewing_question: <Loader size={11} className="spin" style={{ color: '#34d399', flexShrink: 0 }} />,
    review_complete:    <CheckCircle size={11} color="#34d399" style={{ flexShrink: 0 }} />,
  }[entry.stage] || <ChevronRight size={11} color="#475569" style={{ flexShrink: 0 }} />;

  const text = {
    analyzing:          `Analysing with ${analysisModel}…`,
    analyzed:           `Classified: ${entry.analysis?.diagramType || 'diagram'}`,
    extracting_values:  `OCR: extracting exact values…`,
    refining_prompt:    `Refining prompt…`,
    generating:         `Attempt ${entry.attempt}/${entry.maxAttempts} — Generating with ${genModel}…`,
    generated:          entry.image ? `Attempt ${entry.attempt} — image generated` : `Attempt ${entry.attempt} — ${entry.shapes?.length || 0} shapes`,
    rendering:          `Attempt ${entry.attempt} — Rendering…`,
    validating:         `Attempt ${entry.attempt} — Validating…`,
    validated:          entry.validation?.isCorrect
      ? `Attempt ${entry.attempt} — ✓ PASSED`
      : `Attempt ${entry.attempt} — ✗ ${entry.validation?.feedback?.slice(0, 60) || 'FAILED'}`,
    retry:              `Attempt ${entry.attempt} — retrying…`,
    error:              `⚠ ${entry.message || 'Error'}`,
    attempt_error:      `⚠ Attempt ${entry.attempt}: ${entry.message || 'error'}`,
    missing_components: `⚠ Missing components: ${(entry.missingComponents || []).map(m => m.type).join(', ')}`,
    preflight_checking: `🔍 Checking library compatibility…`,
    preflight_ok:       `✓ Library check passed — all objects available`,
    preflight_blocked:  `🚫 Cannot generate — ${entry.missingComponents?.length || 0} missing object(s)`,
    reviewing_question: `Reviewing question fields against new diagram…`,
    review_complete:    `✓ Review complete — AI suggestions ready in panel`,
  }[entry.stage] || entry.stage;

  return (
    <div style={S.logEntry}>
      {icon}
      <span>{text}</span>
    </div>
  );
}

// ── Checkbox row ──────────────────────────────────────────────────────────────

function CheckRow({ checked, onChange, label, icon: Icon }) {
  return (
    <label style={{ ...S.check, background: checked ? 'rgba(124,58,237,0.15)' : 'transparent' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ accentColor: '#7c3aed' }} />
      {Icon && <Icon size={12} style={{ color: checked ? '#a78bfa' : '#64748b', flexShrink: 0 }} />}
      <span style={{ color: checked ? '#e2e8f0' : '#94a3b8' }}>{label}</span>
    </label>
  );
}

// ── AI Suggestions Panel ──────────────────────────────────────────────────────

function AISuggestionsPanel({ original, suggested, onAccept, onAcceptAll, onDismiss }) {
  const fields = [
    { key: 'text',          label: 'Question Text' },
    { key: 'options',       label: 'Answer Options' },
    { key: 'correctAnswer', label: 'Correct Answer' },
    { key: 'explanation',   label: 'Explanation' },
  ];

  const toStr = v => Array.isArray(v) ? v.map((o, i) => `${OPTION_KEYS[i]}) ${o}`).join('\n') : String(v || '');

  const changedFields = fields.filter(({ key }) => {
    const o = toStr(original[key]);
    const s = toStr(suggested[key]);
    return s && o !== s;
  });

  if (changedFields.length === 0) return (
    <div style={{ padding: '10px 12px', borderTop: '1px solid #1e293b', fontSize: '11px', color: '#34d399' }}>
      ✓ AI reviewed — no changes suggested.
      <button onClick={onDismiss} style={{ marginLeft: 8, fontSize: '10px', background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}>Dismiss</button>
    </div>
  );

  return (
    <div style={{ borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, maxHeight: '55%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(52,211,153,0.06)', borderBottom: '1px solid #134e4a', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={11} color="#34d399" />
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Suggestions</span>
          <span style={{ fontSize: '10px', color: '#475569' }}>({changedFields.length} field{changedFields.length !== 1 ? 's' : ''})</span>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            onClick={onAcceptAll}
            style={{ fontSize: '10px', padding: '3px 8px', background: '#065f46', color: '#34d399', border: '1px solid #134e4a', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >Accept All</button>
          <button
            onClick={onDismiss}
            style={{ fontSize: '10px', padding: '3px 6px', background: 'transparent', color: '#475569', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer' }}
          ><X size={10} /></button>
        </div>
      </div>

      {/* Field diffs */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {changedFields.map(({ key, label }) => {
          const origStr = toStr(original[key]);
          const suggStr = toStr(suggested[key]);
          return (
            <div key={key} style={{ padding: '8px 10px', borderBottom: '1px solid #0f172a' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
                <button
                  onClick={() => onAccept(key, suggested[key])}
                  style={{ fontSize: '10px', padding: '2px 8px', background: '#065f46', color: '#34d399', border: '1px solid #134e4a', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                >Accept</button>
              </div>
              {/* Side-by-side */}
              <div style={{ display: 'flex', gap: '5px' }}>
                {/* Original */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '9px', color: '#475569', fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase' }}>Original</div>
                  <div style={{
                    background: '#0f172a', border: '1px solid #334155', borderRadius: '4px',
                    padding: '4px 6px', fontSize: '11px', color: '#64748b', lineHeight: 1.4,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>{origStr}</div>
                </div>
                {/* Suggested */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '9px', color: '#34d399', fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase' }}>AI Suggested</div>
                  <div style={{
                    background: 'rgba(52,211,153,0.06)', border: '1px solid #134e4a', borderRadius: '4px',
                    padding: '4px 6px', fontSize: '11px', color: '#34d399', lineHeight: 1.4,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>{suggStr}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function QuestionEditorModal({ question, onClose, onSaved }) {
  // ── Editable question fields ───────────────────────────────────────────────
  const [qText, setQText]         = useState(question.text || question.stem || '');
  const [options, setOptions]     = useState(() => {
    const raw = question.options || [];
    // Normalise to array of plain strings
    return raw.map(o => (typeof o === 'string' ? o : o.text || o.value || String(o)));
  });
  const [correctAnswer, setCorrectAnswer] = useState(question.correctAnswer || '');
  const [explanation, setExplanation]     = useState(question.explanation || '');

  // ── Canvas state ───────────────────────────────────────────────────────────
  const [shapes, setShapes]       = useState(() => question.diagramShapes || question.shapes || []);
  const [selectedId, setSelectedId] = useState(null);
  const stageRef = useRef(null);

  // ── AI repair controls ─────────────────────────────────────────────────────
  const [fixDiagram, setFixDiagram]         = useState(true);
  const [fixText, setFixText]               = useState(false);
  const [fixOptions, setFixOptions]         = useState(false);
  const [fixAnswer, setFixAnswer]           = useState(false);
  const [fixExplanation, setFixExplanation] = useState(false);
  const [feedback, setFeedback]             = useState('');
  const [pipelineProvider, setPipelineProvider] = useState('gemini');
  const [geminiVisionModel, setGeminiVisionModel] = useState(GEMINI_VISION_MODELS[0].id);
  const [apiKey, setApiKeyState]    = useState(getApiKey);
  const [geminiKey, setGeminiKeyState] = useState(getGeminiApiKey);

  // ── Pipeline state ─────────────────────────────────────────────────────────
  const [running, setRunning]     = useState(false);
  const [progressLog, setProgressLog] = useState([]);
  const [missingComponents, setMissingComponents] = useState([]);
  const [preflightResult, setPreflightResult] = useState(null);
  const [preflightBlocked, setPreflightBlocked] = useState(false);
  const [originalExpanded, setOriginalExpanded] = useState(true);
  const [result, setResult]       = useState(null);

  // ── Crop & Grid state ──────────────────────────────────────────────────────
  const [cropMode, setCropMode]   = useState(false);
  const [cropBox, setCropBox]     = useState({ x: 50, y: 50, width: 700, height: 400 });
  const [showGrid, setShowGrid]   = useState(true);
  const [showNumberedGrid, setShowNumberedGrid] = useState(true);

  // ── Save state ─────────────────────────────────────────────────────────────
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved]         = useState(false);

  // ── Left panel resize ──────────────────────────────────────────────────────
  const [leftWidth, setLeftWidth] = useState(310);
  const draggingLeftRef = useRef(false);

  // ── AI question review state ───────────────────────────────────────────────
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [reviewingQuestion, setReviewingQuestion] = useState(false);

  const imageUrl = resolveImageUrl(question.image || question.imageUrl || question.imageKey);

  // ── Canvas helpers ─────────────────────────────────────────────────────────
  const updateShape  = useCallback((id, p) => setShapes(prev => prev.map(s => s.id === id ? { ...s, ...p } : s)), []);
  const deleteShape  = useCallback(id => { setShapes(prev => prev.filter(s => s.id !== id)); setSelectedId(null); }, []);
  const reorderShape = useCallback((id, dir) => setShapes(prev => {
    const i = prev.findIndex(s => s.id === id); if (i < 0) return prev;
    const a = [...prev];
    if (dir === 'up' && i > 0)             [a[i - 1], a[i]] = [a[i], a[i - 1]];
    if (dir === 'down' && i < a.length - 1)[a[i], a[i + 1]] = [a[i + 1], a[i]];
    return a;
  }), []);

  // ── Left panel drag resize ─────────────────────────────────────────────────
  const handleLeftDragStart = useCallback((e) => {
    e.preventDefault();
    const startX    = e.clientX;
    const startWidth = leftWidth;
    draggingLeftRef.current = true;

    const onMove = (ev) => {
      if (!draggingLeftRef.current) return;
      const newW = Math.max(180, Math.min(520, startWidth + (ev.clientX - startX)));
      setLeftWidth(newW);
    };
    const onUp = () => {
      draggingLeftRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [leftWidth]);

  // ── renderAndCapture for repair pipeline ──────────────────────────────────
  const renderAndCapture = useCallback(async (newShapes) => {
    setShapes(newShapes);
    await new Promise(r => setTimeout(r, 250));
    if (stageRef.current) return stageRef.current.toDataURL({ pixelRatio: 1 });
    throw new Error('Canvas not ready');
  }, []);

  // ── Run AI pipeline ────────────────────────────────────────────────────────
  const runPipeline = async () => {
    if (!fixDiagram && !fixText && !fixOptions && !fixAnswer && !fixExplanation) {
      alert('Select at least one thing to fix.'); return;
    }
    if (pipelineProvider === 'gemini' && !geminiKey) { alert('Gemini API key required.'); return; }
    if (pipelineProvider === 'claude' && !apiKey)    { alert('Claude API key required.');  return; }
    if (fixDiagram && !imageUrl) { alert('No image attached — cannot repair diagram.'); return; }
    if (apiKey)    saveApiKey(apiKey);
    if (geminiKey) saveGeminiApiKey(geminiKey);

    setRunning(true);
    setProgressLog([]);
    setMissingComponents([]);
    setPreflightResult(null);
    setPreflightBlocked(false);
    setAiSuggestions(null);
    setSaved(false);

    // Build combined feedback: user text + selected fields context
    const fieldContext = [
      fixText        && `Question text: "${qText}"`,
      fixOptions     && `Options: ${options.map((o, i) => `${OPTION_KEYS[i]}) ${o}`).join(' | ')}`,
      fixAnswer      && `Correct answer: ${correctAnswer}`,
      fixExplanation && `Explanation: "${explanation}"`,
    ].filter(Boolean).join('\n');

    const fullFeedback = [feedback, fieldContext].filter(Boolean).join('\n\n');

    try {
      if (fixDiagram) {
        const outcome = await repairDiagramWithRetry({
          questionData: { ...question, text: qText },
          imageUrl,
          userInstructions: fullFeedback,
          apiKey,
          geminiApiKey: geminiKey,
          generationMode: 'konva',
          validationMode: pipelineProvider === 'gemini' ? 'gemini' : 'claude',
          pipelineProvider,
          geminiVisionModel,
          onProgress: entry => {
            setProgressLog(prev => [...prev, entry]);
            if ((entry.stage === 'missing_components' || entry.stage === 'preflight_blocked') && entry.missingComponents?.length) {
              setMissingComponents(entry.missingComponents);
            }
          },
          renderAndCapture,
          maxRetries: 3,
        });
        setResult(outcome);
        if (outcome.shapes?.length) setShapes(outcome.shapes);
        if (outcome.missingComponents?.length) setMissingComponents(outcome.missingComponents);
        if (outcome.preflightBlocked) {
          setPreflightBlocked(true);
          setPreflightResult(outcome.preflight || null);
        }

        // ── Auto-review question fields against the new diagram ────────────
        if (outcome.success && (apiKey || geminiKey)) {
          setReviewingQuestion(true);
          setProgressLog(prev => [...prev, { stage: 'reviewing_question' }]);
          try {
            await new Promise(r => setTimeout(r, 350)); // let canvas re-render
            const sugg = await reviewQuestionAgainstDiagram({
              stageRef, qText, options, correctAnswer, explanation,
              apiKey, geminiKey, pipelineProvider,
            });
            if (sugg) {
              setAiSuggestions(sugg);
              setProgressLog(prev => [...prev, { stage: 'review_complete' }]);
            }
          } catch (err) {
            console.warn('Question review failed:', err);
          } finally {
            setReviewingQuestion(false);
          }
        }
      }

      // Text field fixes via Claude/Gemini (simple prompt)
      const textFields = [fixText, fixOptions, fixAnswer, fixExplanation].some(Boolean);
      if (textFields && (apiKey || geminiKey)) {
        setProgressLog(prev => [...prev, { stage: 'generating', attempt: 1, maxAttempts: 1, pipelineProvider, geminiVisionModel }]);
        const fixedFields = await fixQuestionFields({
          qText, options, correctAnswer, explanation,
          fixText, fixOptions, fixAnswer, fixExplanation,
          feedback, imageUrl, apiKey, geminiKey, pipelineProvider,
        });
        if (fixText        && fixedFields.text)        setQText(fixedFields.text);
        if (fixOptions     && fixedFields.options)     setOptions(fixedFields.options);
        if (fixAnswer      && fixedFields.correctAnswer) setCorrectAnswer(fixedFields.correctAnswer);
        if (fixExplanation && fixedFields.explanation) setExplanation(fixedFields.explanation);
        setProgressLog(prev => [...prev, { stage: 'generated', attempt: 1, maxAttempts: 1, shapes: [], pipelineProvider }]);
      }
    } catch (e) {
      setProgressLog(prev => [...prev, { stage: 'error', message: e.message }]);
    } finally {
      setRunning(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const wasCropMode = cropMode;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const updates = {};

      // Upload new diagram image if shapes exist
      if (shapes.length > 0 && stageRef.current) {
        let dataUrl;
        if (wasCropMode) {
          // Hide crop outline temporarily before capture
          setCropMode(false);
          await new Promise(r => setTimeout(r, 120)); // wait for Konva to repaint without crop rect

          const stage = stageRef.current;
          const scale  = stage.scaleX();          // zoom level (same for X and Y)
          const stageX = stage.x();               // pan offset X
          const stageY = stage.y();               // pan offset Y

          // cropBox coords are in Konva *canvas* space (local units).
          // Convert to screen pixels relative to the stage container, then back to
          // Konva "absolute" units that toDataURL() expects.
          const sx = cropBox.x * scale + stageX;
          const sy = cropBox.y * scale + stageY;
          const sw = cropBox.width  * scale;
          const sh = cropBox.height * scale;

          // Clamp to visible stage bounds (avoid negative widths)
          const pixelRatio = 2;
          dataUrl = stage.toDataURL({
            x: Math.max(0, sx),
            y: Math.max(0, sy),
            width:  Math.max(20, sw),
            height: Math.max(20, sh),
            pixelRatio,
          });
        } else {
          dataUrl = exportCroppedDataUrl(stageRef.current, shapes, { pixelRatio: 2 });
        }

        updates.image = await uploadDiagramImage(dataUrl, 'question-editor/unified');
        updates.diagramShapes = shapes;
      }

      // Save editable text fields
      updates.text = qText;
      updates.options = options;
      updates.correctAnswer = correctAnswer;
      updates.explanation = explanation;

      const updated = await updateQuestion(question.id, updates);
      setSaved(true);
      onSaved?.(updated || { ...question, ...updates });
      setCropMode(false);
    } catch (e) {
      setSaveError(e.message);
      if (wasCropMode) setCropMode(true);
    } finally {
      setSaving(false);
    }
  };

  // ── Accept suggestion handlers ────────────────────────────────────────────
  const handleAcceptSuggestion = useCallback((key, value) => {
    if (key === 'text')          setQText(value);
    else if (key === 'options')  setOptions(value);
    else if (key === 'correctAnswer') setCorrectAnswer(value);
    else if (key === 'explanation')   setExplanation(value);
  }, []);

  const handleAcceptAll = useCallback(() => {
    if (!aiSuggestions) return;
    if (aiSuggestions.text)          setQText(aiSuggestions.text);
    if (aiSuggestions.options)       setOptions(aiSuggestions.options);
    if (aiSuggestions.correctAnswer) setCorrectAnswer(aiSuggestions.correctAnswer);
    if (aiSuggestions.explanation)   setExplanation(aiSuggestions.explanation);
    setAiSuggestions(null);
  }, [aiSuggestions]);

  const selectedShape = shapes.find(s => s.id === selectedId);

  return (
    <div style={S.overlay}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wand2 size={16} color="#a78bfa" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>Edit / Repair Question</span>
          <span style={{ fontSize: '11px', color: '#475569', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {question.text?.slice(0, 80) || '(no text)'}
          </span>
        </div>

        {/* Portal target for the CanvasEditor2D toolbar */}
        <div id="question-canvas-toolbar-portal" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}></div>

        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div style={S.body}>

        {/* ── Left panel (resizable) ── */}
        <div style={{ ...S.leftPanel, width: leftWidth + 'px' }}>
          <div style={S.scroll}>

            {/* Question text */}
            <div style={S.section}>
              <div style={S.label}><FileText size={11} /> Question Text</div>
              <textarea
                value={qText}
                onChange={e => setQText(e.target.value)}
                rows={4}
                style={S.textarea}
                placeholder="Question text…"
              />
            </div>

            {/* Answer options */}
            <div style={S.section}>
              <div style={S.label}><List size={11} /> Answer Options</div>
              {options.map((opt, i) => (
                <div key={i} style={S.optionRow}>
                  <span style={{
                    ...S.optionKey,
                    color: correctAnswer === OPTION_KEYS[i] || correctAnswer === opt ? '#34d399' : '#94a3b8',
                  }}>{OPTION_KEYS[i]}</span>
                  <input
                    value={opt}
                    onChange={e => setOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                    style={{ ...S.input, borderColor: (correctAnswer === OPTION_KEYS[i] || correctAnswer === opt) ? '#065f46' : '#334155' }}
                  />
                </div>
              ))}
              {/* Add option */}
              {options.length < 5 && (
                <button
                  onClick={() => setOptions(prev => [...prev, ''])}
                  style={{ fontSize: '11px', color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
                >+ Add option</button>
              )}
            </div>

            {/* Correct answer */}
            <div style={S.section}>
              <div style={S.label}><CheckSquare size={11} /> Correct Answer</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {options.map((opt, i) => {
                  const key = OPTION_KEYS[i];
                  const isCorrect = correctAnswer === key || correctAnswer === opt || correctAnswer === `(${key}) ${opt}`;
                  return (
                    <button
                      key={i}
                      onClick={() => setCorrectAnswer(key)}
                      style={{
                        padding: '4px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                        fontSize: '11px', fontWeight: 700,
                        background: isCorrect ? '#065f46' : '#1e293b',
                        color: isCorrect ? '#34d399' : '#64748b',
                      }}
                    >{key}</button>
                  );
                })}
              </div>
              <input
                value={correctAnswer}
                onChange={e => setCorrectAnswer(e.target.value)}
                style={{ ...S.input, marginTop: '5px', fontSize: '11px' }}
                placeholder="e.g. A, B, or full option text"
              />
            </div>

            {/* Explanation */}
            <div style={S.section}>
              <div style={S.label}><AlignLeft size={11} /> Explanation</div>
              <textarea
                value={explanation}
                onChange={e => setExplanation(e.target.value)}
                rows={4}
                style={S.textarea}
                placeholder="Explanation / working…"
              />
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #1e293b', margin: '6px 0 12px' }} />

            {/* Grid Settings */}
            <div style={S.section}>
              <div style={S.label}>Canvas Grid</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <CheckRow checked={showGrid} onChange={setShowGrid} label="Show Grid Lines" />
                <CheckRow checked={showNumberedGrid} onChange={setShowNumberedGrid} label="Show Coordinates" />
              </div>
            </div>

            {/* AI repair section */}
            <div style={S.section}>
              <div style={{ ...S.label, color: '#a78bfa' }}><Sparkles size={11} /> AI Repair — What to Fix</div>
              <CheckRow checked={fixDiagram}     onChange={setFixDiagram}     icon={ImageIcon}    label="Regenerate diagram" />
              <CheckRow checked={fixText}        onChange={setFixText}        icon={FileText}     label="Fix question text" />
              <CheckRow checked={fixOptions}     onChange={setFixOptions}     icon={List}         label="Fix answer options" />
              <CheckRow checked={fixAnswer}      onChange={setFixAnswer}      icon={CheckSquare}  label="Fix correct answer" />
              <CheckRow checked={fixExplanation} onChange={setFixExplanation} icon={AlignLeft}    label="Fix explanation" />
            </div>

            {/* Feedback */}
            <div style={S.section}>
              <div style={S.label}>Feedback / Instructions</div>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={3}
                style={S.textarea}
                placeholder="e.g. Move the robot to X: 400, Y: 200, align the text labels along X: 150…"
              />
            </div>

            {/* Provider */}
            <div style={S.section}>
              <div style={S.label}>AI Provider</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['gemini', 'claude'].map(p => (
                  <button key={p} onClick={() => setPipelineProvider(p)} style={{
                    padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    fontSize: '11px', fontWeight: 600,
                    background: pipelineProvider === p ? (p === 'gemini' ? '#1a3a6e' : '#2e1065') : '#1e293b',
                    color: pipelineProvider === p ? (p === 'gemini' ? '#60a5fa' : '#a78bfa') : '#64748b',
                  }}>{p === 'gemini' ? 'Gemini' : 'Claude'}</button>
                ))}
              </div>
            </div>

            {/* Vision model */}
            <div style={S.section}>
              <div style={S.label}>Gemini Vision Model</div>
              <select value={geminiVisionModel} onChange={e => setGeminiVisionModel(e.target.value)}
                style={{ ...S.input, appearance: 'auto' }}>
                {GEMINI_VISION_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>

            {/* API keys */}
            {(pipelineProvider === 'claude' || [fixText, fixOptions, fixAnswer, fixExplanation].some(Boolean)) && (
              <div style={S.section}>
                <div style={S.label}><Key size={10} /> Claude API Key</div>
                <input type="password" value={apiKey} onChange={e => setApiKeyState(e.target.value)}
                  placeholder="sk-ant-…" style={S.input} />
              </div>
            )}
            <div style={S.section}>
              <div style={S.label}><Key size={10} /> Gemini API Key</div>
              <input type="password" value={geminiKey} onChange={e => setGeminiKeyState(e.target.value)}
                placeholder="AIza…" style={S.input} />
            </div>

          </div>
        </div>

        {/* ── Left panel drag handle ── */}
        <div
          onMouseDown={handleLeftDragStart}
          title="Drag to resize panel"
          style={{
            width: '6px',
            flexShrink: 0,
            cursor: 'col-resize',
            background: 'transparent',
            borderRight: '1px solid #1e293b',
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.35)'; }}
          onMouseLeave={e => { if (!draggingLeftRef.current) e.currentTarget.style.background = 'transparent'; }}
        >
          <GripVertical size={12} color="#334155" style={{ pointerEvents: 'none' }} />
        </div>

        {/* ── Centre — original image + canvas ── */}
        <div style={{ ...S.centre, flexDirection: 'row' }}>
          
          {/* ── Side-by-side Original Image Panel ── */}
          {imageUrl && (
            <div style={{
              width: originalExpanded ? '33.33%' : '40px',
              borderRight: `1px solid #334155`,
              background: '#1e293b',
              display: 'flex',
              flexDirection: 'column',
              transition: 'width 0.2s ease',
              flexShrink: 0,
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: originalExpanded ? 'space-between' : 'center', padding: '10px 8px', borderBottom: `1px solid #334155`, background: '#0f172a' }}>
                {originalExpanded && <span style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.05em' }}><ImageIcon size={12} style={{marginRight: 6, verticalAlign:'-2px'}}/> Original Image</span>}
                <button onClick={() => setOriginalExpanded(!originalExpanded)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }} title={originalExpanded ? "Collapse" : "Expand Original"}>
                  {originalExpanded ? <ChevronLeft size={16} /> : <ImageIcon size={16} />}
                </button>
              </div>
              
              {originalExpanded && (
                <div style={{ flex: 1, padding: '12px', overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
                  <img src={imageUrl} alt="original" style={{ maxWidth: '100%', objectFit: 'contain', background: '#fff', borderRadius: '4px', border: `1px solid #334155`, alignSelf: 'flex-start' }} />
                </div>
              )}
              {!originalExpanded && (
                <div style={{ padding: '14px 0', display: 'flex', justifyContent: 'center' }}>
                   <span style={{ fontSize: '10px', fontWeight: 700, writingMode: 'vertical-rl', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Original</span>
                </div>
              )}
            </div>
          )}

          {/* ── Canvas Editor ── */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {cropMode && (
              <div style={{
                position: 'absolute', top: 12, left: 12, right: 12, zIndex: 50,
                background: 'rgba(59,130,246,0.92)', border: '1px solid #3b82f6', borderRadius: '8px',
                padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
              }}>
                <span style={{ fontSize: '12px', color: '#eff6ff' }}>
                  <strong>Crop Mode Active:</strong> Drag and resize the blue dashed box to select the area of the diagram to save.
                </span>
                <button
                  onClick={() => setCropMode(false)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#fff', fontSize: '11px', fontWeight: 600, padding: '4px 8px' }}
                >
                  Cancel Crop
                </button>
              </div>
            )}
            <CanvasEditor2D
              shapes={shapes}
              setShapes={(fn) => setShapes(typeof fn === 'function' ? fn(shapes) : fn)}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              stageRef={stageRef}
              showGrid={showGrid}
              showNumberedGrid={showNumberedGrid}
              cropMode={cropMode}
              cropBox={cropBox}
              setCropBox={setCropBox}
              isExporting={saving}
              toolbarPortalId="question-canvas-toolbar-portal"
            />
          </div>
        </div>

        {/* ── Right panel — properties + log + AI suggestions ── */}
        <div style={S.rightPanel}>
          {/* Properties */}
          <div style={{ borderBottom: '1px solid #1e293b', overflow: 'hidden', maxHeight: '30%' }}>
            <PropertiesPanel
              selectedShape={selectedShape}
              updateShape={updateShape}
              deleteShape={deleteShape}
              reorderShape={reorderShape}
              mode="2D"
              openIconPicker={() => {}}
              allShapes={shapes}
            />
          </div>

          {/* Pipeline progress */}
          <div style={{ padding: '8px 10px 4px', flexShrink: 0, borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pipeline Progress
            </span>
          </div>
          <div style={{ ...S.logBox, flex: aiSuggestions || reviewingQuestion ? '0 0 auto' : 1, maxHeight: aiSuggestions || reviewingQuestion ? '160px' : undefined }}>
            {progressLog.length === 0 ? (
              <div style={{ fontSize: '11px', color: '#334155', textAlign: 'center', padding: '16px 0' }}>
                Select what to fix, add feedback,<br />then click "Run AI".
              </div>
            ) : progressLog.map((e, i) => <ProgressEntry key={i} entry={e} />)}
            {missingComponents.length > 0 && (
              <div style={{ marginTop: '10px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.5)', borderRadius: '8px', overflow: 'hidden', fontSize: '11px' }}>
                <div style={{ background: 'rgba(245,158,11,0.15)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(245,158,11,0.25)' }}>
                  <span style={{ fontSize: '16px' }}>🚫</span>
                  <div>
                    <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '11px' }}>Diagram Generation Blocked</div>
                    <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '1px' }}>
                      {preflightResult?.reason || 'This diagram requires library objects that have not been built yet.'}
                    </div>
                  </div>
                </div>
                <div style={{ padding: '8px 12px' }}>
                  <div style={{ color: '#fbbf24', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Objects needed ({missingComponents.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '8px' }}>
                    {missingComponents.map((m, i) => {
                      const type = typeof m === 'string' ? m : m.type;
                      const comment = typeof m === 'object' && m.comment ? m.comment : '';
                      const suggestion = typeof m === 'object' && m.suggestion ? m.suggestion : '';
                      return (
                        <div key={i} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '5px', padding: '6px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ color: '#f87171', fontSize: '10px' }}>✗</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#fbbf24', fontWeight: 700 }}>{type}</span>
                          </div>
                          {comment && <div style={{ color: '#cbd5e1', fontSize: '10px', marginTop: '3px', paddingLeft: '15px', lineHeight: '1.4' }}>{comment}</div>}
                          {suggestion && <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px', paddingLeft: '15px', fontStyle: 'italic' }}>💡 {suggestion}</div>}
                        </div>
                      );
                    })}
                  </div>
                  {preflightResult?.coverage?.length > 0 && (
                    <details style={{ marginBottom: '6px' }}>
                      <summary style={{ color: '#475569', fontSize: '10px', cursor: 'pointer', userSelect: 'none', marginBottom: '4px' }}>
                        View full element coverage ({preflightResult.coverage.filter(c => c.matched).length}/{preflightResult.coverage.length} matched)
                      </summary>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                        {preflightResult.coverage.map((c, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', fontSize: '10px', padding: '2px 0' }}>
                            <span style={{ color: c.matched ? '#34d399' : '#f87171', flexShrink: 0, marginTop: '1px' }}>{c.matched ? '✓' : '✗'}</span>
                            <span style={{ color: c.matched ? '#94a3b8' : '#fcd34d', flex: 1 }}>{c.element}</span>
                            {c.matchedComponent && <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: '9px', flexShrink: 0 }}>{c.matchedComponent}</span>}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  <div style={{ color: '#475569', fontSize: '10px', lineHeight: '1.5', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                    Ask the developer to build the missing objects above, then run the AI again.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── AI Question Review Suggestions ── */}
          {reviewingQuestion && (
            <div style={{ padding: '10px 12px', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(52,211,153,0.04)', flexShrink: 0 }}>
              <Loader size={12} className="spin" color="#34d399" />
              <span style={{ fontSize: '11px', color: '#34d399' }}>Reviewing question against diagram…</span>
            </div>
          )}
          {aiSuggestions && !reviewingQuestion && (
            <AISuggestionsPanel
              original={{ text: qText, options, correctAnswer, explanation }}
              suggested={aiSuggestions}
              onAccept={handleAcceptSuggestion}
              onAcceptAll={handleAcceptAll}
              onDismiss={() => setAiSuggestions(null)}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={S.footer}>
        <button
          style={{ ...S.btn, background: running ? '#312e81' : '#7c3aed', color: '#fff', opacity: running ? 0.7 : 1 }}
          onClick={runPipeline}
          disabled={running}
        >
          {running ? <Loader size={14} className="spin" /> : <Sparkles size={14} />}
          {running ? 'Running AI…' : 'Run AI'}
        </button>

        {shapes.length > 0 && (
          <button
            style={{
              ...S.btn,
              background: cropMode ? '#1e3a8a' : '#1e293b',
              color: '#fff',
              border: '1px solid #334155',
            }}
            onClick={() => setCropMode(!cropMode)}
            disabled={saving || running}
          >
            <Crop size={14} />
            {cropMode ? 'Exit Crop Mode' : 'Crop Diagram'}
          </button>
        )}

        <button
          style={{ ...S.btn, background: saving ? '#065f46' : '#059669', color: '#fff', opacity: saving ? 0.7 : 1 }}
          onClick={handleSave}
          disabled={saving || running}
        >
          {saving ? <Loader size={14} className="spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : cropMode ? 'Confirm Crop & Save' : saved ? '✓ Saved' : 'Save All'}
        </button>

        {saveError && <span style={{ fontSize: '12px', color: '#f87171' }}>{saveError}</span>}

        <div style={{ marginLeft: 'auto' }}>
          <button style={{ ...S.btn, background: 'transparent', color: '#94a3b8', border: '1px solid #334155' }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Fix text fields via AI ────────────────────────────────────────────────────

async function fixQuestionFields({ qText, options, correctAnswer, explanation, fixText, fixOptions, fixAnswer, fixExplanation, feedback, imageUrl, apiKey, geminiKey, pipelineProvider }) {
  const fieldsToFix = {
    ...(fixText        && { text: qText }),
    ...(fixOptions     && { options }),
    ...(fixAnswer      && { correctAnswer }),
    ...(fixExplanation && { explanation }),
  };

  const systemPrompt = `You are a mathematics question editor. Fix only the requested fields in the question JSON.
Return ONLY valid JSON with the same keys as the input — do not add extra keys. Preserve any field not marked for fixing.`;

  const userMsg = `Here is the question data to fix:
${JSON.stringify(fieldsToFix, null, 2)}

${feedback ? `Instructions: ${feedback}` : ''}

Return the corrected JSON object with the same keys.`;

  try {
    if (pipelineProvider === 'gemini' && geminiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userMsg }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });
      if (!resp.ok) throw new Error(`Gemini text fix error: ${resp.status}`);
      const data = await resp.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      return JSON.parse(raw);
    }

    if (apiKey) {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMsg }],
        }),
      });
      if (!resp.ok) throw new Error(`Claude text fix error: ${resp.status}`);
      const data = await resp.json();
      const raw = data.content?.[0]?.text || '{}';
      const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      return JSON.parse(cleaned);
    }
  } catch (e) {
    console.warn('fixQuestionFields failed:', e.message);
  }
  return {};
}

// ── Review question fields against the newly generated diagram ────────────────

async function reviewQuestionAgainstDiagram({ stageRef, qText, options, correctAnswer, explanation, apiKey, geminiKey, pipelineProvider }) {
  // Capture canvas screenshot
  let screenshotBase64 = null;
  if (stageRef?.current) {
    try {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 1.5 });
      screenshotBase64 = dataUrl.split(',')[1];
    } catch (e) {
      console.warn('Could not capture canvas for review:', e.message);
    }
  }
  if (!screenshotBase64) return null;

  const KEYS = ['A', 'B', 'C', 'D', 'E'];

  const systemPrompt = `You are a mathematics teacher reviewing a multiple-choice question against a freshly generated diagram.
Carefully compare the question text, answer options, correct answer, and explanation against what is ACTUALLY visible in the diagram.
Suggest corrections or refinements where the text does not match the diagram, or where accuracy can be improved.
If a field is already correct and well-worded, return it unchanged.

Return ONLY a single valid JSON object with exactly these four keys:
{
  "text": "<corrected or unchanged question text>",
  "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
  "correctAnswer": "<letter A, B, C or D>",
  "explanation": "<corrected or unchanged explanation>"
}
Do not add any commentary outside the JSON.`;

  const userMsg = `Current question data:
Question: ${qText}
Options: ${options.map((o, i) => `${KEYS[i]}) ${o}`).join(' | ')}
Correct Answer: ${correctAnswer}
Explanation: ${explanation}

Please review the attached diagram image and return the corrected JSON.`;

  try {
    if (pipelineProvider === 'gemini' && geminiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{
            role: 'user',
            parts: [
              { inlineData: { mimeType: 'image/png', data: screenshotBase64 } },
              { text: userMsg },
            ],
          }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });
      if (!resp.ok) throw new Error(`Gemini review error: ${resp.status}`);
      const data = await resp.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || 'null';
      return JSON.parse(raw);
    }

    if (apiKey) {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/png', data: screenshotBase64 } },
              { type: 'text', text: userMsg },
            ],
          }],
        }),
      });
      if (!resp.ok) throw new Error(`Claude review error: ${resp.status}`);
      const data = await resp.json();
      const raw = data.content?.[0]?.text || 'null';
      const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      return JSON.parse(cleaned);
    }
  } catch (e) {
    console.warn('reviewQuestionAgainstDiagram failed:', e.message);
  }
  return null;
}
