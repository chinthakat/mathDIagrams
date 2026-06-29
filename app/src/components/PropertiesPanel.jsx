import React, { useState, useRef } from 'react';
import { Trash2, ArrowUp, ArrowDown, AlignCenter, AlignLeft, AlignRight, AlignHorizontalSpaceBetween, AlignVerticalSpaceBetween, Image as ImageIcon, Sparkles, Plus, Minus, Copy, Clipboard, Type, Eye } from 'lucide-react';
import { ObjectRegistry } from '../registry/objectRegistry';
import { GET_ICON } from '../registry/iconRegistry';
import { resolveEndpoint, computeOrthoPath } from '../utils/connectionUtils';

const ENDPOINT_EDITABLE = new Set(['connectorArrow', 'orthoConnector', 'dottedLineArrow', 'elbowArrow', 'bezierArrow', 'dashedConnector', 'doubleHeadedConnector', 'thickArrow', 'annotationArrow']);

const PRESET_COLORS = [
  'transparent', '#ffffff', '#000000', '#94a3b8', 
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

// Module-level style clipboard (persists across re-renders, shared between panels)
const styleClipboard = { current: null };

// ── Colour picker with presets ─────────────────────────────────────────────────
const FILL_PRESETS   = ['transparent','#ffffff','#f1f5f9','#fef3c7','#dbeafe','#dcfce7','#fce7f3','#000000'];
const STROKE_PRESETS = ['transparent','#000000','#64748b','#ef4444','#3b82f6','#22c55e','#eab308','#8b5cf6'];

function ColourRow({ label, value, presets, onChange }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>{label}</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 5 }}>
        {presets.map(c => (
          <div key={c} onClick={() => onChange(c)}
            style={{
              width: 20, height: 20, borderRadius: 4, cursor: 'pointer', flexShrink: 0,
              background: c === 'transparent' ? 'repeating-conic-gradient(#94a3b8 0% 25%,transparent 0% 50%) 0/8px 8px' : c,
              border: value === c ? '2px solid #3b82f6' : '1px solid #334155',
              boxShadow: value === c ? '0 0 0 1px #0f172a inset' : 'none',
            }} title={c} />
        ))}
        <input type="color"
          value={value === 'transparent' ? '#ffffff' : (value || '#000000')}
          onChange={e => onChange(e.target.value)}
          style={{ width: 20, height: 20, padding: 0, border: '1px solid #334155', borderRadius: 4, cursor: 'pointer', background: 'none' }}
          title="Custom colour" />
      </div>
    </div>
  );
}

export default function PropertiesPanel({ selectedShape, updateShape, updateAllShapes, deleteShape, reorderShape, mode, openIconPicker, allShapes = [] }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [isGeneratingProp, setIsGeneratingProp] = useState(false);
  const [propGenError, setPropGenError] = useState('');
  const [styleCopied, setStyleCopied] = useState(false);

  if (!selectedShape) {
    return (
      <div className="properties-panel">
        <div className="empty-state">
          <div>Select a shape to view properties</div>
        </div>
      </div>
    );
  }

  // ── Connector panel (minimal) ─────────────────────────────────────────────────
  if (ENDPOINT_EDITABLE.has(selectedShape.type)) {
    const shape = selectedShape;
    const regObj = ObjectRegistry[shape.type];
    const wps = shape.waypoints ?? [];
    const supportsWaypoints = true; // all connector types support waypoints

    const handleConnChange = (e) => {
      const { name, value, type } = e.target;
      let v = type === 'range' || type === 'number' ? parseFloat(value) : value;
      if (type === 'checkbox') v = e.target.checked;
      updateShape(shape.id, { [name]: v });
    };

    const handleAddWaypoint = () => {
      // Resolve endpoints — support both absolute (x1/y1/x2/y2) and legacy (x/y+endX/endY) formats
      const useAbs = shape.x1 !== undefined;
      const sx = useAbs ? (shape.x1 ?? 0) : (shape.x ?? 0);
      const sy = useAbs ? (shape.y1 ?? 0) : (shape.y ?? 0);
      const ex = useAbs ? (shape.x2 ?? 150) : (shape.x ?? 0) + (shape.endX ?? 150);
      const ey = useAbs ? (shape.y2 ?? 0)   : (shape.y ?? 0) + (shape.endY ?? 0);
      const start = resolveEndpoint(shape.startBinding, sx, sy, allShapes);
      const end   = resolveEndpoint(shape.endBinding,   ex, ey, allShapes);

      if (shape.type === 'connectorArrow') {
        // Convert straight connector to ortho so it becomes bendable
        const mx = (start.x + end.x) / 2;
        const my = (start.y + end.y) / 2;
        updateShape(shape.id, { type: 'orthoConnector', x1: sx, y1: sy, x2: ex, y2: ey, waypoints: [{ x: mx, y: my }] });
        return;
      }

      // For all other connector types: compute current path and insert waypoint at midpoint of longest segment
      const pts = computeOrthoPath(start, end, wps);
      let maxLen = 0, maxSi = 0;
      for (let i = 0; i < pts.length - 2; i += 2) {
        const len = Math.hypot(pts[i+2]-pts[i], pts[i+3]-pts[i+1]);
        if (len > maxLen) { maxLen = len; maxSi = i; }
      }
      const midX = (pts[maxSi] + pts[maxSi+2]) / 2;
      const midY = (pts[maxSi+1] + pts[maxSi+3]) / 2;
      const newWps = [...wps];
      newWps.splice(maxSi / 2, 0, { x: midX, y: midY });

      // Ensure legacy-format shapes also store absolute start/end for rendering
      if (!useAbs) {
        updateShape(shape.id, { x1: sx, y1: sy, x2: ex, y2: ey, waypoints: newWps });
      } else {
        updateShape(shape.id, { waypoints: newWps });
      }
    };

    const handleRemoveWaypoint = () => {
      if (wps.length > 0) updateShape(shape.id, { waypoints: wps.slice(0, -1) });
    };

    const inputStyle = { width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' };

    return (
      <div className="properties-panel">
        <div className="section-title">Connector</div>

        {/* Connector Type Toggle */}
        <div className="input-group">
          <label><span>Connector Type</span></label>
          <select
            value={
              shape.type === 'bezierArrow' ? 'curved' :
              (shape.type === 'orthoConnector' || shape.type === 'elbowArrow') ? 'l-shape' :
              'straight'
            }
            onChange={(e) => {
              const val = e.target.value;
              let nextType = 'connectorArrow';
              if (val === 'curved') {
                nextType = 'bezierArrow';
              } else if (val === 'l-shape') {
                nextType = 'orthoConnector';
              }
              // Preserve other keys when swapping type
              updateShape(shape.id, { type: nextType });
            }}
            style={inputStyle}
          >
            <option value="straight">Straight</option>
            <option value="curved">Curved (Bezier)</option>
            <option value="l-shape">Elbow (L-Shape)</option>
          </select>
        </div>

        {/* Stroke color */}
        <div className="input-group">
          <label><span>Color</span></label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
            {['#64748b','#000000','#ffffff','#ef4444','#3b82f6','#22c55e','#eab308','#8b5cf6'].map(c => (
              <div key={c} onClick={() => updateShape(shape.id, { stroke: c })}
                style={{ width: 24, height: 24, borderRadius: 4, background: c, border: shape.stroke === c ? '2px solid var(--accent)' : '1px solid var(--border-color)', cursor: 'pointer' }} />
            ))}
          </div>
          <input type="color" value={shape.stroke || '#64748b'} onChange={e => updateShape(shape.id, { stroke: e.target.value })}
            style={{ width: '100%', height: 32, padding: 0, cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: 4 }} />
        </div>

        {/* Stroke width */}
        <div className="input-group">
          <label><span>Thickness</span><span>{shape.strokeWidth ?? 2}</span></label>
          <input type="range" name="strokeWidth" min={1} max={12} value={shape.strokeWidth ?? 2} onChange={handleConnChange} />
        </div>

        {/* Start arrow */}
        <div className="input-group">
          <label><span>Start Arrow</span></label>
          <select name="startArrow" value={shape.startArrow || 'none'} onChange={handleConnChange} style={inputStyle}>
            {[
              { value: 'none', label: 'None' },
              { value: 'filled', label: 'Classic (Filled)' },
              { value: 'open', label: 'Stealth (Open)' },
              { value: 'circle', label: 'Dot (Circle)' },
              { value: 'diamond', label: 'Diamond' },
              { value: 'square', label: 'Box (Square)' },
              { value: 'bar', label: 'T-Bar (Bar)' },
              { value: 'double', label: 'Double (Double)' }
            ].map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* End arrow */}
        <div className="input-group">
          <label><span>End Arrow</span></label>
          <select name="endArrow" value={shape.endArrow ?? 'filled'} onChange={handleConnChange} style={inputStyle}>
            {[
              { value: 'none', label: 'None' },
              { value: 'filled', label: 'Classic (Filled)' },
              { value: 'open', label: 'Stealth (Open)' },
              { value: 'circle', label: 'Dot (Circle)' },
              { value: 'diamond', label: 'Diamond' },
              { value: 'square', label: 'Box (Square)' },
              { value: 'bar', label: 'T-Bar (Bar)' },
              { value: 'double', label: 'Double (Double)' }
            ].map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Line Style */}
        <div className="input-group">
          <label><span>Line Style</span></label>
          <select name="lineStyle" value={shape.lineStyle || (shape.dash ? 'dashed' : 'solid')} onChange={handleConnChange} style={inputStyle}>
            {[
              { value: 'solid', label: 'Continuous (Solid)' },
              { value: 'dashed', label: 'Broken (Dashed)' },
              { value: 'dotted', label: 'Dotted' }
            ].map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Midpoints / waypoints */}
        {supportsWaypoints && (
          <>
            <div className="section-title" style={{ marginTop: 24 }}>Midpoints</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-dark)', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border-color)' }}>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)' }}>
                {wps.length === 0 ? 'No midpoints' : `${wps.length} midpoint${wps.length > 1 ? 's' : ''}`}
              </span>
              <button onClick={handleRemoveWaypoint} disabled={wps.length === 0}
                title="Remove last midpoint"
                style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid var(--border-color)', background: 'transparent', color: wps.length === 0 ? '#475569' : '#f87171', cursor: wps.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Minus size={14} />
              </button>
              <button onClick={handleAddWaypoint}
                title="Add midpoint"
                style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid var(--border-color)', background: 'transparent', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={14} />
              </button>
            </div>
            <p style={{ fontSize: 11, color: '#475569', marginTop: 6, lineHeight: 1.5 }}>
              Drag the white segment handles on the canvas to reshape the connector.
            </p>
          </>
        )}

        <div className="section-title" style={{ marginTop: 32 }}>Actions</div>
        <button className="btn" style={{ width: '100%', backgroundColor: '#ef4444', color: 'white' }} onClick={() => deleteShape(shape.id)}>
          <Trash2 size={16} /> Delete Connector
        </button>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let finalValue = value;
    
    if (type === 'range' || type === 'number') {
      finalValue = parseFloat(value);
    }
    
    updateShape(selectedShape.id, { [name]: finalValue });
  };

  const regObj = selectedShape ? ObjectRegistry[selectedShape.type] : null;

  const handleBarChange = (barId, field, value) => {
    const newBars = selectedShape.bars.map(b => b.id === barId ? { ...b, [field]: field === 'value' ? parseFloat(value) || 0 : value } : b);
    updateShape(selectedShape.id, { bars: newBars });
  };

  const handleAddBar = () => {
    const newBars = [...(selectedShape.bars || []), { id: `b${Date.now()}`, value: 5, color: '#3b82f6' }];
    updateShape(selectedShape.id, { bars: newBars });
  };

  const handleDeleteBar = (barId) => {
    const newBars = (selectedShape.bars || []).filter(b => b.id !== barId);
    updateShape(selectedShape.id, { bars: newBars });
  };

  const handlePlotChange = (plotId, field, value) => {
    const newPlots = selectedShape.plots.map(p => p.id === plotId ? { ...p, [field]: value } : p);
    updateShape(selectedShape.id, { plots: newPlots });
  };

  const handleAddPlot = (type) => {
    const newPlots = [...(selectedShape.plots || []), { 
      id: `p${Date.now()}`, 
      type, 
      value: type === 'equation' ? 'x^2' : '1,2; -2,-3', 
      color: '#ef4444'
    }];
    updateShape(selectedShape.id, { plots: newPlots });
  };

  const handleDeletePlot = (plotId) => {
    const newPlots = (selectedShape.plots || []).filter(p => p.id !== plotId);
    updateShape(selectedShape.id, { plots: newPlots });
  };

  const handleLandmarkChange = (lmId, field, value) => {
    let finalValue = value;
    if (field === 'row' || field === 'col') {
      finalValue = parseInt(value) || 1;
    }
    const newLandmarks = selectedShape.landmarks.map(lm => 
      lm.id === lmId ? { ...lm, [field]: finalValue } : lm
    );
    updateShape(selectedShape.id, { landmarks: newLandmarks });
  };

  const handleAddLandmark = () => {
    const newLandmarks = [...(selectedShape.landmarks || []), { 
      id: `lm${Date.now()}`, 
      row: 1, 
      col: 1, 
      label: 'New Place', 
      icon: 'MapPin', 
      color: '#3b82f6' 
    }];
    updateShape(selectedShape.id, { landmarks: newLandmarks });
  };

  const handleDeleteLandmark = (lmId) => {
    const newLandmarks = (selectedShape.landmarks || []).filter(lm => lm.id !== lmId);
    updateShape(selectedShape.id, { landmarks: newLandmarks });
  };

  const handleRouteChange = (rtId, field, value) => {
    const newRoutes = selectedShape.routes.map(rt => 
      rt.id === rtId ? { ...rt, [field]: value } : rt
    );
    updateShape(selectedShape.id, { routes: newRoutes });
  };

  const handleAddRoute = () => {
    const newRoutes = [...(selectedShape.routes || []), { 
      id: `rt${Date.now()}`, 
      path: 'A1-B1', 
      color: '#ef4444' 
    }];
    updateShape(selectedShape.id, { routes: newRoutes });
  };

  const handleDeleteRoute = (rtId) => {
    const newRoutes = (selectedShape.routes || []).filter(rt => rt.id !== rtId);
    updateShape(selectedShape.id, { routes: newRoutes });
  };

  const generateAITerrain = async () => {
    setIsGenerating(true);
    setGenError('');
    try {
      const apiKey = localStorage.getItem('deepseekApiKey');
      if (!apiKey) {
        setGenError('DeepSeek API Key is required. Please set it in the AI Map Modal first.');
        setIsGenerating(false);
        return;
      }

      const { terrainType, shape, count, features, width, height } = selectedShape;
      const typeDesc = terrainType || 'island';
      const shapeDesc = shape === 'organic' ? 'natural, organic shape' : `${shape} shape`;
      const countDesc = count === '1' ? '1 single contiguous' : count === 'many' ? 'a scattered cluster of many small' : `exactly ${count}`;
      
      const p = `You are a specialized SVG cartography generator. Generate a beautiful cartoon 2D map element for a ${typeDesc} environment. 

CRITICAL INSTRUCTIONS:
1. Return ONLY valid, raw SVG code without markdown formatting. Return nothing else.
2. DO NOT draw a sky, ocean, sea, or solid background! The SVG MUST have a completely TRANSPARENT background so it can be placed on top of other maps.
3. ONLY draw the landmass itself (sand, dirt, grass, mountains, trees, etc.) and its immediate geographic features.
4. Terrain Specifications:
   - Type: ${typeDesc}
   - Shape constraint: The overall landmass must form a ${shapeDesc}.
   - Quantity: Draw ${countDesc} landmasses.
   - Required Features to include: ${features || 'none specific'}
5. STRICT BOUNDARY RULE: ALL rivers, trees, and geographic features MUST be contained entirely within the boundaries of the main landmass! Do not let rivers or objects bleed out into the transparent space.
6. The map is viewed from a top-down or slight isometric angle, suitable for a children's math worksheet diagram.
7. Make the shapes clear, vibrant, and well-defined.
8. The SVG should be designed to fit perfectly into a viewBox of 0 0 ${width || 600} ${height || 400}.`;

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: p }],
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let content = data.choices[0].message.content;
      
      content = content.replace(/```xml\n?/gi, '').replace(/```svg\n?/gi, '').replace(/```\n?/g, '').trim();

      updateShape(selectedShape.id, { svgContent: content });
    } catch (err) {
      setGenError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAIProp = async () => {
    setIsGeneratingProp(true);
    setPropGenError('');
    try {
      const apiKey = localStorage.getItem('deepseekApiKey');
      if (!apiKey) {
        setPropGenError('DeepSeek API Key is required.');
        setIsGeneratingProp(false);
        return;
      }

      const p = `You are a specialized SVG prop generator. Generate a top-down 2D cartoon map prop of: "${selectedShape.prompt}". 

CRITICAL INSTRUCTIONS:
1. Return ONLY valid, raw SVG code without markdown formatting. Return nothing else.
2. The SVG MUST have a completely TRANSPARENT background.
3. Keep the design clean, cartoonish, and suitable for a children's math map.
4. The SVG should be designed to tightly fit into a viewBox of 0 0 ${selectedShape.width || 100} ${selectedShape.height || 100}.`;

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: p }],
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let content = data.choices[0].message.content;
      content = content.replace(/```xml\n?/gi, '').replace(/```svg\n?/gi, '').replace(/```\n?/g, '').trim();

      updateShape(selectedShape.id, { svgContent: content });
    } catch (err) {
      setPropGenError(err.message);
    } finally {
      setIsGeneratingProp(false);
    }
  };

  const up = (k, v) => updateShape(selectedShape.id, { [k]: v });

  const copyStyle = () => {
    styleClipboard.current = {
      fill: selectedShape.fill, stroke: selectedShape.stroke,
      strokeWidth: selectedShape.strokeWidth, opacity: selectedShape.opacity,
      fontSize: selectedShape.fontSize, fontColor: selectedShape.fontColor,
    };
    setStyleCopied(true);
    setTimeout(() => setStyleCopied(false), 1500);
  };

  const pasteStyle = () => {
    if (styleClipboard.current) updateShape(selectedShape.id, styleClipboard.current);
  };

  return (
    <div className="properties-panel">

      {/* ── Universal Style Block ─────────────────────────────────────────────── */}
      {mode !== '3D' && !ENDPOINT_EDITABLE.has(selectedShape.type) && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #1e293b', marginBottom: 4 }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>Style</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={copyStyle} title="Copy Style" style={{ background: styleCopied ? '#14532d' : 'transparent', border: '1px solid #334155', borderRadius: 4, color: styleCopied ? '#4ade80' : '#64748b', cursor: 'pointer', padding: '2px 6px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Copy size={10} />{styleCopied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={pasteStyle} title="Paste Style" disabled={!styleClipboard.current} style={{ background: 'transparent', border: '1px solid #334155', borderRadius: 4, color: styleClipboard.current ? '#94a3b8' : '#334155', cursor: styleClipboard.current ? 'pointer' : 'default', padding: '2px 6px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clipboard size={10} />Paste
              </button>
            </div>
          </div>

          <ColourRow label="Fill" value={selectedShape.fill || 'transparent'} presets={FILL_PRESETS} onChange={v => up('fill', v)} />
          <ColourRow label="Stroke" value={selectedShape.stroke || '#000000'} presets={STROKE_PRESETS} onChange={v => up('stroke', v)} />

          {/* Stroke width + Opacity in one row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Stroke <span style={{ color: '#94a3b8' }}>{selectedShape.strokeWidth ?? 1}px</span></div>
              <input type="range" min={0} max={16} step={1} value={selectedShape.strokeWidth ?? 1}
                onChange={e => up('strokeWidth', +e.target.value)}
                style={{ width: '100%' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Opacity <span style={{ color: '#94a3b8' }}>{Math.round((selectedShape.opacity ?? 1) * 100)}%</span></div>
              <input type="range" min={0} max={1} step={0.05} value={selectedShape.opacity ?? 1}
                onChange={e => up('opacity', +e.target.value)}
                style={{ width: '100%' }} />
            </div>
          </div>

          {/* W / H inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            {['width','height'].map(k => (
              <div key={k}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{k === 'width' ? 'W' : 'H'}</div>
                <input type="number" value={Math.round(selectedShape[k] ?? (k === 'width' ? 100 : 80))} min={4}
                  onChange={e => up(k, +e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', background: '#1e293b', border: '1px solid #334155', borderRadius: 4, color: '#e2e8f0', fontSize: 12 }} />
              </div>
            ))}
          </div>

          {/* Inline label */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Type size={10} /> Label <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none' }}>(double-click on canvas)</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="text" value={selectedShape.label || ''} placeholder="Add label…"
                onChange={e => up('label', e.target.value)}
                style={{ flex: 1, padding: '5px 8px', background: '#1e293b', border: '1px solid #334155', borderRadius: 4, color: '#e2e8f0', fontSize: 12 }} />
              <input type="number" value={selectedShape.fontSize ?? 13} min={8} max={72}
                onChange={e => up('fontSize', +e.target.value)}
                title="Font size"
                style={{ width: 44, padding: '5px 4px', background: '#1e293b', border: '1px solid #334155', borderRadius: 4, color: '#e2e8f0', fontSize: 12, textAlign: 'center' }} />
              <input type="color" value={selectedShape.fontColor || '#ffffff'}
                onChange={e => up('fontColor', e.target.value)}
                title="Label colour"
                style={{ width: 28, height: 28, padding: 0, border: '1px solid #334155', borderRadius: 4, cursor: 'pointer', background: 'none' }} />
            </div>
          </div>
        </div>
      )}

      <div className="section-title">Properties</div>

      {(mode !== '3D') && regObj && regObj.properties.filter(p => p.type !== 'hidden').map(prop => (
        <div className="input-group" key={prop.name}>
          <label>
            <span>{prop.label}</span>
            {(prop.type === 'range' || prop.type === 'number') && <span>{selectedShape[prop.name] ?? ''}</span>}
          </label>
          {prop.type === 'color' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {PRESET_COLORS.map(color => (
                  <div
                    key={color}
                    onClick={() => updateShape(selectedShape.id, { [prop.name]: color })}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      background: color === 'transparent' 
                        ? 'repeating-conic-gradient(#cbd5e1 0% 25%, transparent 0% 50%) 50% / 8px 8px white' 
                        : color,
                      border: selectedShape[prop.name] === color ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      boxShadow: selectedShape[prop.name] === color ? '0 0 0 1px #0f172a inset' : 'none'
                    }}
                    title={color === 'transparent' ? 'No Color' : color}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="color" 
                  name={prop.name} 
                  value={selectedShape[prop.name] === 'transparent' ? '#ffffff' : (selectedShape[prop.name] || '#000000')} 
                  onChange={handleChange}
                  style={{ flex: 1, height: '32px', padding: '0', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '45px' }}>Custom</span>
              </div>
            </div>
          )}
          {prop.type === 'range' && (
            <input 
              type="range" 
              name={prop.name} 
              min={prop.min} 
              max={prop.max} 
              value={selectedShape[prop.name] || 0} 
              onChange={handleChange} 
            />
          )}
          {prop.type === 'number' && (
            <input 
              type="number" 
              name={prop.name} 
              value={selectedShape[prop.name] || 0} 
              onChange={handleChange} 
              style={{width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px'}}
            />
          )}
          {prop.type === 'text' && (
            <input 
              type="text" 
              name={prop.name} 
              value={selectedShape[prop.name] || ''} 
              onChange={handleChange} 
              style={{width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px'}} 
            />
          )}
          {prop.type === 'select' && (
            <select
              name={prop.name}
              value={selectedShape[prop.name] || ''}
              onChange={handleChange}
              style={{width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px'}}
            >
              {prop.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
        </div>
      ))}

      {selectedShape?.type === 'aiTerrain' && (
        <div style={{ marginTop: '24px', background: 'var(--bg-dark)', padding: '12px', borderRadius: '8px', border: '1px solid var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--accent)' }}>
            <Sparkles size={16} />
            <span style={{ fontSize: '13px', fontWeight: '600' }}>AI Terrain Generator</span>
          </div>
          <button 
            className="action-button primary" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={generateAITerrain}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating Terrain...' : 'Generate New Terrain'}
          </button>
          {genError && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '8px', lineHeight: '1.4' }}>{genError}</div>}
        </div>
      )}

      {selectedShape?.type?.startsWith('prop') && (
        <div style={{ marginTop: '24px', background: 'var(--bg-dark)', padding: '12px', borderRadius: '8px', border: '1px solid var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--accent)' }}>
            <Sparkles size={16} />
            <span style={{ fontSize: '13px', fontWeight: '600' }}>AI Prop Generator</span>
          </div>
          <button 
            className="action-button primary" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={generateAIProp}
            disabled={isGeneratingProp}
          >
            {isGeneratingProp ? 'Generating...' : 'Regenerate Prop'}
          </button>
          {propGenError && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '8px', lineHeight: '1.4' }}>{propGenError}</div>}
        </div>
      )}

      {selectedShape?.type === 'barGraph' && (
        <div style={{ marginTop: '24px' }}>
          <div className="section-title">Bar Data</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(selectedShape.bars || []).map((bar, index) => (
              <div key={bar.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-dark)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '16px' }}>{index + 1}.</span>
                <input 
                  type="number" 
                  value={bar.value} 
                  onChange={(e) => handleBarChange(bar.id, 'value', e.target.value)} 
                  style={{ width: '60px', padding: '4px', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }}
                />
                <input 
                  type="color" 
                  value={bar.color} 
                  onChange={(e) => handleBarChange(bar.id, 'color', e.target.value)} 
                  style={{ flex: 1, height: '24px', padding: '0', cursor: 'pointer', border: 'none', background: 'transparent' }}
                />
                <button className="btn-icon" onClick={() => handleDeleteBar(bar.id)} style={{ color: '#ef4444' }} title="Delete Bar">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={handleAddBar} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
              + Add Bar
            </button>
          </div>
        </div>
      )}

      {selectedShape?.type === 'cartesianPlane' && (
        <div style={{ marginTop: '24px' }}>
          <div className="section-title">Equations & Points</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(selectedShape.plots || []).map((plot, index) => (
              <div key={plot.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-dark)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {plot.type === 'equation' ? 'f(x) =' : 'Points (x,y; ...)'}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="color" 
                      value={plot.color} 
                      onChange={(e) => handlePlotChange(plot.id, 'color', e.target.value)} 
                      style={{ width: '24px', height: '24px', padding: '0', cursor: 'pointer', border: 'none', background: 'transparent' }}
                    />
                    <button className="btn-icon" onClick={() => handleDeletePlot(plot.id)} style={{ color: '#ef4444' }} title="Delete Plot">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <input 
                  type="text" 
                  value={plot.value} 
                  onChange={(e) => handlePlotChange(plot.id, 'value', e.target.value)} 
                  style={{ width: '100%', padding: '6px', background: 'var(--bg)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', fontFamily: 'monospace' }}
                  placeholder={plot.type === 'equation' ? 'e.g. x^2 + 2' : 'e.g. 1,2; 3,4'}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button className="btn btn-secondary" onClick={() => handleAddPlot('equation')} style={{ flex: 1, padding: '8px' }}>
                + Equation
              </button>
              <button className="btn btn-secondary" onClick={() => handleAddPlot('points')} style={{ flex: 1, padding: '8px' }}>
                + Points
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedShape?.type === 'gridMap' && (
        <div style={{ marginTop: '24px' }}>
          {/* Compass and options */}
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={selectedShape.showCompass !== false} 
                onChange={(e) => updateShape(selectedShape.id, { showCompass: e.target.checked })} 
              />
              <span style={{ fontSize: '13px', color: 'white' }}>Show Compass Rose (N-S-E-W)</span>
            </label>
          </div>

          {/* Landmarks (Buildings) */}
          <div className="section-title" style={{ marginTop: '20px' }}>Landmarks (Buildings)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(selectedShape.landmarks || []).map((lm) => {
              const colOpts = [];
              for (let i = 0; i < (selectedShape.cols || 4); i++) {
                colOpts.push({ value: i + 1, label: String.fromCharCode(65 + i) });
              }
              const rowOpts = [];
              for (let j = 0; j < (selectedShape.rows || 4); j++) {
                rowOpts.push({ value: j + 1, label: (j + 1).toString() });
              }

              return (
                <div key={lm.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-dark)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="text" 
                      value={lm.label} 
                      onChange={(e) => handleLandmarkChange(lm.id, 'label', e.target.value)} 
                      style={{ flex: 1, padding: '4px 6px', background: 'var(--bg)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', fontSize: '12px' }}
                      placeholder="Name (e.g. School)"
                    />
                    
                    {/* Column Select */}
                    <select 
                      value={lm.col} 
                      onChange={(e) => handleLandmarkChange(lm.id, 'col', e.target.value)}
                      style={{ padding: '4px', background: 'var(--bg)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', fontSize: '12px', width: '45px' }}
                    >
                      {colOpts.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>

                    {/* Row Select */}
                    <select 
                      value={lm.row} 
                      onChange={(e) => handleLandmarkChange(lm.id, 'row', e.target.value)}
                      style={{ padding: '4px', background: 'var(--bg)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', fontSize: '12px', width: '45px' }}
                    >
                      {rowOpts.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>

                    {/* Icon Button */}
                    <button
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        background: '#0f172a',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: lm.color || 'var(--accent)',
                        padding: 0
                      }}
                      onClick={() => openIconPicker(lm.icon, (newIcon) => {
                        handleLandmarkChange(lm.id, 'icon', newIcon);
                      })}
                      title="Change Landmark Icon"
                    >
                      {(() => {
                        const IconComp = GET_ICON(lm.icon);
                        return IconComp ? <IconComp size={14} /> : <ImageIcon size={14} />;
                      })()}
                    </button>

                    {/* Color Input */}
                    <input 
                      type="color" 
                      value={lm.color || '#3b82f6'} 
                      onChange={(e) => handleLandmarkChange(lm.id, 'color', e.target.value)} 
                      style={{ width: '22px', height: '22px', padding: '0', cursor: 'pointer', border: 'none', background: 'transparent' }}
                    />

                    {/* Delete button */}
                    <button className="btn-icon" onClick={() => handleDeleteLandmark(lm.id)} style={{ color: '#ef4444' }} title="Delete Landmark">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            <button className="btn btn-secondary" onClick={handleAddLandmark} style={{ width: '100%', padding: '6px', fontSize: '12px' }}>
              + Add Landmark
            </button>
          </div>

          {/* Routes (Directions) */}
          <div className="section-title" style={{ marginTop: '20px' }}>Routes & Paths</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(selectedShape.routes || []).map((route) => (
              <div key={route.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-dark)', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <input 
                  type="text" 
                  value={route.path} 
                  onChange={(e) => handleRouteChange(route.id, 'path', e.target.value)} 
                  style={{ flex: 1, padding: '4px 6px', background: 'var(--bg)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}
                  placeholder="e.g. A1-A4-D4"
                />
                
                {/* Route Color */}
                <input 
                  type="color" 
                  value={route.color || '#ef4444'} 
                  onChange={(e) => handleRouteChange(route.id, 'color', e.target.value)} 
                  style={{ width: '22px', height: '22px', padding: '0', cursor: 'pointer', border: 'none', background: 'transparent' }}
                />

                {/* Delete button */}
                <button className="btn-icon" onClick={() => handleDeleteRoute(route.id)} style={{ color: '#ef4444' }} title="Delete Route">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={handleAddRoute} style={{ width: '100%', padding: '6px', fontSize: '12px' }}>
              + Add Route
            </button>
          </div>
        </div>
      )}

      {selectedShape?.type === 'imageIcon' && (
        <div style={{ marginTop: '24px' }}>
          <div className="section-title">Icon Design</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-dark)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '6px',
                background: '#0f172a',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: selectedShape.color || 'var(--accent)',
                flexShrink: 0
              }}>
                {(() => {
                  const IconComp = GET_ICON(selectedShape.iconName);
                  if (IconComp && !selectedShape.url) {
                    return <IconComp size={28} stroke={selectedShape.color || 'var(--accent)'} />;
                  }
                  return <ImageIcon size={28} />;
                })()}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>
                  {selectedShape.url ? 'Custom Image' : (selectedShape.iconName || 'Calculator')}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {selectedShape.url ? 'External source' : 'Vector Library'}
                </span>
              </div>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={() => openIconPicker(selectedShape.iconName, (newIconName) => {
                updateShape(selectedShape.id, { iconName: newIconName, url: '' });
              })}
              style={{ width: '100%', padding: '8px', cursor: 'pointer' }}
            >
              Change Icon
            </button>
          </div>
        </div>
      )}

      {(mode !== '3D') && (
        <>
          <div className="section-title" style={{ marginTop: '24px' }}>Positioning</div>
          <div className="input-group">
            <label>
              <span>X Position</span>
              <span>{Math.round(selectedShape.x)}</span>
            </label>
            <input type="range" name="x" min="0" max="800" value={selectedShape.x || 0} onChange={handleChange} />
          </div>
          
          <div className="input-group">
            <label>
              <span>Y Position</span>
              <span>{Math.round(selectedShape.y)}</span>
            </label>
            <input type="range" name="y" min="0" max="600" value={selectedShape.y || 0} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label>
              <span>Rotation (Deg)</span>
              <span>{Math.round(selectedShape.rotation || 0)}°</span>
            </label>
            <input type="range" name="rotation" min="0" max="360" value={selectedShape.rotation || 0} onChange={handleChange} />
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
              {[0, 45, 90, 180, 270].map(angle => (
                <button
                  key={angle}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '4px', fontSize: '11px', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => updateShape(selectedShape.id, { rotation: angle })}
                >
                  {angle}°
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label>
              <span>Scale X</span>
              <span>{(selectedShape.scaleX || 1).toFixed(2)}x</span>
            </label>
            <input type="range" name="scaleX" min="0.1" max="5" step="0.1" value={selectedShape.scaleX || 1} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label>
              <span>Scale Y</span>
              <span>{(selectedShape.scaleY || 1).toFixed(2)}x</span>
            </label>
            <input type="range" name="scaleY" min="0.1" max="5" step="0.1" value={selectedShape.scaleY || 1} onChange={handleChange} />
          </div>
        </>
      )}

      {mode === '3D' && (
        <>
          <div className="input-group">
            <label>
              <span>Color</span>
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="color" 
                name="color" 
                value={selectedShape.color || '#3b82f6'} 
                onChange={handleChange}
                style={{ flex: 1, height: '32px', padding: '0', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginTop: '16px' }}>
            <label>
              <span>Display Style</span>
            </label>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-dark)', padding: '4px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <button 
                onClick={() => updateShape(selectedShape.id, { wireframe: false })}
                style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '4px', border: 'none', background: !selectedShape.wireframe ? 'var(--accent)' : 'transparent', color: !selectedShape.wireframe ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}
              >
                Solid
              </button>
              <button 
                onClick={() => updateShape(selectedShape.id, { wireframe: true })}
                style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '4px', border: 'none', background: selectedShape.wireframe ? 'var(--accent)' : 'transparent', color: selectedShape.wireframe ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}
              >
                Wireframe
              </button>
            </div>
          </div>
          
          {selectedShape.wireframe && (
            <>
              <div className="input-group" style={{ marginTop: '16px' }}>
                <label>
                  <span>Wireframe Color</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    name="edgeColor" 
                    value={selectedShape.edgeColor || '#3b82f6'} 
                    onChange={handleChange}
                    style={{ flex: 1, height: '32px', padding: '0', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                  />
                </div>
              </div>
              
              <div className="input-group">
                <label>
                  <span>Wireframe Thickness</span>
                  <span>{selectedShape.edgeWidth || 1}</span>
                </label>
                <input type="range" name="edgeWidth" min="1" max="10" step="1" value={selectedShape.edgeWidth || 1} onChange={handleChange} />
              </div>
            </>
          )}
          
          <div className="input-group" style={{ marginTop: '16px' }}>
            <label>
              <span>Rotation X</span>
              <span>{((selectedShape.rotationX || 0) * (180/Math.PI)).toFixed(0)}°</span>
            </label>
            <input type="range" name="rotationX" min="0" max={Math.PI * 2} step={0.01} value={selectedShape.rotationX || 0} onChange={handleChange} />
          </div>
          
          <div className="input-group">
            <label>
              <span>Rotation Y</span>
              <span>{((selectedShape.rotationY || 0) * (180/Math.PI)).toFixed(0)}°</span>
            </label>
            <input type="range" name="rotationY" min="0" max={Math.PI * 2} step={0.01} value={selectedShape.rotationY || 0} onChange={handleChange} />
          </div>
          
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', marginTop: '16px', padding: '8px', cursor: 'pointer', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px dashed #3b82f6' }}
            onClick={() => updateAllShapes({ 
              color: selectedShape.color, 
              wireframe: selectedShape.wireframe, 
              edgeColor: selectedShape.edgeColor, 
              edgeWidth: selectedShape.edgeWidth 
            })}
          >
            Apply Style to All Shapes
          </button>
        </>
      )}

      <div className="section-title" style={{ marginTop: '32px' }}>Actions</div>
      
      {(mode !== '3D') && (
        <>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Align to Canvas</label>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
            <button className="btn btn-secondary" style={{ flex: 1, padding: '6px' }} onClick={() => updateShape(selectedShape.id, { x: 400 })} title="Center X">
              <AlignCenter size={14} />
            </button>
            <button className="btn btn-secondary" style={{ flex: 1, padding: '6px' }} onClick={() => updateShape(selectedShape.id, { y: 300 })} title="Center Y">
              <AlignHorizontalSpaceBetween size={14} />
            </button>
            <button className="btn btn-secondary" style={{ flex: 1, padding: '6px' }} onClick={() => updateShape(selectedShape.id, { x: 50 })} title="Left">
              <AlignLeft size={14} />
            </button>
            <button className="btn btn-secondary" style={{ flex: 1, padding: '6px' }} onClick={() => updateShape(selectedShape.id, { x: 750 })} title="Right">
              <AlignRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1, padding: '8px' }} 
              onClick={() => reorderShape(selectedShape.id, 'up')}
              title="Bring Forward"
            >
              <ArrowUp size={16} /> Forward
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1, padding: '8px' }} 
              onClick={() => reorderShape(selectedShape.id, 'down')}
              title="Send Backward"
            >
              <ArrowDown size={16} /> Backward
            </button>
          </div>
        </>
      )}

      <button 
        className="btn" 
        style={{ width: '100%', backgroundColor: '#ef4444', color: 'white' }} 
        onClick={() => deleteShape(selectedShape.id)}
      >
        <Trash2 size={16} /> Delete Shape
      </button>
    </div>
  );
}
