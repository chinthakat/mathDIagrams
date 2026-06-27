/**
 * DiagramEngineModal — unified multi-engine diagram editor.
 *
 * Three rendering engines, one interface:
 *
 *  ① KONVA   — drag-and-drop Konva canvas with all existing shape library
 *  ② JSXGRAPH — mathematically-precise interactive geometry (points, lines,
 *                circles, function graphs, angles, etc.)  powered by JSXGraph
 *  ③ TIKZ    — AI-generated LaTeX/TikZ code compiled in-browser via
 *               TikZJax WASM CDN → pixel-perfect SVG output
 *
 * AI generation is available in all three modes:
 *  - Konva   → Claude generates shapes[] JSON  (existing pipeline)
 *  - JSXGraph → Claude generates BoardConfig JSON
 *  - TikZ    → Claude generates \\begin{tikzpicture}...\\end{tikzpicture}
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Sparkles, Loader, Save, Edit3, AlertTriangle, ChevronDown,
  ChevronRight, Key, RotateCcw, Image as ImageIcon, Code, Box,
  Triangle, Cpu, CheckCircle, Copy,
} from 'lucide-react';
import { ObjectRegistry } from '../registry/objectRegistry';
import { getApiKey, saveApiKey, analyseImageForEditing, generateDiagramFromPrompt } from '../services/claudeService';
import { generateJSXGraphFromPrompt, analyseImageToJSXGraph } from '../services/jsxgraphService';
import { generateTikZFromPrompt, analyseImageToTikZ, tikzSvgToPng } from '../services/tikzService';
import { resolveImageUrl, uploadDiagramImage, updateQuestion } from '../services/lmsApiService';
import Sidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';
import CanvasEditor2D from './CanvasEditor2D';
import JSXGraphBoard from './MathObjects/JSXGraphBoard';
import TikZRenderer from './MathObjects/TikZRenderer';

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9200, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' },
  header:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#0f172a', borderBottom: '1px solid #1e293b', flexShrink: 0 },
  engineBar:  { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#0c1220', borderBottom: '1px solid #1e293b', flexShrink: 0 },
  body:       { display: 'flex', flex: 1, overflow: 'hidden' },
  left:       { width: '260px', background: '#0f172a', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 },
  center:     { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' },
  right:      { width: '240px', background: '#0f172a', borderLeft: '1px solid #1e293b', overflowY: 'auto', flexShrink: 0 },
  footer:     { display: 'flex', gap: '8px', padding: '9px 16px', background: '#0f172a', borderTop: '1px solid #1e293b', flexShrink: 0, alignItems: 'center' },
  canvasArea: { flex: 1, background: '#0c1220', overflow: 'auto', position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', padding: '20px' },
  aiPane:     { padding: '12px', borderTop: '1px solid #1e293b', flexShrink: 0, background: '#0a0f1c' },
  input:      { width: '100%', background: '#0a0f1c', border: '1px solid #334155', borderRadius: '6px', padding: '7px 10px', color: '#e2e8f0', fontSize: '12px', outline: 'none', boxSizing: 'border-box' },
  textarea:   { width: '100%', background: '#0a0f1c', border: '1px solid #334155', borderRadius: '6px', padding: '8px 10px', color: '#e2e8f0', fontSize: '12px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: '80px', fontFamily: 'monospace', lineHeight: 1.5 },
  label:      { fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' },
  btn:        { padding: '7px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' },
  btnPrimary: { background: '#7c3aed', color: '#fff' },
  btnSuccess: { background: '#059669', color: '#fff' },
  btnGhost:   { background: 'transparent', color: '#94a3b8', border: '1px solid #334155' },
  btnEngine: (active, color) => ({
    padding: '5px 12px', borderRadius: '6px', border: `1px solid ${active ? color : '#334155'}`,
    cursor: 'pointer', fontSize: '12px', fontWeight: 700,
    background: active ? `${color}22` : 'transparent',
    color: active ? color : '#64748b',
    display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s',
  }),
  coveragePill: (pct) => ({
    display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '12px',
    fontSize: '10px', fontWeight: 700,
    background: pct >= 80 ? '#064e3b' : pct >= 50 ? '#451a03' : '#450a0a',
    color: pct >= 80 ? '#34d399' : pct >= 50 ? '#f59e0b' : '#f87171',
  }),
};

const ENGINES = [
  { id: 'konva',    label: 'Konva',    icon: Box,      color: '#7c3aed', desc: 'Drag-and-drop canvas editor with full shape library' },
  { id: 'jsxgraph', label: 'JSXGraph', icon: Triangle, color: '#0ea5e9', desc: 'Interactive mathematical geometry — points, lines, circles, function plots' },
  { id: 'tikz',    label: 'TikZ',     icon: Code,     color: '#10b981', desc: 'LaTeX/TikZ precision rendering via WASM — pixel-perfect static diagrams' },
];

// ── Floating original image reference ─────────────────────────────────────────
function ImageRef({ imageUrl }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 20, background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,.5)', width: open ? '170px' : '36px', transition: 'width .2s' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', padding: '5px 8px', background: '#1e293b', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8' }}>
        <ImageIcon size={12} />
        {open && <span style={{ fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap' }}>Original</span>}
      </button>
      {open && <div style={{ padding: '5px' }}>
        <img src={imageUrl} alt="original" style={{ width: '100%', borderRadius: '3px', objectFit: 'contain', maxHeight: '120px', background: '#fff' }} />
      </div>}
    </div>
  );
}

// ── TikZ code editor panel ─────────────────────────────────────────────────────
function TikZEditor({ code, setCode, onGenerate, onAnalyse, generating, imageUrl, apiKey }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', height: '100%', overflowY: 'auto' }}>
      <div style={S.label}>TikZ Source Code</div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {imageUrl && (
          <button style={{ ...S.btn, ...S.btnGhost, padding: '4px 8px', fontSize: '11px' }} onClick={onAnalyse} disabled={generating}>
            {generating ? <Loader size={11} className="spin" /> : <Sparkles size={11} />}
            {generating ? 'Generating…' : 'From Image'}
          </button>
        )}
        <button style={{ ...S.btn, ...S.btnGhost, padding: '4px 8px', fontSize: '11px' }} onClick={copy}>
          {copied ? <CheckCircle size={11} color="#34d399" /> : <Copy size={11} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <textarea
        style={{ ...S.textarea, flex: 1, minHeight: '200px' }}
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder={`\\begin{tikzpicture}\n  \\draw[->] (-3,0) -- (3,0) node[right] {$x$};\n  % ...\n\\end{tikzpicture}`}
        spellCheck={false}
      />
      <p style={{ fontSize: '11px', color: '#475569', margin: 0, lineHeight: 1.5 }}>
        Edit TikZ code directly or use "From Image" to let Claude analyse the original diagram. The WASM engine compiles it to SVG in-browser.
      </p>
    </div>
  );
}

// ── JSXGraph config editor panel ───────────────────────────────────────────────
function JSXGraphEditor({ config, setConfig, onGenerate, onAnalyse, generating, imageUrl }) {
  const [text, setText] = useState(() => config ? JSON.stringify(config, null, 2) : '');
  const [parseErr, setParseErr] = useState(null);

  const apply = () => {
    try {
      const parsed = JSON.parse(text);
      setConfig(parsed);
      setParseErr(null);
    } catch (e) {
      setParseErr(e.message);
    }
  };

  useEffect(() => {
    if (config) setText(JSON.stringify(config, null, 2));
  }, [config]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', height: '100%', overflowY: 'auto' }}>
      <div style={S.label}>JSXGraph Board Config (JSON)</div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {imageUrl && (
          <button style={{ ...S.btn, ...S.btnGhost, padding: '4px 8px', fontSize: '11px' }} onClick={onAnalyse} disabled={generating}>
            {generating ? <Loader size={11} className="spin" /> : <Sparkles size={11} />}
            {generating ? 'Generating…' : 'From Image'}
          </button>
        )}
        <button style={{ ...S.btn, background: '#0ea5e922', color: '#0ea5e9', border: '1px solid #0ea5e966', padding: '4px 8px', fontSize: '11px' }} onClick={apply}>
          Apply
        </button>
      </div>
      <textarea
        style={{ ...S.textarea, flex: 1, minHeight: '200px' }}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder='{\n  "boundingBox": [-5,5,5,-5],\n  "axis": true,\n  "elements": []\n}'
        spellCheck={false}
      />
      {parseErr && <div style={{ fontSize: '11px', color: '#f87171' }}>JSON error: {parseErr}</div>}
    </div>
  );
}

// ── AI prompt bar (all engines) ────────────────────────────────────────────────
function AIPromptBar({ engine, onGenerate, generating, imageUrl, apiKey }) {
  const [prompt, setPrompt] = useState('');
  const submit = () => { if (prompt.trim()) { onGenerate(prompt); setPrompt(''); } };
  const placeholder = {
    konva: 'e.g. "four ants on dotted paths to a sugar cube"',
    jsxgraph: 'e.g. "right-angled triangle with angle labels and hypotenuse"',
    tikz: 'e.g. "number line from 0 to 10 with jump of 3 marked"',
  }[engine];

  return (
    <div style={S.aiPane}>
      <div style={S.label}>AI Generate ({engine.toUpperCase()})</div>
      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
        <input
          style={{ ...S.input, flex: 1 }}
          placeholder={placeholder}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        <button style={{ ...S.btn, ...S.btnPrimary, padding: '6px 10px' }} onClick={submit} disabled={generating || !prompt.trim() || !apiKey}>
          {generating ? <Loader size={13} className="spin" /> : <Sparkles size={13} />}
        </button>
      </div>
    </div>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────────
export default function DiagramEngineModal({ question, onClose, onSaved }) {
  const [apiKey, setApiKeyState] = useState(getApiKey);
  const [engine, setEngine] = useState('konva');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Konva state
  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [recentlyUsed, setRecentlyUsed] = useState([]);
  const stageRef = useRef(null);

  // JSXGraph state
  const [jsxConfig, setJsxConfig] = useState(null);

  // TikZ state
  const [tikzCode, setTikzCode] = useState('');
  const [tikzSvg, setTikzSvg] = useState(null);

  const imageUrl = resolveImageUrl(question.image || question.imageUrl || question.imageKey);

  const doSaveApiKey = (k) => { setApiKeyState(k); saveApiKey(k); };

  // ── AI generation ───────────────────────────────────────────────────────────

  const generate = useCallback(async (prompt) => {
    if (!apiKey) return;
    setGenerating(true);
    setGenError(null);
    try {
      if (engine === 'konva') {
        const result = await generateDiagramFromPrompt(prompt, apiKey);
        const newShapes = (result.objects || []).map((s, i) => ({
          ...s, id: `ai_${Date.now()}_${i}`,
        }));
        setShapes(prev => [...prev, ...newShapes]);
      } else if (engine === 'jsxgraph') {
        const config = await generateJSXGraphFromPrompt(prompt, apiKey);
        setJsxConfig(config);
      } else if (engine === 'tikz') {
        const code = await generateTikZFromPrompt(prompt, apiKey);
        setTikzCode(code);
      }
    } catch (e) {
      setGenError(e.message);
    } finally {
      setGenerating(false);
    }
  }, [engine, apiKey]);

  const analyseFromImage = useCallback(async () => {
    if (!apiKey || !imageUrl) return;
    setGenerating(true);
    setGenError(null);
    try {
      if (engine === 'konva') {
        const result = await analyseImageForEditing(imageUrl, apiKey);
        const newShapes = (result.shapes || []).map((s, i) => ({ ...s, id: s.id || `ai_${Date.now()}_${i}` }));
        setShapes(newShapes);
      } else if (engine === 'jsxgraph') {
        const config = await analyseImageToJSXGraph(imageUrl, apiKey);
        setJsxConfig(config);
      } else if (engine === 'tikz') {
        const code = await analyseImageToTikZ(imageUrl, apiKey);
        setTikzCode(code);
      }
    } catch (e) {
      setGenError(e.message);
    } finally {
      setGenerating(false);
    }
  }, [engine, apiKey, imageUrl]);

  // Auto-analyse on open (Konva only, has reliable path)
  useEffect(() => {
    if (apiKey && imageUrl && engine === 'konva') analyseFromImage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Editor helpers (Konva) ──────────────────────────────────────────────────

  const addShape = (type) => {
    const reg = ObjectRegistry[type];
    const id = `shape_${Date.now()}`;
    setShapes(prev => [...prev, { id, type, x: 400, y: 250, ...reg?.defaultProps }]);
    setSelectedId(id);
    setRecentlyUsed(prev => [type, ...prev.filter(t => t !== type)].slice(0, 10));
  };

  const updateShape = (id, p) => setShapes(prev => prev.map(s => s.id === id ? { ...s, ...p } : s));
  const deleteShape = (id) => { setShapes(prev => prev.filter(s => s.id !== id)); if (selectedId === id) setSelectedId(null); };
  const reorderShape = (id, dir) => setShapes(prev => {
    const i = prev.findIndex(s => s.id === id);
    if (i < 0) return prev;
    const a = [...prev];
    if (dir === 'up' && i > 0) [a[i - 1], a[i]] = [a[i], a[i - 1]];
    if (dir === 'down' && i < a.length - 1) [a[i], a[i + 1]] = [a[i + 1], a[i]];
    return a;
  });

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      let dataUrl = null;
      if (engine === 'konva' && stageRef.current) {
        dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
      } else if (engine === 'tikz' && tikzSvg) {
        dataUrl = await tikzSvgToPng(tikzSvg, 1600, 1200);
      } else if (engine === 'jsxgraph') {
        // JSXGraph export handled via board.renderer
        // For now, use html2canvas-style approach on the JSXGraph div
        alert('JSXGraph export: right-click the board and use "Export PNG" button, or switch to TikZ for save.');
        setSaving(false);
        return;
      }

      if (!dataUrl) { setSaveError('Nothing to save.'); setSaving(false); return; }

      const imagePublicUrl = await uploadDiagramImage(dataUrl, `diagram-editor/${engine}`);
      const updates = {
        image: imagePublicUrl,
        ...(engine === 'konva' ? { diagramShapes: shapes } : {}),
        ...(engine === 'tikz' ? { tikzCode } : {}),
        ...(engine === 'jsxgraph' ? { jsxgraphConfig: jsxConfig } : {}),
      };
      const updated = await updateQuestion(question.id, updates);
      onSaved?.(updated || { ...question, ...updates });
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedShape = shapes.find(s => s.id === selectedId);
  const currentEngine = ENGINES.find(e => e.id === engine);

  return (
    <div style={S.overlay}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={15} color="#a78bfa" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>Diagram Engine Editor</span>
          <span style={{ fontSize: '11px', color: '#475569' }}>·</span>
          <span style={{ fontSize: '12px', color: currentEngine?.color }}>{currentEngine?.desc}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Key size={10} color="#475569" />
            <input
              type="password"
              value={apiKey}
              onChange={e => doSaveApiKey(e.target.value)}
              placeholder="sk-ant-…"
              style={{ ...S.input, width: '180px' }}
            />
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Engine selector bar */}
      <div style={S.engineBar}>
        <span style={{ fontSize: '11px', color: '#475569', fontWeight: 700, marginRight: '4px' }}>ENGINE:</span>
        {ENGINES.map(eng => {
          const Icon = eng.icon;
          return (
            <button
              key={eng.id}
              style={S.btnEngine(engine === eng.id, eng.color)}
              onClick={() => setEngine(eng.id)}
            >
              <Icon size={13} />
              {eng.label}
            </button>
          );
        })}
        {imageUrl && (
          <>
            <div style={{ flex: 1 }} />
            <button
              style={{ ...S.btn, background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', padding: '4px 10px', fontSize: '11px' }}
              onClick={analyseFromImage}
              disabled={generating || !apiKey}
            >
              {generating ? <Loader size={11} className="spin" /> : <Sparkles size={11} />}
              Analyse original image
            </button>
          </>
        )}
      </div>

      {/* Body */}
      <div style={S.body}>

        {/* ── Left panel: engine-specific controls ── */}
        <div style={S.left}>
          {engine === 'konva' && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <Sidebar
                mode="Geometry"
                setMode={() => {}}
                addShape={addShape}
                handleExport={() => {}}
                handleSaveToLibrary={() => {}}
                recentlyUsed={recentlyUsed}
                openAIGenerator={() => {}}
              />
            </div>
          )}
          {engine === 'jsxgraph' && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <JSXGraphEditor
                config={jsxConfig}
                setConfig={setJsxConfig}
                generating={generating}
                imageUrl={imageUrl}
                apiKey={apiKey}
                onAnalyse={analyseFromImage}
              />
            </div>
          )}
          {engine === 'tikz' && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <TikZEditor
                code={tikzCode}
                setCode={setTikzCode}
                generating={generating}
                imageUrl={imageUrl}
                apiKey={apiKey}
                onAnalyse={analyseFromImage}
              />
            </div>
          )}

          {/* AI prompt bar */}
          <AIPromptBar
            engine={engine}
            onGenerate={generate}
            generating={generating}
            imageUrl={imageUrl}
            apiKey={apiKey}
          />
        </div>

        {/* ── Centre: canvas ── */}
        <div style={S.center}>
          <div style={S.canvasArea}>
            {engine === 'konva' && (
              <div style={{ position: 'relative', flex: 1, width: '100%', height: '100%' }}>
                <CanvasEditor2D
                  shapes={shapes}
                  setShapes={setShapes}
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                  stageRef={stageRef}
                  showGrid={false}
                />
              </div>
            )}

            {engine === 'jsxgraph' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', width: '100%' }}>
                {jsxConfig ? (
                  <JSXGraphBoard
                    config={jsxConfig}
                    width={640}
                    height={480}
                    interactive={true}
                    style={{ boxShadow: '0 4px 20px rgba(0,0,0,.4)' }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '640px', height: '480px', background: '#1e293b', borderRadius: '8px', gap: '12px', color: '#475569' }}>
                    <Triangle size={36} />
                    <span style={{ fontSize: '14px' }}>Enter a prompt or analyse the original image to generate a JSXGraph board</span>
                  </div>
                )}
              </div>
            )}

            {engine === 'tikz' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', width: '100%' }}>
                <TikZRenderer
                  code={tikzCode}
                  width={640}
                  height={480}
                  onSvg={svg => setTikzSvg(svg)}
                  style={{ boxShadow: '0 4px 20px rgba(0,0,0,.4)' }}
                />
              </div>
            )}

            {/* Floating original image */}
            {imageUrl && <ImageRef imageUrl={imageUrl} />}
          </div>

          {/* Error bar */}
          {genError && (
            <div style={{ padding: '8px 14px', background: '#450a0a', borderTop: '1px solid #7f1d1d', color: '#f87171', fontSize: '12px', flexShrink: 0 }}>
              AI error: {genError}
            </div>
          )}
        </div>

        {/* ── Right panel: properties (Konva only) ── */}
        {engine === 'konva' && (
          <div style={S.right}>
            <PropertiesPanel
              selectedShape={selectedShape}
              updateShape={updateShape}
              deleteShape={deleteShape}
              reorderShape={reorderShape}
              mode="2D"
              openIconPicker={() => {}}
            />
          </div>
        )}

        {/* JSXGraph info panel */}
        {engine === 'jsxgraph' && (
          <div style={{ ...S.right, padding: '14px', fontSize: '12px', color: '#64748b', lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, color: '#0ea5e9', marginBottom: '8px', fontSize: '13px' }}>JSXGraph</div>
            <p style={{ margin: '0 0 10px' }}>Mathematical precision engine. Elements are interactive — drag points to see constraints update live.</p>
            <div style={{ fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Supported elements:</div>
            {['point', 'segment', 'line', 'arrow', 'circle', 'polygon', 'angle', 'functiongraph', 'text', 'rightangle', 'midpoint', 'parallel', 'perpendicular'].map(t => (
              <div key={t} style={{ padding: '2px 0', color: '#475569' }}>• {t}</div>
            ))}
          </div>
        )}

        {/* TikZ info panel */}
        {engine === 'tikz' && (
          <div style={{ ...S.right, padding: '14px', fontSize: '12px', color: '#64748b', lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '8px', fontSize: '13px' }}>TikZJax</div>
            <p style={{ margin: '0 0 10px' }}>LaTeX/TikZ compiled to SVG in-browser via WebAssembly. Pixel-perfect output for any mathematical diagram.</p>
            <div style={{ fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Libraries loaded:</div>
            {['tikz', 'pgfplots', 'amsmath', 'angles', 'arrows.meta', 'decorations', 'shapes.geometric', 'patterns', 'calc'].map(t => (
              <div key={t} style={{ padding: '2px 0', color: '#475569' }}>• {t}</div>
            ))}
            <div style={{ marginTop: '10px', padding: '8px', background: '#0f172a', borderRadius: '6px', border: '1px solid #1e293b' }}>
              <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>Note:</div>
              <span>First render loads ~15MB WASM binary from tikzjax.com CDN. Subsequent renders are fast.</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={S.footer}>
        <button
          style={{ ...S.btn, ...S.btnSuccess, opacity: saving ? 0.5 : 1 }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader size={13} className="spin" /> : <Save size={13} />}
          {saving ? 'Saving…' : 'Save to DB'}
        </button>

        {saveError && <span style={{ fontSize: '12px', color: '#f87171' }}>{saveError}</span>}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#334155' }}>
            {engine === 'konva' && `${shapes.length} shapes`}
            {engine === 'tikz' && tikzCode && `${tikzCode.split('\n').length} lines`}
            {engine === 'jsxgraph' && jsxConfig && `${jsxConfig.elements?.length || 0} elements`}
          </span>
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
