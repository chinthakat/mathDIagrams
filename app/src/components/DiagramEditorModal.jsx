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
  AlertTriangle, PlusSquare,
} from 'lucide-react';
import { ObjectRegistry } from '../registry/objectRegistry';
import {
  getApiKey, saveApiKey,
  analyseImageForEditing, generateDiagramFromPrompt,
} from '../services/claudeService';
import {
  generateTikZFromPrompt, analyseImageToTikZ, tikzSvgToPng,
} from '../services/tikzService';
import { resolveImageUrl, uploadDiagramImage, updateQuestion } from '../services/lmsApiService';
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

// ── Floating original-image reference ────────────────────────────────────────

function ImageRef({ imageUrl }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{
      position: 'absolute', top: 10, right: 10, zIndex: 20,
      background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px',
      overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,.5)',
      width: open ? '160px' : '34px', transition: 'width .2s',
    }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', padding: '5px 8px', background: C.surface, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8' }}>
        <ImageIcon size={12} />
        {open && <span style={{ fontSize: '10px', fontWeight: 700 }}>Original</span>}
      </button>
      {open && (
        <div style={{ padding: '5px' }}>
          <img src={imageUrl} alt="original" style={{ width: '100%', borderRadius: '3px', objectFit: 'contain', maxHeight: '120px', background: '#fff' }} />
        </div>
      )}
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

export default function DiagramEditorModal({ question, onClose, onSaved }) {
  const [apiKey, setApiKeyState]   = useState(getApiKey);
  const [aiMode, setAiMode]        = useState('shapes'); // 'shapes' | 'tikz'
  const [prompt, setPrompt]        = useState('');
  const [generating, setGenerating]= useState(false);
  const [genError, setGenError]    = useState(null);
  const [tikzDrawerOpen, setTikzDrawerOpen] = useState(false);
  const [tikzCode, setTikzCode]    = useState('');
  const [inserting, setInserting]  = useState(false);

  // Konva state
  const [shapes, setShapes]        = useState([]);
  const [selectedId, setSelectedId]= useState(null);
  const [recentlyUsed, setRecentlyUsed] = useState([]);

  // Save state
  const [saving, setSaving]        = useState(false);
  const [saveError, setSaveError]  = useState(null);
  const [saved, setSaved]          = useState(false);
  const stageRef = useRef(null);

  const imageUrl = resolveImageUrl(question.image || question.imageUrl || question.imageKey);

  const doSaveKey = k => { setApiKeyState(k); saveApiKey(k); };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const assignIds = arr => arr.map((s, i) => ({ ...s, id: s.id || `ai_${Date.now()}_${i}` }));

  const loadShapes = useCallback(result => {
    const loaded = assignIds(result.shapes || result.objects || []);
    setShapes(loaded);
  }, []);

  // ── AI generation ────────────────────────────────────────────────────────────

  const analyseImage = useCallback(async () => {
    if (!apiKey || !imageUrl) return;
    setGenerating(true);
    setGenError(null);
    try {
      const result = await analyseImageForEditing(imageUrl, apiKey);
      loadShapes(result);
    } catch (e) {
      setGenError(e.message);
    } finally {
      setGenerating(false);
    }
  }, [apiKey, imageUrl, loadShapes]);

  // Auto-analyse on open
  useEffect(() => {
    if (apiKey && imageUrl) analyseImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    if (!apiKey) return;
    const p = prompt.trim();
    setGenerating(true);
    setGenError(null);

    try {
      if (aiMode === 'shapes') {
        // If no prompt, re-analyse the image; otherwise generate from prompt
        if (!p && imageUrl) {
          await analyseImage();
        } else if (p) {
          const result = await generateDiagramFromPrompt(p, apiKey);
          loadShapes(result);
        }
      } else {
        // TikZ mode
        let code;
        if (!p && imageUrl) {
          code = await analyseImageToTikZ(imageUrl, apiKey);
        } else if (p) {
          code = await generateTikZFromPrompt(p, apiKey);
        }
        if (code) {
          setTikzCode(code);
          setTikzDrawerOpen(true);
        }
      }
    } catch (e) {
      setGenError(e.message);
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
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
      const imagePublicUrl = await uploadDiagramImage(dataUrl, 'diagram-editor/beta');
      const updates = { diagramShapes: shapes, image: imagePublicUrl };
      const updated  = await updateQuestion(question.id, updates);
      onSaved?.(updated || { ...question, ...updates });
      setSaved(true);
    } catch (e) {
      setSaveError(e.message);
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
          handleExport={() => {}}
          handleSaveToLibrary={() => {}}
          recentlyUsed={recentlyUsed}
          openAIGenerator={() => {}}
        />

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <CanvasEditor2D
            shapes={shapes}
            setShapes={setShapes}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            stageRef={stageRef}
            showGrid={false}
          />
          {imageUrl && <ImageRef imageUrl={imageUrl} />}
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
            {saving ? 'Saving…' : 'Save to DB'}
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
