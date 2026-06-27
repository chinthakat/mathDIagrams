import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Undo, Redo, Download, Compass, Plus, X, Grid, Sliders, Layout, Monitor, Map as MapIcon, Play, Trash2, Smile } from 'lucide-react';
import { ObjectRegistry, getCategories } from '../registry/objectRegistry';
import { MapTemplates } from '../registry/MapTemplates';
import CanvasEditor2D from './CanvasEditor2D';
import PropertiesPanel from './PropertiesPanel';
import TabBar from './TabBar';
import AIMapGeneratorModal from './AIMapGeneratorModal';
import ClipArtPanel from './ClipArtPanel';

export default function MapEditor({ globalMode, setGlobalMode, globalLoadedData, setGlobalLoadedData }) {
  const [mapTheme, setMapTheme] = useState('paper');
  const [snapToGrid, setSnapToGrid] = useState(false);

  // AI Generator States
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);

  // Tab / Document Management State
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('mapMakerDocs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved map documents");
      }
    }
    return [{ id: 'map-' + Date.now(), name: 'Map Diagram 1', shapes: [], theme: 'paper' }];
  });

  const [activeDocId, setActiveDocId] = useState(() => {
    const savedId = localStorage.getItem('mapMakerActiveDoc');
    return savedId || documents[0]?.id;
  });

  const activeDoc = documents.find(d => d.id === activeDocId) || documents[0];
  const shapes = activeDoc?.shapes || [];

  const [selectedId, setSelectedId] = useState(null);
  const stageRef = useRef(null);

  // Validate and correct activeDocId if it gets out of sync (e.g. storage inconsistencies)
  useEffect(() => {
    if (documents.length > 0 && !documents.some(d => d.id === activeDocId)) {
      setActiveDocId(documents[0].id);
    }
  }, [documents, activeDocId]);

  // Sync background theme with the active document's saved theme
  useEffect(() => {
    if (activeDoc && activeDoc.theme) {
      setMapTheme(activeDoc.theme);
    }
  }, [activeDocId]);

  // Auto-Save Effect
  useEffect(() => {
    localStorage.setItem('mapMakerDocs', JSON.stringify(documents));
    localStorage.setItem('mapMakerActiveDoc', activeDocId);
  }, [documents, activeDocId]);

  // Document actions
  const createDoc = () => {
    const newId = 'map-' + Date.now();
    const newName = `Map Diagram ${documents.length + 1}`;
    setDocuments([...documents, { id: newId, name: newName, shapes: [], theme: 'paper' }]);
    setActiveDocId(newId);
    setSelectedId(null);
  };

  const deleteDoc = (id) => {
    if (documents.length <= 1) return;
    const newDocs = documents.filter(d => d.id !== id);
    setDocuments(newDocs);
    if (activeDocId === id) {
      setActiveDocId(newDocs[0].id);
      setSelectedId(null);
    }
  };

  const renameDoc = (id, newName) => {
    setDocuments(documents.map(d => d.id === id ? { ...d, name: newName } : d));
  };

  const updateDocTheme = (theme) => {
    setMapTheme(theme);
    setDocuments(documents.map(d => d.id === activeDocId ? { ...d, theme } : d));
  };

  // State update helper with Undo/Redo tracking
  const setShapes = useCallback((newShapes, skipHistory = false) => {
    setDocuments(prevDocs => prevDocs.map(doc => {
      if (doc.id === activeDocId) {
        let newHistory = doc.history || [];
        let newFuture = doc.future || [];
        
        if (!skipHistory) {
          newHistory = [...newHistory, doc.shapes || []].slice(-20);
          newFuture = [];
        }
        
        return { 
          ...doc, 
          shapes: newShapes,
          history: newHistory,
          future: newFuture
        };
      }
      return doc;
    }));
  }, [activeDocId]);

  const [sidebarTab, setSidebarTab] = useState('shapes');
  const [sidebarWidth, setSidebarWidth] = useState(220);

  const onResizeMouseDown = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const onMove = (mv) => {
      const next = Math.min(520, Math.max(180, startWidth + mv.clientX - startX));
      setSidebarWidth(next);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [sidebarWidth]);

  const addClipart = (item) => {
    const newId = Date.now().toString();
    setShapes([...shapes, { id: newId, type: 'rasterImage', x: 250, y: 250, src: item.url, width: 80, height: 80 }]);
    setSelectedId(newId);
  };

  const addShape = (type) => {
    const newId = Date.now().toString();
    const regObj = ObjectRegistry[type];
    const baseProps = { id: newId, type, x: 250, y: 250 };
    const newShape = { ...baseProps, ...(regObj?.defaultProps || {}) };
    setShapes([...shapes, newShape]);
    setSelectedId(newId);
  };

  const handleAppendTemplate = (templateId) => {
    const template = MapTemplates.find(t => t.id === templateId);
    if (!template) return;
    
    // Create new IDs for appended shapes to avoid collisions
    const newShapes = template.shapes.map(shape => ({
      ...shape,
      id: `${shape.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));

    setShapes([...shapes, ...newShapes]);
  };

  const updateShape = (id, newProps) => {
    setShapes(shapes.map(s => s.id === id ? { ...s, ...newProps } : s));
  };

  const deleteShape = (id) => {
    setShapes(shapes.filter(s => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const reorderShape = (id, direction) => {
    const index = shapes.findIndex(s => s.id === id);
    if (index === -1) return;
    
    const newShapes = [...shapes];
    const shape = newShapes.splice(index, 1)[0];
    
    if (direction === 'up') {
      newShapes.push(shape); // Move to front
    } else {
      newShapes.unshift(shape); // Move to back
    }
    setShapes(newShapes);
  };

  // Undo / Redo logic
  const handleUndo = useCallback(() => {
    const doc = activeDoc;
    if (!doc.history || doc.history.length === 0) return;
    
    const previousShapes = doc.history[doc.history.length - 1];
    const newHistory = doc.history.slice(0, -1);
    const newFuture = [doc.shapes || [], ...(doc.future || [])];
    
    setDocuments(prevDocs => prevDocs.map(d => d.id === activeDocId ? {
      ...d,
      shapes: previousShapes,
      history: newHistory,
      future: newFuture
    } : d));
    setSelectedId(null);
  }, [activeDoc, activeDocId]);

  const handleRedo = useCallback(() => {
    const doc = activeDoc;
    if (!doc.future || doc.future.length === 0) return;
    
    const nextShapes = doc.future[0];
    const newFuture = doc.future.slice(1);
    const newHistory = [...(doc.history || []), doc.shapes || []];
    
    setDocuments(prevDocs => prevDocs.map(d => d.id === activeDocId ? {
      ...d,
      shapes: nextShapes,
      history: newHistory,
      future: newFuture
    } : d));
    setSelectedId(null);
  }, [activeDoc, activeDocId]);

  // Keyboard Shortcuts (Delete, Undo/Redo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          deleteShape(selectedId);
        }
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) handleRedo();
          else handleUndo();
        }
        if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shapes, selectedId, activeDocId, handleUndo, handleRedo]);

  // High resolution PNG and vector exports
  const handleExport = (format) => {
    if (stageRef.current) {
      if (format === 'png') {
        const uri = stageRef.current.toDataURL({ pixelRatio: 3 });
        const link = document.createElement('a');
        link.download = `${activeDoc.name}.png`;
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'svg') {
        alert('SVG export is only supported in main vector mode. Download as PNG for high resolution print.');
      } else if (format === 'json') {
        const jsonData = JSON.stringify(activeDoc, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${activeDoc.name}.json`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }
  };

  const handleSaveToLibrary = async () => {
    try {
      const response = await fetch('/api/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          title: `Map Generation - ${new Date().toLocaleTimeString()}`,
          category: '2D_MAP',
          request: { type: 'manual_save' },
          payload: { shapes: activeDoc.shapes }
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      alert('Saved Map to Library successfully!');
    } catch(e) {
      console.error(e);
      alert('Failed to save to Library');
    }
  };

  useEffect(() => {
    if (globalLoadedData && globalLoadedData.category === '2D_MAP') {
      setShapes(globalLoadedData.payload.shapes);
      setGlobalLoadedData(null);
    }
  }, [globalLoadedData, setShapes, setGlobalLoadedData]);

  // Process AI Insertion
  const handleAddQuestionToCanvas = () => {
    if (!aiQuestion) return;
    const newId = 'ai-text-' + Date.now();
    const textFill = ['blueprint', 'dark'].includes(mapTheme) ? '#ffffff' : '#1e293b';
    const newShape = {
      id: newId,
      type: 'text',
      x: 60,
      y: 60,
      text: `Question: ${aiQuestion}\nAnswer: ${aiAnswer}`,
      fontSize: 13,
      fill: textFill,
      fontFamily: 'Inter',
      rotation: 0
    };
    setShapes([...shapes, newShape]);
    setSelectedId(newId);
  };

  const mapCategories = ['Roads & Paths', 'Nature & Water', 'Buildings', 'Icons & Markers', 'Map Elements'];
  const [activeCategory, setActiveCategory] = useState(mapCategories[0]);
  const categories = getCategories();
  const currentCategoryElements = categories[activeCategory] || [];

  // Background selection list swatches definitions
  const backgroundLibrary = [
    { id: 'paper', name: 'Standard Paper', bg: '#fcfaf7', border: '#e6dcb9', isDark: false },
    { id: 'parchment', name: 'Vintage Parchment', bg: '#f4ebd0', border: '#c3ae84', isDark: false },
    { id: 'blueprint', name: 'Draft Blueprint', bg: '#0b1d3a', border: '#1e4888', isDark: true },
    { id: 'topography', name: 'Topographic Chart', bg: '#faf8f2', border: '#d9cbaf', isDark: false },
    { id: 'grassland', name: 'Grassland Meadow', bg: '#f0fdf4', border: '#86efac', isDark: false },
    { id: 'desert', name: 'Golden Desert', bg: '#fffbeb', border: '#fef08a', isDark: false },
    { id: 'ocean', name: 'Ocean Waves', bg: '#f0f9ff', border: '#7dd3fc', isDark: false },
    { id: 'dark', name: 'Modern Dark', bg: '#0f172a', border: '#1e293b', isDark: true }
  ];

  const selectedShape = shapes.find(s => s.id === selectedId);

  return (
    <div className="app-container" style={{ gridTemplateColumns: `${sidebarWidth}px 1fr 300px` }}>
      {/* Top bar header */}
      <div className="sub-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', background: '#1e293b', borderBottom: '1px solid #334155' }}>
        <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>
          Map Editor Tools
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn-icon" onClick={handleUndo} title="Undo (Ctrl+Z)" disabled={!activeDoc?.history?.length}>
            <Undo size={18} />
          </button>
          <button className="btn-icon" onClick={handleRedo} title="Redo (Ctrl+Y)" disabled={!activeDoc?.future?.length}>
            <Redo size={18} />
          </button>
        </div>
      </div>

      {/* Left Sidebar */}
      <div className="sidebar" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '16px', position: 'relative' }}>
        {/* Drag-to-resize handle */}
        <div
          onMouseDown={onResizeMouseDown}
          style={{ position: 'absolute', top: 0, right: 0, width: '5px', height: '100%', cursor: 'col-resize', zIndex: 10 }}
          title="Drag to resize"
        />
        <div style={{ flex: 1 }}>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
            <button
              onClick={() => setSidebarTab('shapes')}
              style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', fontSize: '11px', fontWeight: 700,
                borderColor: sidebarTab === 'shapes' ? 'var(--accent)' : 'var(--border-color)',
                background:  sidebarTab === 'shapes' ? 'rgba(99,102,241,0.15)' : 'var(--bg-dark)',
                color:       sidebarTab === 'shapes' ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >Shapes</button>
            <button
              onClick={() => setSidebarTab('clipart')}
              style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                borderColor: sidebarTab === 'clipart' ? 'var(--accent)' : 'var(--border-color)',
                background:  sidebarTab === 'clipart' ? 'rgba(99,102,241,0.15)' : 'var(--bg-dark)',
                color:       sidebarTab === 'clipart' ? 'var(--accent)' : 'var(--text-muted)',
              }}
            ><Smile size={12} /> Clip Art</button>
          </div>

          {sidebarTab === 'clipart' ? (
            <ClipArtPanel onInsert={addClipart} />
          ) : (<>

          {/* Section: Map Grid Configuration */}
          <div className="shape-grid-section" style={{ marginBottom: '20px' }}>
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <Sliders size={12} /> Grid & Alignment
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-dark)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'white' }}>
                <input 
                  type="checkbox" 
                  checked={snapToGrid} 
                  onChange={e => setSnapToGrid(e.target.checked)} 
                  style={{ accentColor: '#10b981' }}
                />
                Snap to Grid (20px)
              </label>
            </div>
          </div>

          {/* Section: Templates */}
          <div className="shape-grid-section" style={{ marginBottom: '24px' }}>
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <Plus size={12} /> Templates
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {MapTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleAppendTemplate(template.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-dark)',
                    border: '1px solid var(--border-color)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                  className="bg-theme-card"
                >
                  <span style={{ color: '#10b981' }}><MapIcon size={14} /></span>
                  <span style={{ fontSize: '12px' }}>{template.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Selectable Map Background Library */}
          <div className="shape-grid-section" style={{ marginBottom: '24px' }}>
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <Layout size={12} /> Map Background Library
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {backgroundLibrary.map(item => (
                <div
                  key={item.id}
                  onClick={() => updateDocTheme(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-dark)',
                    border: mapTheme === item.id ? '2px solid #10b981' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: mapTheme === item.id ? '0 0 10px rgba(16, 185, 129, 0.2)' : 'none'
                  }}
                  className="bg-theme-card"
                >
                  {/* Miniature swatch preview */}
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      background: item.bg,
                      border: `1px solid ${item.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8px',
                      color: item.isDark ? '#fff' : '#000',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}
                  >
                    G
                  </div>
                  <span style={{ fontSize: '12px', color: 'white', fontWeight: mapTheme === item.id ? 600 : 400 }}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          </>)}

        </div>

        {/* Export Palette */}
        <div style={{ flexShrink: 0, marginTop: '20px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
          <div className="section-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Export Map</div>
          <button className="btn" style={{ width: '100%', marginBottom: '6px', display: 'flex', justifyContent: 'center', gap: '8px', padding: '8px', background: '#10b981' }} onClick={() => handleExport('png')}>
            <Download size={16} /> Export High-Res PNG
          </button>
          <button className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '8px' }} onClick={() => handleExport('json')}>
            <Download size={16} /> Save Document JSON
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="canvas-area" style={{ flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}>
        <TabBar 
          documents={documents}
          activeDocId={activeDocId}
          setActiveDocId={setActiveDocId}
          createDoc={createDoc}
          deleteDoc={deleteDoc}
          renameDoc={renameDoc}
        />
        
        {/* Map Elements Toolbar (Categorized) */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)' }}>
          
          {/* Category Tabs */}
          <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--border-color)' }} className="no-scrollbar">
            {mapCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeCategory === cat ? '2px solid #10b981' : '2px solid transparent',
                  color: activeCategory === cat ? '#10b981' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: activeCategory === cat ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tools for Active Category */}
          <div 
            className="no-scrollbar" 
            style={{ 
              display: 'flex', 
              gap: '8px', 
              alignItems: 'center', 
              padding: '8px 16px', 
              overflowX: 'auto',
              width: '100%',
              minHeight: '48px'
            }}
          >
            {currentCategoryElements.map(shape => (
              <button
                key={shape.id}
                onClick={() => addShape(shape.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                className="hover-brighten"
                title={`Add ${shape.name}`}
              >
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center' }}>
                  {shape.icon}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 500 }}>{shape.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
          <CanvasEditor2D 
            shapes={shapes} 
            setShapes={(newShapesOrFn, skip) => setShapes(typeof newShapesOrFn === 'function' ? newShapesOrFn(shapes) : newShapesOrFn, skip)}
            selectedId={selectedId} 
            setSelectedId={setSelectedId}
            stageRef={stageRef}
            showGrid={true}
            mapTheme={mapTheme}
            setMapTheme={updateDocTheme}
            hideLocalControls={true}
          />

          {/* Floating AI Question Card */}
          {aiQuestion && (
            <div 
              style={{
                position: 'absolute',
                bottom: '24px',
                left: '24px',
                width: '380px',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px',
                color: 'white',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                zIndex: 100
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} /> AI Math Question
                </span>
                <button 
                  onClick={() => { setAiQuestion(''); setAiAnswer(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ fontSize: '12.5px', lineHeight: 1.5, color: '#f8fafc' }}>
                {aiQuestion}
              </div>

              {/* Show/Hide Answer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button 
                  onClick={() => setShowAnswer(!showAnswer)}
                  style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '11px', cursor: 'pointer', textAlign: 'left', outline: 'none' }}
                >
                  {showAnswer ? 'Hide Answer' : 'Show Answer'}
                </button>
                {showAnswer && (
                  <div style={{ fontSize: '12px', padding: '6px 10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#a7f3d0', borderRadius: '4px' }}>
                    <strong>Answer:</strong> {aiAnswer}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    navigator.clipboard.writeText(aiQuestion);
                    alert("Question text copied to clipboard!");
                  }}
                  style={{ flex: 1, padding: '6px', fontSize: '11px' }}
                >
                  Copy Text
                </button>
                <button 
                  className="btn" 
                  onClick={handleAddQuestionToCanvas}
                  style={{ flex: 1, padding: '6px', fontSize: '11px', background: '#10b981' }}
                >
                  Insert on Map
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ flexShrink: 0, marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <div className="section-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Export & Save</div>
          
          <button className="btn" style={{ width: '100%', marginBottom: '6px', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px', background: '#6366f1' }} onClick={handleSaveToLibrary}>
            <Download size={16} /> Save Map to Library
          </button>
          
          <button className="btn" style={{ width: '100%', marginBottom: '6px', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px' }} onClick={() => handleExport('png')}>
            <Download size={16} /> Export PNG
          </button>
          
          <button className="btn" style={{ width: '100%', marginBottom: '6px', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px' }} onClick={() => handleExport('json')}>
            <Download size={16} /> Export JSON
          </button>

          <button 
            className="btn" 
            style={{ width: '100%', marginBottom: '6px', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px', background: 'transparent', border: '1px solid #ef4444', color: '#f87171' }} 
            onClick={() => {
              if (window.confirm("Are you sure you want to clear this map?")) {
                setShapes([]);
                setSelectedId(null);
                setAiQuestion('');
                setAiAnswer('');
              }
            }}
          >
            <Trash2 size={16} /> Clear Canvas
          </button>

          <div className="section-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '16px' }}>AI Generator</div>
          <button className="btn" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px' }} onClick={() => setIsAIModalOpen(true)}>
            <Play size={16} /> Auto-Generate Map
          </button>
        </div>
      </div>

      {/* Right Properties Panel */}
      <PropertiesPanel 
        selectedShape={selectedShape}
        updateShape={updateShape}
        deleteShape={deleteShape}
        reorderShape={reorderShape}
        mode="Map"
        openIconPicker={(currentIconName, callback) => {
          alert("Map elements can customize text labels and colors in the properties input.");
        }}
      />

      {/* AI Map Generator Modal */}
      <AIMapGeneratorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onGenerate={(data) => {
          setAiQuestion(data.question);
          setAiAnswer(data.answer);
          setShowAnswer(false);
          updateDocTheme(data.theme);
          setShapes(data.shapes);
          setSelectedId(null);
        }}
      />
    </div>
  );
}
