import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Sparkles, Loader, Save, Edit3, AlertTriangle, CheckCircle,
  Package, ChevronDown, ChevronRight, Key, RotateCcw, Image as ImageIcon,
} from 'lucide-react';
import { ObjectRegistry } from '../registry/objectRegistry';
import { getApiKey, saveApiKey, analyseImageForEditing } from '../services/claudeService';
import { resolveImageUrl, uploadDiagramImage, updateQuestion } from '../services/lmsApiService';
import Sidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';
import CanvasEditor2D from './CanvasEditor2D';

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  overlay:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9100, display: 'flex', flexDirection: 'column' },
  header:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#0f172a', borderBottom: '1px solid #334155', flexShrink: 0 },
  body:      { display: 'flex', flex: 1, overflow: 'hidden' },
  footer:    { display: 'flex', gap: '8px', padding: '9px 16px', background: '#0f172a', borderTop: '1px solid #334155', flexShrink: 0, alignItems: 'center' },
  setupPane: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', background: '#0c1220' },
  setupCard: { background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '28px 32px', width: '480px', display: 'flex', flexDirection: 'column', gap: '16px' },
  label:     { fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' },
  input:     { width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '8px 10px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' },
  btn:       { padding: '8px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' },
  btnPrimary:{ background: '#7c3aed', color: '#fff' },
  btnSuccess:{ background: '#059669', color: '#fff' },
  btnGhost:  { background: 'transparent', color: '#94a3b8', border: '1px solid #334155' },
  missingCard: { background: '#1e293b', border: '1px solid #f59e0b44', borderRadius: '8px', padding: '10px 12px' },
  missingItem: { display: 'flex', gap: '8px', padding: '6px 0', borderBottom: '1px solid #1e3a5f', fontSize: '12px', color: '#cbd5e1' },
  coveragePill: (pct) => ({
    display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
    background: pct >= 80 ? '#064e3b' : pct >= 50 ? '#451a03' : '#450a0a',
    color: pct >= 80 ? '#34d399' : pct >= 50 ? '#f59e0b' : '#f87171',
  }),
};

// ── Missing components collapsible panel ──────────────────────────────────────
function MissingComponentsPanel({ items }) {
  const [open, setOpen] = useState(true);
  if (!items?.length) return null;
  return (
    <div style={S.missingCard}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', width: '100%', padding: 0 }}
      >
        <AlertTriangle size={13} color="#f59e0b" />
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>Missing Components ({items.length})</span>
        {open ? <ChevronDown size={11} color="#f59e0b" style={{ marginLeft: 'auto' }} /> : <ChevronRight size={11} color="#f59e0b" style={{ marginLeft: 'auto' }} />}
      </button>
      {open && (
        <div style={{ marginTop: '8px' }}>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 8px', lineHeight: 1.5 }}>
            These elements can't be reproduced with existing components. They need to be built and registered.
          </p>
          {items.map((item, i) => (
            <div key={i} style={{ ...S.missingItem, borderBottom: i === items.length - 1 ? 'none' : undefined }}>
              <Package size={13} color="#f59e0b" style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: '2px' }}>{item.name}</div>
                <div style={{ color: '#94a3b8' }}>{item.description}</div>
                {item.reason && <div style={{ color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>{item.reason}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Original image floating reference ────────────────────────────────────────
function OriginalImageRef({ imageUrl, analysis }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{
      position: 'absolute', top: '10px', right: '10px', zIndex: 10,
      background: '#0f172a', border: '1px solid #334155', borderRadius: '8px',
      width: collapsed ? '36px' : '180px', overflow: 'hidden', transition: 'width 0.2s',
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    }}>
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{ width: '100%', padding: '6px 8px', background: '#1e293b', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}
      >
        <ImageIcon size={13} />
        {!collapsed && <span style={{ fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>Original</span>}
        {!collapsed && analysis && (
          <span style={{ ...S.coveragePill(analysis.coveragePercent), marginLeft: 'auto', fontSize: '10px' }}>
            {analysis.coveragePercent}%
          </span>
        )}
      </button>
      {!collapsed && (
        <div style={{ padding: '6px' }}>
          <img src={imageUrl} alt="original" style={{ width: '100%', borderRadius: '4px', objectFit: 'contain', maxHeight: '130px', background: '#fff' }} />
          {analysis?.missingComponents?.length > 0 && (
            <MissingComponentsPanel items={analysis.missingComponents} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Setup screen (before analysis) ───────────────────────────────────────────
function SetupScreen({ question, imageUrl, apiKey, setApiKey, analysing, analyseError, onAnalyse }) {
  return (
    <div style={S.setupPane}>
      <div style={S.setupCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <Edit3 size={20} color="#34d399" />
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>Edit Diagram in Canvas</span>
        </div>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
          Claude will analyse the image and reconstruct it using Konva components. You can then edit shapes with the full editor tools.
        </p>

        {/* Original image preview */}
        {imageUrl && (
          <div>
            <div style={S.label}>Original Image</div>
            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px' }}>
              <img src={imageUrl} alt="original" style={{ width: '100%', objectFit: 'contain', maxHeight: '160px', borderRadius: '4px' }} />
            </div>
          </div>
        )}

        {!imageUrl && (
          <div style={{ padding: '16px', background: '#0f172a', borderRadius: '8px', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>
            No image attached to this question.
          </div>
        )}

        {/* API Key */}
        <div>
          <div style={S.label}><Key size={10} style={{ display: 'inline', marginRight: '4px' }} />Claude API Key</div>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-…"
            style={S.input}
          />
        </div>

        {analyseError && (
          <div style={{ padding: '10px 12px', background: '#450a0a', borderRadius: '6px', color: '#f87171', fontSize: '13px' }}>
            {analyseError}
          </div>
        )}

        <button
          style={{ ...S.btn, ...S.btnPrimary, justifyContent: 'center', opacity: analysing || !imageUrl || !apiKey ? 0.5 : 1, padding: '10px 16px' }}
          onClick={onAnalyse}
          disabled={analysing || !imageUrl || !apiKey}
        >
          {analysing ? <Loader size={15} className="spin" /> : <Sparkles size={15} />}
          {analysing ? 'Analysing diagram…' : 'Analyse & Open in Editor'}
        </button>

        {analysing && (
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
            Claude Haiku is reconstructing the diagram using registered Konva components…
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function DiagramCanvasEditModal({ question, onClose, onSaved }) {
  const [apiKey, setApiKeyState] = useState(getApiKey);
  const [phase, setPhase] = useState('setup'); // 'setup' | 'editor'
  const [analysing, setAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analyseError, setAnalyseError] = useState(null);

  // Full editor state (mirrors App.jsx pattern)
  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [recentlyUsed, setRecentlyUsed] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const stageRef = useRef(null);

  const imageUrl = resolveImageUrl(question.image || question.imageUrl || question.imageKey);

  const assignIds = useCallback((arr) =>
    arr.map((s, i) => ({ ...s, id: s.id || `ai_${i}_${Date.now()}` }))
  , []);

  const runAnalysis = useCallback(async () => {
    if (!apiKey || !imageUrl) return;
    saveApiKey(apiKey);
    setAnalysing(true);
    setAnalyseError(null);
    try {
      const result = await analyseImageForEditing(imageUrl, apiKey);
      setAnalysis(result);
      setShapes(assignIds(result.shapes));
      setPhase('editor');
    } catch (e) {
      setAnalyseError(e.message);
    } finally {
      setAnalysing(false);
    }
  }, [apiKey, imageUrl, assignIds]);

  // Auto-run if API key already saved
  useEffect(() => {
    if (apiKey && imageUrl) runAnalysis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Editor helpers
  const addShape = (type) => {
    const reg = ObjectRegistry[type];
    const newId = 'shape_' + Date.now();
    const newShape = { id: newId, type, x: 400, y: 250, ...reg?.defaultProps };
    setShapes(prev => [...prev, newShape]);
    setSelectedId(newId);
    setRecentlyUsed(prev => [type, ...prev.filter(t => t !== type)].slice(0, 10));
  };

  const updateShape = (id, newProps) => {
    setShapes(prev => prev.map(s => s.id === id ? { ...s, ...newProps } : s));
  };

  const deleteShape = (id) => {
    setShapes(prev => prev.filter(s => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const reorderShape = (id, direction) => {
    setShapes(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      if (direction === 'up' && idx > 0) [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      if (direction === 'down' && idx < next.length - 1) [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const handleSave = async () => {
    if (!stageRef.current) return;
    setSaving(true);
    setSaveError(null);
    try {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
      const imagePublicUrl = await uploadDiagramImage(dataUrl, 'diagram-editor/canvas-edit');
      const updates = { diagramShapes: shapes, image: imagePublicUrl };
      const updated = await updateQuestion(question.id, updates);
      onSaved?.(updated || { ...question, ...updates });
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedShape = shapes.find(s => s.id === selectedId);

  return (
    <div style={S.overlay}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Edit3 size={15} color="#34d399" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>Edit Diagram in Canvas</span>
          {phase === 'editor' && analysis && (
            <span style={S.coveragePill(analysis.coveragePercent)}>
              {analysis.coveragePercent}% reproduced
            </span>
          )}
          {phase === 'editor' && analysis && (
            <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>
              · {analysis.diagramType} · {shapes.length} shapes
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {phase === 'editor' && (
            <button
              style={{ ...S.btn, ...S.btnGhost, padding: '5px 10px', fontSize: '11px' }}
              onClick={() => { setPhase('setup'); setAnalyseError(null); }}
              title="Back to setup"
            >
              <RotateCcw size={12} /> Re-analyse
            </button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={S.body}>
        {phase === 'setup' ? (
          <SetupScreen
            question={question}
            imageUrl={imageUrl}
            apiKey={apiKey}
            setApiKey={k => { setApiKeyState(k); }}
            analysing={analysing}
            analyseError={analyseError}
            onAnalyse={runAnalysis}
          />
        ) : (
          /* ── Full editor ── */
          <>
            <Sidebar
              mode="Geometry"
              setMode={() => {}}
              addShape={addShape}
              handleExport={() => {}}
              handleSaveToLibrary={() => {}}
              recentlyUsed={recentlyUsed}
              openAIGenerator={() => {}}
            />

            <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
              <CanvasEditor2D
                shapes={shapes}
                setShapes={(newShapes) => setShapes(newShapes)}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                stageRef={stageRef}
                showGrid={false}
              />

              {/* Floating original image reference */}
              {imageUrl && (
                <OriginalImageRef imageUrl={imageUrl} analysis={analysis} />
              )}
            </div>

            <PropertiesPanel
              selectedShape={selectedShape}
              updateShape={updateShape}
              deleteShape={deleteShape}
              reorderShape={reorderShape}
              mode="2D"
              openIconPicker={() => {}}
            />
          </>
        )}
      </div>

      {/* Footer */}
      <div style={S.footer}>
        {phase === 'editor' && (
          <button
            style={{ ...S.btn, ...S.btnSuccess, opacity: saving ? 0.5 : 1 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader size={14} className="spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save to DB'}
          </button>
        )}

        {saveError && (
          <span style={{ color: '#f87171', fontSize: '12px' }}>Save error: {saveError}</span>
        )}

        <div style={{ marginLeft: 'auto' }}>
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
