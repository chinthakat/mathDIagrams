import React, { useState } from 'react';
import { Trash2, ArrowUp, ArrowDown, AlignCenter, AlignLeft, AlignRight, AlignHorizontalSpaceBetween, AlignVerticalSpaceBetween, Image as ImageIcon, Sparkles } from 'lucide-react';
import { ObjectRegistry } from '../registry/objectRegistry';
import { GET_ICON } from '../registry/iconRegistry';

const PRESET_COLORS = [
  'transparent', '#ffffff', '#000000', '#94a3b8', 
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

export default function PropertiesPanel({ selectedShape, updateShape, updateAllShapes, deleteShape, reorderShape, mode, openIconPicker }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [isGeneratingProp, setIsGeneratingProp] = useState(false);
  const [propGenError, setPropGenError] = useState('');

  if (!selectedShape) {
    return (
      <div className="properties-panel">
        <div className="empty-state">
          <div>Select a shape to view properties</div>
        </div>
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

  return (
    <div className="properties-panel">
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
