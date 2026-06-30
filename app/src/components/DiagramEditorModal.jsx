/**
 * DiagramEditorModal — beta single-engine diagram editor.
 *
 * One surface: the full Konva editor (Sidebar + CanvasEditor2D + PropertiesPanel).
 * All AI generation outputs land here as Konva shapes or Image nodes.
 *
 * AI generation modes (footer toolbar):
 *   ① Shapes  — Claude analyses image / prompt → shapes[] JSON → shapes on canvas
 *   ② TikZ    — Claude generates TikZ code → TikZJax renders → PNG inserted as
 *                rasterImage Konva node. User can then drag / scale / reposition.
 *
 * TikZ drawer: collapsible panel at the bottom showing code editor + live preview.
 * "Insert into canvas" button converts the rendered SVG to PNG and adds it.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Sparkles, Loader, Save, ChevronDown, ChevronUp,
  Key, RotateCcw, Image as ImageIcon, Code, CheckCircle,
  AlertTriangle, PlusSquare, RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { ObjectRegistry } from '../registry/objectRegistry';
import {
  getApiKey, saveApiKey,
  analyseImageForEditing, generateDiagramFromPrompt,
  SHAPE_CATALOGUE,
} from '../services/claudeService';
import {
  getGeminiApiKey, saveGeminiApiKey,
  generateRepairShapesWithGemini,
} from '../services/geminiService';
import { repairDiagramWithRetry, regenerateQuestionText } from '../services/diagramRepairService';
import { generateTikZFromPrompt, analyseImageToTikZ, tikzSvgToPng } from '../services/tikzService';
import { resolveImageUrl, uploadDiagramImage, updateQuestion } from '../services/lmsApiService';
import { computeShapesBoundingBox } from '../utils/canvasUtils';
import Sidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';
import CanvasEditor2D from './CanvasEditor2D';
import TikZRenderer from './MathObjects/TikZRenderer';

// ── Palette ──────────────────────────────────────────────────────────────────

const C = {
  bg:      '#0f172a',
  surface: '#1e293b',
  border:  '#334155',
  muted:   '#64748b',
  text:    '#e2e8f0',
  purple:  '#7c3aed',
  green:   '#059669',
  teal:    '#0d9488',
};

const S = {
  overlay:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9200, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,sans-serif' },
  header:    { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', background: C.bg, borderBottom: `1px solid ${C.border}`, flexShrink: 0 },
  body:      { display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 },
  drawer:    { borderTop: `1px solid ${C.border}`, background: '#080e1a', flexShrink: 0, display: 'flex', flexDirection: 'column' },
  footer:    { display: 'flex', gap: '8px', padding: '8px 14px', background: C.bg, borderTop: `1px solid ${C.border}`, flexShrink: 0, alignItems: 'center' },
  input:     { background: '#0a0f1c', border: `1px solid ${C.border}`, borderRadius: '6px', padding: '6px 10px', color: C.text, fontSize: '12px', outline: 'none', boxSizing: 'border-box' },
  textarea:  { background: '#0a0f1c', border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 10px', color: C.text, fontSize: '12px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.5 },
  btn:       { padding: '6px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' },
  btnPrimary:{ background: C.purple, color: '#fff' },
  btnSuccess:{ background: C.green, color: '#fff' },
  btnTeal:   { background: C.teal, color: '#fff' },
  btnGhost:  { background: 'transparent', color: '#94a3b8', border: `1px solid ${C.border}` },
  tag:       (active, color) => ({
    padding: '4px 10px', borderRadius: '6px', border: `1px solid ${active ? color : C.border}`,
    background: active ? `${color}22` : 'transparent', color: active ? color : C.muted,
    fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
  }),
  label:     { fontSize: '10px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' },
};

// ── Collapsible Question Reference Panel ─────────────────────────────────────

function QuestionReferencePanel({ question, imageUrl, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!expanded) {
    return (
      <div style={{
        width: '40px', background: C.surface, borderLeft: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '14px', gap: '12px', flexShrink: 0
      }}>
        <button
          onClick={() => setExpanded(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
          title="Expand Question Reference"
        >
          <ImageIcon size={18} />
          <span style={{ fontSize: '10px', fontWeight: 700, writingMode: 'vertical-rl', textTransform: 'uppercase', letterSpacing: '0.05em', color: C.muted, marginTop: '8px' }}>
            Question
          </span>
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: '280px', background: C.surface, borderLeft: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question Reference</span>
        <button onClick={() => setExpanded(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }} title="Retract">
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {imageUrl && (
          <div>
            <div style={S.label}>Original Image</div>
            <div style={{ background: '#0a0f1c', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${C.border}`, padding: '4px', marginTop: '6px' }}>
              <img src={imageUrl} alt="original" style={{ width: '100%', objectFit: 'contain', maxHeight: '180px', background: '#fff', borderRadius: '4px' }} />
            </div>
          </div>
        )}

        <div>
          <div style={S.label}>Question Text</div>
          <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5, marginTop: '6px', background: '#0a0f1c', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, whiteSpace: 'pre-wrap' }}>
            {question.text || question.stem || '(No text)'}
          </div>
        </div>

        {((question.correctAnswer || question.distractors) && (
          <div>
            <div style={S.label}>Answer Options</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              {question.correctAnswer && (
                <div style={{ fontSize: '11px', color: '#34d399', background: 'rgba(52,211,153,0.06)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(52,211,153,0.2)' }}>
                  <strong style={{ color: '#34d399', marginRight: '4px' }}>Correct:</strong> {question.correctAnswer.text || String(question.correctAnswer)}
                </div>
              )}
              {question.distractors?.map((dist, idx) => (
                <div key={idx} style={{ fontSize: '11px', color: '#94a3b8', background: '#0a0f1c', padding: '6px 8px', borderRadius: '4px', border: `1px solid ${C.border}` }}>
                  <strong style={{ color: '#f87171', marginRight: '4px' }}>Wrong:</strong> {dist.text || String(dist)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TikZ drawer ──────────────────────────────────────────────────────────────

function TikZDrawer({ tikzCode, setTikzCode, onInsert, inserting }) {
  const [svg, setSvg] = useState(null);

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Code editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px 12px', gap: '8px', borderRight: `1px solid ${C.border}` }}>
        <div style={S.label}>TikZ Source <span style={{ color: '#475569', textTransform: 'none', fontWeight: 400 }}>(edit directly or regenerate with the prompt above)</span></div>
        <textarea
          style={{ ...S.textarea, flex: 1, width: '100%', minHeight: '120px' }}
          value={tikzCode}
          onChange={e => { setTikzCode(e.target.value); setSvg(null); }}
          spellCheck={false}
          placeholder={`\\begin{tikzpicture}\n  \\draw[->] (-3,0) -- (3,0) node[right] {$x$};\n\\end{tikzpicture}`}
        />
        <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
          Uses <code style={{ color: '#60a5fa' }}>tikz, pgfplots, angles, arrows.meta, calc</code> — loaded via WASM on first render (~15 MB CDN, cached).
        </div>
      </div>

      {/* Live preview */}
      <div style={{ width: '380px', display: 'flex', flexDirection: 'column', padding: '10px 12px', gap: '8px', flexShrink: 0 }}>
        <div style={S.label}>Live Preview</div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {tikzCode.trim() ? (
            <TikZRenderer
              code={tikzCode}
              width={340}
              height={220}
              onSvg={s => setSvg(s)}
            />
          ) : (
            <div style={{ color: '#334155', fontSize: '12px', textAlign: 'center' }}>Enter TikZ code to preview</div>
          )}
        </div>
        <button
          style={{ ...S.btn, ...S.btnTeal, justifyContent: 'center', opacity: (!svg || inserting) ? 0.5 : 1 }}
          onClick={() => svg && onInsert(svg)}
          disabled={!svg || inserting}
        >
          {inserting ? <Loader size={13} className="spin" /> : <PlusSquare size={13} />}
          {inserting ? 'Inserting…' : 'Insert into Canvas'}
        </button>
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function DiagramEditorModal({ question, onClose, onSaved, viewMode = false }) {
  const [apiKey, setApiKeyState]   = useState(getApiKey);
  const [aiMode, setAiMode]        = useState('shapes'); // 'shapes' | 'tikz'
  const [prompt, setPrompt]        = useState('');
  const [generating, setGenerating]= useState(false);
  const [genError, setGenError]    = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState(null); // null | 'analysing' | 'done' | 'error'
  const [analysisStatusText, setAnalysisStatusText] = useState('Analysing diagram…');
  const [tikzDrawerOpen, setTikzDrawerOpen] = useState(false);
  const [tikzCode, setTikzCode]    = useState('');
  const [inserting, setInserting]  = useState(false);
  const [originalExpanded, setOriginalExpanded] = useState(true);

  // Konva state
  const [shapes, setShapes]        = useState(() => {
    return question.diagramShapes || question.shapes || [];
  });
  const [selectedId, setSelectedId]= useState(null);
  const [recentlyUsed, setRecentlyUsed] = useState([]);
  const [cropMode, setCropMode] = useState(false);
  const [cropBox, setCropBox] = useState({ x: 50, y: 50, width: 700, height: 500 });

  // Save state
  const [saving, setSaving]        = useState(false);
  const [saveError, setSaveError]  = useState(null);
  const [saved, setSaved]          = useState(false);
  const stageRef = useRef(null);

  // Value mismatch / sync state
  const [valueMismatch, setValueMismatch]     = useState(false); // true when diagram may have different values from question
  const [syncingQuestion, setSyncingQuestion] = useState(false);
  const [syncError, setSyncError]             = useState(null);
  const [syncedQuestion, setSyncedQuestion]   = useState(null);  // updated question text after sync

  const imageUrl = resolveImageUrl(question.image || question.imageUrl || question.imageKey);

  const doSaveKey = k => { setApiKeyState(k); saveApiKey(k); };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const assignIds = useCallback(arr => arr.map((s, i) => ({ ...s, id: s.id || `ai_${Date.now()}_${i}` })), []);

  const loadShapes = useCallback(result => {
    const loaded = assignIds(result.shapes || result.objects || result || []);
    setShapes(loaded);
  }, [assignIds]);

  const renderAndCapture = useCallback(async (newShapes) => {
    setShapes(assignIds(newShapes));
    await new Promise(r => setTimeout(r, 250)); // let React paint
    if (stageRef.current) return stageRef.current.toDataURL({ pixelRatio: 1 });
    throw new Error('Canvas not ready');
  }, [assignIds]);

  // ── AI generation ────────────────────────────────────────────────────────────

  const analyseImage = useCallback(async () => {
    const claudeKey = apiKey || getApiKey();
    const geminiKey = getGeminiApiKey();

    if (!claudeKey && !geminiKey) {
      setAnalysisStatus('no-key');
      return;
    }
    if (!imageUrl) {
      setAnalysisStatus('no-image');
      return;
    }

    setGenerating(true);
    setGenError(null);
    setAnalysisStatus('analysing');
    setAnalysisStatusText('Starting reconstruction pipeline…');

    try {
      const outcome = await repairDiagramWithRetry({
        questionData: question,
        imageUrl,
        userInstructions: prompt,
        apiKey: claudeKey,
        geminiApiKey: geminiKey,
        generationMode: 'konva',
        validationMode: geminiKey ? 'gemini' : 'claude',
        geminiImageModel: 'gemini-3.1-flash-image-preview', // not used
        geminiVisionModel: 'gemini-3.5-flash',
        onProgress: entry => {
          if (entry.stage === 'extracting_values') {
            setAnalysisStatusText('Reading exact values from image (OCR)…');
          } else if (entry.stage === 'analyzing') {
            setAnalysisStatusText('Analysing image layout…');
          } else if (entry.stage === 'generating') {
            setAnalysisStatusText(`Attempt ${entry.attempt}/3 — Reconstructing shapes…`);
          } else if (entry.stage === 'rendering') {
            setAnalysisStatusText(`Attempt ${entry.attempt}/3 — Rendering preview…`);
          } else if (entry.stage === 'validating') {
            setAnalysisStatusText(`Attempt ${entry.attempt}/3 — Checking against checklist…`);
          } else if (entry.stage === 'retry') {
            setAnalysisStatusText(`Attempt ${entry.attempt} failed — retrying with feedback…`);
          }
          if (entry.shapes) {
            setShapes(assignIds(entry.shapes));
          }
        },
        renderAndCapture,
        maxRetries: 3,
        pipelineProvider: geminiKey ? 'gemini' : 'claude',
      });

      if (outcome.shapes) {
        setShapes(assignIds(outcome.shapes));
      }

      if (outcome.success) {
        setAnalysisStatus('done');
        // Detect potential value mismatch between the generated diagram and the original question
        detectValueMismatch(outcome.shapes || [], outcome.analysis);
      } else {
        setGenError(outcome.validation?.feedback || 'Verification failed after 3 attempts');
        setAnalysisStatus('error');
      }
    } catch (e) {
      setGenError(e.message);
      setAnalysisStatus('error');
    } finally {
      setGenerating(false);
    }
  }, [apiKey, imageUrl, prompt, question, renderAndCapture, assignIds]);

  // ── Value mismatch detection ─────────────────────────────────────────────────

  const detectValueMismatch = useCallback((generatedShapes, analysis) => {
    if (!question.text) return; // no question to compare against

    // Extract all numeric-looking tokens and time strings from the question text
    const questionText = question.text || '';
    const questionTokens = new Set([
      ...(questionText.match(/\b\d{1,2}:\d{2}(?:\s*[APap][Mm])?\b/g) || []),  // times like 08:15
      ...(questionText.match(/\b\d+(?:\.\d+)?\b/g) || []),                     // numbers
    ]);

    if (questionTokens.size === 0) return; // no concrete values to compare

    // Extract values from generated shapes (text labels, timeText, times, etc.)
    const shapeText = JSON.stringify(generatedShapes);
    const shapeTokens = new Set([
      ...(shapeText.match(/\b\d{1,2}:\d{2}(?:\s*[APap][Mm])?\b/g) || []),
      ...(shapeText.match(/\b\d+(?:\.\d+)?\b/g) || []),
    ]);

    // Check if any question tokens are MISSING from the shapes
    const criticalMissing = [...questionTokens].filter(tok => {
      if (['0','1','2','3','4','5','6','7','8','9','10'].includes(tok)) return false; // skip trivial single digits
      return !shapeTokens.has(tok);
    });

    if (criticalMissing.length > 0) {
      setValueMismatch(true);
    } else {
      setValueMismatch(false);
    }
  }, [question]);

  // ── Sync Question handler ────────────────────────────────────────────────────

  const handleSyncQuestion = useCallback(async () => {
    const claudeKey = apiKey || getApiKey();
    const geminiKey = getGeminiApiKey();
    if (!claudeKey && !geminiKey) return;

    setSyncingQuestion(true);
    setSyncError(null);

    // Build a diagram description from the current shapes
    const shapesSummary = shapes.map(s => {
      if (s.type === 'departureBoard') return `Departure board titled "${s.title || 'DEPARTURES'}" with times: ${s.times || ''}`;
      if (s.type === 'digitalClock') return `Digital clock showing "${s.timeText || ''}" in ${s.style || 'lcd'} style`;
      if (s.type === 'analogClock') return `Analogue clock at ${s.hours || 0}:${String(s.minutes || 0).padStart(2,'0')}`;
      if (s.type === 'text') return `Text label: "${s.text || ''}"`;
      if (s.label) return `${s.type} labelled "${s.label}"`;
      return s.type;
    }).join('; ');

    const diagramDescription = `The diagram contains: ${shapesSummary}.`;

    try {
      const result = await regenerateQuestionText({
        diagramDescription,
        originalQuestion: question,
        apiKey: claudeKey,
        geminiApiKey: geminiKey,
      });
      setSyncedQuestion(result);
      setValueMismatch(false);
    } catch (e) {
      setSyncError(e.message);
    } finally {
      setSyncingQuestion(false);
    }
  }, [apiKey, shapes, question]);


  // Auto-analyse on open
  useEffect(() => {
    if (viewMode) {
      setAnalysisStatus(null);
      return;
    }
    const claudeKey = apiKey || getApiKey();
    const geminiKey = getGeminiApiKey();
    if ((claudeKey || geminiKey) && imageUrl) {
      analyseImage();
    } else if (!claudeKey && !geminiKey) {
      setAnalysisStatus('no-key');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const handleGenerate = async () => {
    const claudeKey = apiKey || getApiKey();
    const geminiKey = getGeminiApiKey();
    if (!claudeKey && !geminiKey) return;
    const p = prompt.trim();
    setGenerating(true);
    setGenError(null);
    setAnalysisStatus('analysing');

    try {
      if (aiMode === 'shapes') {
        if (!p && imageUrl) {
          await analyseImage();
          return; // analyseImage sets its own status
        } else if (p) {
          const provider = geminiKey ? 'gemini' : 'claude';
          let result;
          if (provider === 'gemini') {
            const systemPrompt = `You are a mathematics diagram generator for primary and middle school.
Recreate a diagram based on the prompt using ONLY the available shape types below:
${SHAPE_CATALOGUE}
Canvas is 800x500 logical pixels. Respond with ONLY valid JSON array of shapes.`;
            result = await generateRepairShapesWithGemini({
              prompt: p,
              systemPrompt,
              apiKey: geminiKey,
              model: 'gemini-3.5-flash'
            });
          } else {
            result = await generateDiagramFromPrompt(p, claudeKey);
          }
          loadShapes(result);
          setAnalysisStatus('done');
        }
      } else {
        // TikZ mode
        let code;
        if (!p && imageUrl) {
          code = await analyseImageToTikZ(imageUrl, claudeKey);
        } else if (p) {
          code = await generateTikZFromPrompt(p, claudeKey);
        }
        if (code) {
          setTikzCode(code);
          setTikzDrawerOpen(true);
          setAnalysisStatus(null);
        }
      }
    } catch (e) {
      setGenError(e.message);
      setAnalysisStatus('error');
    } finally {
      setGenerating(false);
    }
  };

  // ── Insert TikZ SVG as rasterImage Konva node ─────────────────────────────

  const insertTikzAsImage = async (svgString) => {
    setInserting(true);
    try {
      const pngDataUrl = await tikzSvgToPng(svgString, 800, 600);
      const id = `tikz_${Date.now()}`;
      const newShape = {
        id,
        type: 'rasterImage',
        x: 400,
        y: 250,
        src: pngDataUrl,
        width: 400,
        height: 300,
        opacity: 1,
        rotation: 0,
        _source: 'tikz',
      };
      setShapes(prev => [...prev, newShape]);
      setSelectedId(id);
      setTikzDrawerOpen(false);
    } catch (e) {
      setGenError(`TikZ insert failed: ${e.message}`);
    } finally {
      setInserting(false);
    }
  };

  // ── Konva editor helpers ─────────────────────────────────────────────────────

  const addShape = type => {
    const reg = ObjectRegistry[type];
    const id = `shape_${Date.now()}`;
    setShapes(prev => [...prev, { id, type, x: 400, y: 250, ...reg?.defaultProps }]);
    setSelectedId(id);
    setRecentlyUsed(prev => [type, ...prev.filter(t => t !== type)].slice(0, 10));
  };

  const addClipart = item => {
    const id = `clipart_${Date.now()}`;
    setShapes(prev => [...prev, { id, type: 'rasterImage', x: 360, y: 210, src: item.url, width: 80, height: 80, opacity: 1, rotation: 0 }]);
    setSelectedId(id);
  };

  const updateShape = (id, p) =>
    setShapes(prev => prev.map(s => s.id === id ? { ...s, ...p } : s));

  const deleteShape = id => {
    setShapes(prev => prev.filter(s => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const reorderShape = (id, dir) => setShapes(prev => {
    const i = prev.findIndex(s => s.id === id);
    if (i < 0) return prev;
    const a = [...prev];
    if (dir === 'up'   && i > 0)            [a[i - 1], a[i]] = [a[i], a[i - 1]];
    if (dir === 'down' && i < a.length - 1) [a[i], a[i + 1]] = [a[i + 1], a[i]];
    return a;
  });

  // ── Save ──────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!stageRef.current) return;

    if (!cropMode) {
      // Auto-fit crop box to content before showing the overlay
      const auto = computeShapesBoundingBox(shapes, { padding: 24, stageW: 800, stageH: 600 });
      setCropBox(auto);
      setCropMode(true);
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      // Hide crop overlay to prevent blue dashed box from being printed in the final image
      setCropMode(false);
      await new Promise(r => setTimeout(r, 100)); // wait for paint

      const cx = Math.max(0, Math.min(cropBox.x, 800));
      const cy = Math.max(0, Math.min(cropBox.y, 600));
      const cw = Math.max(40, Math.min(cropBox.width, 800 - cx));
      const ch = Math.max(40, Math.min(cropBox.height, 600 - cy));

      const dataUrl = stageRef.current.toDataURL({
        x: cx,
        y: cy,
        width: cw,
        height: ch,
        pixelRatio: 2
      });
      const imagePublicUrl = await uploadDiagramImage(dataUrl, 'diagram-editor/beta');
      const updates = { diagramShapes: shapes, image: imagePublicUrl };
      const updated  = await updateQuestion(question.id, updates);
      onSaved?.(updated || { ...question, ...updates });
      setSaved(true);
    } catch (e) {
      setSaveError(e.message);
      setCropMode(true);
    } finally {
      setSaving(false);
    }
  };

  const selectedShape = shapes.find(s => s.id === selectedId);

  const drawerHeight = tikzDrawerOpen ? 320 : 0;

  return (
    <div style={S.overlay}>

      {/* ── Header ── */}
      <div style={S.header}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', marginRight: '4px' }}>Edit Diagram</span>
        <span style={{ fontSize: '11px', color: C.muted }}>· {question.text?.slice(0, 60) || 'No text'}{question.text?.length > 60 ? '…' : ''}</span>
        
        {/* Portal target for the CanvasEditor2D toolbar */}
        <div id="diagram-canvas-toolbar-portal" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}></div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Key size={11} color={C.muted} />
          <input
            type="password"
            value={apiKey}
            onChange={e => doSaveKey(e.target.value)}
            placeholder="sk-ant-…"
            style={{ ...S.input, width: '190px' }}
          />
          {generating && <Loader size={14} color="#a78bfa" className="spin" />}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '4px' }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Main body: Sidebar + Canvas + Properties ── */}
      <div style={S.body}>

        <Sidebar
          mode="Geometry"
          setMode={() => {}}
          addShape={addShape}
          addClipart={addClipart}
          handleExport={() => {}}
          handleSaveToLibrary={() => {}}
          recentlyUsed={recentlyUsed}
          openAIGenerator={() => {}}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* ── Analysis status banner ── */}
          {analysisStatus && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 14px', flexShrink: 0,
              background:
                analysisStatus === 'error'    ? 'rgba(239,68,68,0.12)' :
                analysisStatus === 'done'     ? 'rgba(5,150,105,0.12)' :
                analysisStatus === 'no-key'   ? 'rgba(245,158,11,0.12)' :
                                                'rgba(124,58,237,0.12)',
              borderBottom: `1px solid ${
                analysisStatus === 'error'    ? '#7f1d1d' :
                analysisStatus === 'done'     ? '#064e3b' :
                analysisStatus === 'no-key'   ? '#78350f' :
                                                '#4c1d95'
              }`,
            }}>
              {analysisStatus === 'analysing' && <Loader size={13} color="#a78bfa" className="spin" />}
              {analysisStatus === 'done'      && <CheckCircle size={13} color="#34d399" />}
              {analysisStatus === 'error'     && <AlertTriangle size={13} color="#f87171" />}
              {analysisStatus === 'no-key'    && <Key size={13} color="#fbbf24" />}

              <span style={{ fontSize: '12px', color:
                analysisStatus === 'error'    ? '#fca5a5' :
                analysisStatus === 'done'     ? '#6ee7b7' :
                analysisStatus === 'no-key'   ? '#fde68a' :
                                                '#c4b5fd',
                flex: 1,
              }}>
                {analysisStatus === 'analysing' && analysisStatusText}
                {analysisStatus === 'done'      && `Analysis complete — ${shapes.length} shape${shapes.length !== 1 ? 's' : ''} placed on canvas`}
                {analysisStatus === 'error'     && `Analysis failed: ${genError}`}
                {analysisStatus === 'no-key'    && 'No API key — paste your sk-ant-… key in the header or save a Gemini key in settings, then click Re-analyse'}
              </span>

              {(analysisStatus === 'error' || analysisStatus === 'no-key') && (apiKey || getGeminiApiKey()) && (
                <button
                  style={{ ...S.btn, background: 'rgba(124,58,237,0.3)', color: '#c4b5fd', border: '1px solid #4c1d95', padding: '3px 10px', fontSize: '11px' }}
                  onClick={analyseImage}
                  disabled={generating}
                >
                  <RotateCcw size={11} /> Retry
                </button>
              )}


              <button
                onClick={() => setAnalysisStatus(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '0 2px', lineHeight: 1 }}
                title="Dismiss"
              >×</button>
            </div>
          )}

          {cropMode && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 14px', flexShrink: 0,
              background: 'rgba(59,130,246,0.12)',
              borderBottom: '1px solid #1d4ed8'
            }}>
              <span style={{ fontSize: '12px', color: '#93c5fd', flex: 1 }}>
                <strong>Crop Mode Active:</strong> Adjust the blue dashed rectangle on the canvas to define the final cropped area to save.
              </span>
              <button
                onClick={() => setCropMode(false)}
                style={{ ...S.btn, background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid #991b1b', padding: '2px 8px', fontSize: '11px' }}
              >
                Cancel Crop
              </button>
            </div>
          )}

            <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
              
              {/* ── Side-by-side Original Image Panel ── */}
              {imageUrl && (
                <div style={{
                  width: originalExpanded ? '33.33%' : '40px',
                  borderRight: `1px solid ${C.border}`,
                  background: C.surface,
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'width 0.2s ease',
                  flexShrink: 0,
                  overflow: 'hidden'
                }}>
                  {/* Header bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: originalExpanded ? 'space-between' : 'center', padding: '10px 8px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
                    {originalExpanded && <span style={{ fontSize: '11px', fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}><ImageIcon size={12} style={{marginRight: 6, verticalAlign:'-2px'}}/> Original Image</span>}
                    <button onClick={() => setOriginalExpanded(!originalExpanded)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 2 }} title={originalExpanded ? "Collapse" : "Expand Original"}>
                      {originalExpanded ? <ChevronLeft size={16} /> : <ImageIcon size={16} />}
                    </button>
                  </div>
                  
                  {/* Image Content */}
                  {originalExpanded && (
                    <div style={{ flex: 1, padding: '12px', overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
                      <img src={imageUrl} alt="original" style={{ maxWidth: '100%', objectFit: 'contain', background: '#fff', borderRadius: '4px', border: `1px solid ${C.border}`, alignSelf: 'flex-start' }} />
                    </div>
                  )}
                  {!originalExpanded && (
                    <div style={{ padding: '14px 0', display: 'flex', justifyContent: 'center' }}>
                       <span style={{ fontSize: '10px', fontWeight: 700, writingMode: 'vertical-rl', textTransform: 'uppercase', letterSpacing: '0.05em', color: C.muted }}>Original</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Canvas Editor ── */}
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <CanvasEditor2D
                  shapes={shapes}
                  setShapes={setShapes}
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                  stageRef={stageRef}
                  showGrid={true}
                  showNumberedGrid={true}
                  isExporting={saving}
                  cropMode={cropMode}
                  cropBox={cropBox}
                  setCropBox={setCropBox}
                  toolbarPortalId="diagram-canvas-toolbar-portal"
                />

                {/* Large centre overlay when canvas is empty and analysing */}
                {shapes.length === 0 && generating && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '10px',
                    pointerEvents: 'none',
                  }}>
                    <Loader size={32} color="#7c3aed" className="spin" />
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>{analysisStatusText}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

        <PropertiesPanel
          selectedShape={selectedShape}
          updateShape={updateShape}
          deleteShape={deleteShape}
          reorderShape={reorderShape}
          mode="2D"
          openIconPicker={() => {}}
          allShapes={shapes}
        />

        <QuestionReferencePanel
          question={question}
          imageUrl={imageUrl}
          defaultExpanded={viewMode}
        />
      </div>


      {/* ── TikZ drawer (collapsible) ── */}
      {tikzDrawerOpen && (
        <div style={{ ...S.drawer, height: drawerHeight }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <Code size={13} color="#0d9488" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0d9488' }}>TikZ Generator</span>
            <span style={{ fontSize: '11px', color: C.muted, marginLeft: '4px' }}>Output renders as a moveable image node on the canvas</span>
            <button onClick={() => setTikzDrawerOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}>
              <X size={14} />
            </button>
          </div>
          <TikZDrawer
            tikzCode={tikzCode}
            setTikzCode={setTikzCode}
            onInsert={insertTikzAsImage}
            inserting={inserting}
          />
        </div>
      )}

      {/* ── Value Mismatch Warning Banner ── */}
      {valueMismatch && !syncedQuestion && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '8px 14px', flexShrink: 0,
          background: 'rgba(217,119,6,0.12)', borderTop: '1px solid rgba(217,119,6,0.4)',
        }}>
          <AlertTriangle size={15} color="#f59e0b" />
          <span style={{ fontSize: '12px', color: '#fbbf24', flex: 1 }}>
            <strong style={{ color: '#f59e0b' }}>⚠ Possible value mismatch</strong> — the diagram may show different values than the original question. Click <em>Sync Question</em> to regenerate the question text, correct answer, and distractors to match the diagram.
          </span>
          <button
            style={{ ...S.btn, background: 'rgba(217,119,6,0.3)', color: '#fbbf24', border: '1px solid rgba(217,119,6,0.5)', opacity: syncingQuestion ? 0.6 : 1 }}
            onClick={handleSyncQuestion}
            disabled={syncingQuestion}
          >
            {syncingQuestion ? <Loader size={13} className="spin" /> : <RefreshCw size={13} />}
            {syncingQuestion ? 'Syncing…' : '⚠ Sync Question'}
          </button>
          {syncError && <span style={{ fontSize: '11px', color: '#f87171' }}>{syncError}</span>}
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
            onClick={() => setValueMismatch(false)}
            title="Dismiss warning"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Synced Question Result Panel ── */}
      {syncedQuestion && (
        <div style={{
          padding: '10px 14px', flexShrink: 0,
          background: 'rgba(5,150,105,0.10)', borderTop: '1px solid rgba(5,150,105,0.35)',
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={14} color="#34d399" />
            <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 700 }}>Question synced to diagram values</span>
            <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }} onClick={() => setSyncedQuestion(null)}>
              <X size={13} />
            </button>
          </div>
          <div style={{ fontSize: '12px', color: '#e2e8f0', background: '#0a0f1c', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${C.border}` }}>
            <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>New Question</div>
            {syncedQuestion.question}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '11px', color: '#34d399', background: 'rgba(52,211,153,0.08)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(52,211,153,0.25)' }}>
              ✓ {syncedQuestion.correctAnswer}
            </div>
            {(syncedQuestion.distractors || []).map((d, i) => (
              <div key={i} style={{ fontSize: '11px', color: '#94a3b8', background: '#0a0f1c', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${C.border}` }}>
                ✗ {d}
              </div>
            ))}
          </div>
          <button
            style={{ ...S.btn, background: 'rgba(5,150,105,0.3)', color: '#34d399', border: '1px solid rgba(5,150,105,0.4)', alignSelf: 'flex-start', fontSize: '11px' }}
            onClick={() => { navigator.clipboard?.writeText(JSON.stringify(syncedQuestion, null, 2)); }}
          >
            Copy as JSON
          </button>
        </div>
      )}

      {/* ── Footer: AI prompt bar + save ── */}
      <div style={S.footer}>

        {/* Mode toggle */}
        <button style={S.tag(aiMode === 'shapes', '#7c3aed')} onClick={() => setAiMode('shapes')}>
          <Sparkles size={11} /> Shapes
        </button>
        <button
          style={S.tag(aiMode === 'tikz', '#0d9488')}
          onClick={() => { setAiMode('tikz'); if (!tikzDrawerOpen) setTikzDrawerOpen(true); }}
        >
          <Code size={11} /> TikZ
        </button>

        {/* Prompt input */}
        <input
          style={{ ...S.input, flex: 1, maxWidth: '460px' }}
          placeholder={aiMode === 'shapes'
            ? 'Describe diagram… or leave blank to re-analyse original image'
            : 'Describe diagram for TikZ… or leave blank to convert original image'}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
        />

        <button
          style={{ ...S.btn, ...(aiMode === 'tikz' ? S.btnTeal : S.btnPrimary), opacity: generating || !apiKey ? 0.5 : 1 }}
          onClick={handleGenerate}
          disabled={generating || !apiKey}
        >
          {generating ? <Loader size={13} className="spin" /> : <Sparkles size={13} />}
          {generating ? 'Generating…' : 'Generate'}
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '22px', background: C.border }} />

        {/* TikZ drawer toggle */}
        <button
          style={{ ...S.btn, ...S.btnGhost, padding: '5px 10px', color: tikzDrawerOpen ? '#0d9488' : undefined }}
          onClick={() => setTikzDrawerOpen(o => !o)}
          title="Toggle TikZ editor"
        >
          <Code size={13} />
          {tikzDrawerOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>

        {/* Re-analyse button */}
        {imageUrl && (
          <button
            style={{ ...S.btn, ...S.btnGhost, padding: '5px 10px', fontSize: '11px' }}
            onClick={analyseImage}
            disabled={generating}
            title="Re-analyse original image → shapes"
          >
            <RotateCcw size={12} /> Re-analyse
          </button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {genError && (
            <span style={{ fontSize: '11px', color: '#f87171', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={genError}>
              <AlertTriangle size={11} style={{ display: 'inline', marginRight: '4px' }} />{genError}
            </span>
          )}
          {saveError && <span style={{ fontSize: '11px', color: '#f87171' }}>{saveError}</span>}
          {saved && <span style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Saved</span>}
          <span style={{ fontSize: '11px', color: '#334155' }}>{shapes.length} shape{shapes.length !== 1 ? 's' : ''}</span>
          <button
            style={{ ...S.btn, ...S.btnSuccess, opacity: saving ? 0.5 : 1 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader size={13} className="spin" /> : <Save size={13} />}
            {saving ? 'Saving…' : cropMode ? 'Confirm Crop & Save' : 'Save to DB'}
          </button>
          <button style={{ ...S.btn, ...S.btnGhost }} onClick={onClose}>Close</button>
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
