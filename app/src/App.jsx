import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Undo, Redo, Play, Compass, Scan } from 'lucide-react';
import Sidebar from './components/Sidebar';
import PropertiesPanel from './components/PropertiesPanel';
import CanvasEditor2D from './components/CanvasEditor2D';
import CanvasEditor3D from './components/CanvasEditor3D';
import TabBar from './components/TabBar';
import IconPickerModal from './components/IconPickerModal';
import AIGeneratorModal from './components/AIGeneratorModal';
import ThreeDQuestionGenerator from './components/3DQuestionGenerator';
import DiagramWizardModal from './components/DiagramWizardModal';
import QuestionPanel from './components/QuestionPanel';
import SampleImageModal from './components/SampleImageModal';
import { ObjectRegistry } from './registry/objectRegistry';
import TopNavigation from './components/TopNavigation';

function App({ globalMode, setGlobalMode, globalLoadedData, setGlobalLoadedData }) {
  const mode = globalMode || '2D';
  const setMode = setGlobalMode || (() => {});
  const is2D = mode === '2D';
  
  // 2D Editor Sub-Tabs
  const [subMode, setSubMode] = useState('Geometry');

  // Icon Picker Modal State
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [iconPickerCallback, setIconPickerCallback] = useState(null);

  // Wizard Modal State
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Sample Image Clone Modal State
  const [isSampleImageOpen, setIsSampleImageOpen] = useState(false);

  // AI Generator Modal State
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [is3DQuestionGeneratorOpen, setIs3DQuestionGeneratorOpen] = useState(false);
  const [loadedQuizData, setLoadedQuizData] = useState(null);

  // MCQ question state
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isRegeneratingQuestion, setIsRegeneratingQuestion] = useState(false);
  
  // Tab Management State
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('mathDiagramsDocs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved documents");
      }
    }
    return [{ id: 'doc-' + Date.now(), name: 'Diagram 1', shapes2D: [], shapes3D: [] }];
  });
  const [activeDocId, setActiveDocId] = useState(() => {
    const savedId = localStorage.getItem('mathDiagramsActiveDoc');
    return savedId || documents[0]?.id;
  });

  const activeDoc = documents.find(d => d.id === activeDocId) || documents[0];

  // Validate and correct activeDocId if it gets out of sync (e.g. storage inconsistencies)
  useEffect(() => {
    if (documents.length > 0 && !documents.some(d => d.id === activeDocId)) {
      setActiveDocId(documents[0].id);
    }
  }, [documents, activeDocId]);
  const shapes2D = activeDoc.shapes2D || [];
  const shapes3D = activeDoc.shapes3D || [];

  const [selectedId2D, setSelectedId2D] = useState(null);
  const [selectedId3D, setSelectedId3D] = useState(null);

  const [recentlyUsed, setRecentlyUsed] = useState([]);

  const stageRef2D = useRef(null);
  const canvasRef3D = useRef(null);

  // Auto-Save Effect
  useEffect(() => {
    localStorage.setItem('mathDiagramsDocs', JSON.stringify(documents));
    localStorage.setItem('mathDiagramsActiveDoc', activeDocId);
  }, [documents, activeDocId]);

  // Tab Actions
  const createDoc = () => {
    const newId = 'doc-' + Date.now();
    const newName = `Diagram ${documents.length + 1}`;
    setDocuments([...documents, { id: newId, name: newName, shapes2D: [], shapes3D: [] }]);
    setActiveDocId(newId);
    setSelectedId2D(null);
  };

  const deleteDoc = (id) => {
    if (documents.length <= 1) return; // Prevent deleting the last document
    const newDocs = documents.filter(d => d.id !== id);
    setDocuments(newDocs);
    if (activeDocId === id) {
      setActiveDocId(newDocs[0].id);
      setSelectedId2D(null);
    }
  };

  const renameDoc = (id, newName) => {
    setDocuments(documents.map(d => d.id === id ? { ...d, name: newName } : d));
  };

  // Helper to update active document shapes
  const setActiveShapes = useCallback((newShapes, is3D = false, skipHistory = false) => {
    setDocuments(prevDocs => prevDocs.map(doc => {
      if (doc.id === activeDocId) {
        if (is3D) return { ...doc, shapes3D: newShapes };
        
        let newHistory = doc.history2D || [];
        let newFuture = doc.future2D || [];
        
        if (!skipHistory) {
          newHistory = [...newHistory, doc.shapes2D].slice(-20);
          newFuture = [];
        }
        
        return { 
          ...doc, 
          shapes2D: newShapes,
          history2D: newHistory,
          future2D: newFuture
        };
      }
      return doc;
    }));
  }, [activeDocId]);

  const addShape = (type) => {
    const newId = Date.now().toString();
    
    if (is2D) {
      if (type === 'imageIcon') {
        setIconPickerCallback(() => (selectedIcon) => {
          const regObj = ObjectRegistry.imageIcon;
          const baseProps = { id: newId, type: 'imageIcon', x: 400, y: 300 };
          const newShape = { ...baseProps, ...(regObj?.defaultProps || {}), iconName: selectedIcon };
          setActiveShapes([...shapes2D, newShape]);
          setSelectedId2D(newId);
          setRecentlyUsed(prev => {
            const updated = [type, ...prev.filter(id => id !== type)];
            return updated.slice(0, 10);
          });
          setIsIconPickerOpen(false);
        });
        setIsIconPickerOpen(true);
        return;
      }

      const regObj = ObjectRegistry[type];
      const baseProps = { id: newId, type, x: 400, y: 300 };
      const newShape = { ...baseProps, ...(regObj?.defaultProps || {}) };
      setActiveShapes([...shapes2D, newShape]);
      setSelectedId2D(newId);

      // Track recently used
      setRecentlyUsed(prev => {
        const updated = [type, ...prev.filter(id => id !== type)];
        return updated.slice(0, 10); // Keep last 10
      });
    } else {
      const newShape = {
        id: newId,
        type,
        color: '#3b82f6',
        position: [0, 0, 0],
        rotationX: 0,
        rotationY: 0
      };
      setActiveShapes([...shapes3D, newShape], true);
      setSelectedId3D(newId);
    }
  };

  const updateShape = (id, newProps) => {
    if (is2D) {
      setActiveShapes(shapes2D.map(s => s.id === id ? { ...s, ...newProps } : s));
    } else {
      setActiveShapes(shapes3D.map(s => s.id === id ? { ...s, ...newProps } : s), true);
    }
  };

  const deleteShape = (id) => {
    if (is2D) {
      setActiveShapes(shapes2D.filter(s => s.id !== id));
      if (selectedId2D === id) setSelectedId2D(null);
    } else {
      setActiveShapes(shapes3D.filter(s => s.id !== id), true);
      if (selectedId3D === id) setSelectedId3D(null);
    }
  };

  const reorderShape = (id, direction) => {
    if (is2D) {
      const index = shapes2D.findIndex(s => s.id === id);
      if (index === -1) return;
      
      const newShapes = [...shapes2D];
      const shape = newShapes.splice(index, 1)[0];
      
      if (direction === 'up') {
        newShapes.push(shape); // Move to end (top)
      } else {
        newShapes.unshift(shape); // Move to start (bottom)
      }
      setActiveShapes(newShapes);
    }
  };

  const handleUndo = useCallback(() => {
    const doc = activeDoc;
    if (!doc.history2D || doc.history2D.length === 0) return;
    
    const previousShapes = doc.history2D[doc.history2D.length - 1];
    const newHistory = doc.history2D.slice(0, -1);
    const newFuture = [doc.shapes2D || [], ...(doc.future2D || [])];
    
    setDocuments(prevDocs => prevDocs.map(d => d.id === activeDocId ? {
      ...d,
      shapes2D: previousShapes,
      history2D: newHistory,
      future2D: newFuture
    } : d));
    setSelectedId2D(null);
  }, [activeDoc, activeDocId]);

  const handleRedo = useCallback(() => {
    const doc = activeDoc;
    if (!doc.future2D || doc.future2D.length === 0) return;
    
    const nextShapes = doc.future2D[0];
    const newFuture = doc.future2D.slice(1);
    const newHistory = [...(doc.history2D || []), doc.shapes2D || []];
    
    setDocuments(prevDocs => prevDocs.map(d => d.id === activeDocId ? {
      ...d,
      shapes2D: nextShapes,
      history2D: newHistory,
      future2D: newFuture
    } : d));
    setSelectedId2D(null);
  }, [activeDoc, activeDocId]);

  const clipboardRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input
      if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId2D) {
          setActiveShapes(shapes2D.filter(s => s.id !== selectedId2D));
          setSelectedId2D(null);
        }
        if (selectedId3D) {
          setActiveShapes(shapes3D.filter(s => s.id !== selectedId3D), true);
          setSelectedId3D(null);
        }
      }

      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'c') {
          const selected = shapes2D.find(s => s.id === selectedId2D);
          if (selected) clipboardRef.current = JSON.parse(JSON.stringify(selected));
        }
        if (key === 'v') {
          if (clipboardRef.current && is2D) {
            const pastedShape = {
              ...clipboardRef.current,
              id: Date.now().toString(),
              x: clipboardRef.current.x + 20,
              y: clipboardRef.current.y + 20
            };
            setActiveShapes([...shapes2D, pastedShape]);
            setSelectedId2D(pastedShape.id);
            clipboardRef.current = pastedShape;
          }
        }
        if (key === 'z') {
          e.preventDefault();
          if (e.shiftKey) handleRedo();
          else handleUndo();
        }
        if (key === 'y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shapes2D, shapes3D, selectedId2D, selectedId3D, activeDocId, mode, setActiveShapes, handleUndo, handleRedo]);

  const handleExport = (format = 'png') => {
    if (is2D && stageRef2D.current) {
      if (format === 'png') {
        const uri = stageRef2D.current.toDataURL({ pixelRatio: 3 });
        const link = document.createElement('a');
        link.download = `${activeDoc.name}.png`;
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'svg') {
        const svgString = stageRef2D.current.toSVG();
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${activeDoc.name}.svg`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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
      } else if (format === 'pdf') {
        alert('PDF export requires additional libraries (like jsPDF). This is a placeholder feature.');
      }
    }
  };

  const handleSaveToLibrary = async () => {
    try {
      const payload = is2D 
        ? { shapes: activeDoc.shapes2D }
        : { shapes: activeDoc.shapes3D };
        
      let category = '2D_GEOMETRY';
      if (mode === 'Map') category = '2D_MAP';
      else if (mode === 'Equations') category = 'EQUATIONS';
      else if (mode === '3D') category = '3D_ELEVATIONS';
      
      const response = await fetch('/api/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          title: `${mode} Generation - ${new Date().toLocaleTimeString()}`,
          category: category,
          request: { type: 'manual_save' },
          payload: payload
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      alert('Saved to Library successfully!');
    } catch(e) {
      console.error(e);
      alert('Failed to save to Library');
    }
  };

  // Called by AI modals with a raw objects array from Claude
  const handleAIGenerate = (objects) => {
    if (!objects || objects.length === 0) return;
    const newShapes = objects.map(o => ({
      ...o,
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
    }));
    setActiveShapes([...shapes2D, ...newShapes]);
    setSelectedId2D(newShapes[0].id);
  };

  const selectedShape2D = shapes2D.find(s => s.id === selectedId2D);
  const selectedShape3D = shapes3D.find(s => s.id === selectedId3D);
  const selectedShape = is2D ? selectedShape2D : selectedShape3D;

  useEffect(() => {
    if (globalLoadedData) {
      if (globalLoadedData.category === '2D_GEOMETRY' || globalLoadedData.category === 'EQUATIONS') {
        setActiveShapes(globalLoadedData.payload.shapes, false);
      } else if (globalLoadedData.category === '3D_ELEVATIONS' || globalLoadedData.category === '3D_NET_QUIZ') {
        setLoadedQuizData(globalLoadedData);
        setIs3DQuestionGeneratorOpen(true);
      }
      setGlobalLoadedData(null);
    }
  }, [globalLoadedData, setActiveShapes, setGlobalLoadedData]);

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#0f172a', color: '#f8fafc', overflow: 'hidden' }}>
      <div className="sub-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', background: '#1e293b', borderBottom: '1px solid #334155' }}>
        <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500', display: 'flex', gap: '4px' }}>
          {mode === '2D' ? (
            <div style={{ display: 'flex', background: '#0f172a', borderRadius: '6px', padding: '2px' }}>
              <button 
                onClick={() => setSubMode('Geometry')}
                style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '4px', border: 'none', background: subMode === 'Geometry' ? '#3b82f6' : 'transparent', color: subMode === 'Geometry' ? 'white' : '#94a3b8', cursor: 'pointer', fontWeight: '500' }}
              >
                Geometry
              </button>
              <button 
                onClick={() => setSubMode('Equations')}
                style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '4px', border: 'none', background: subMode === 'Equations' ? '#8b5cf6' : 'transparent', color: subMode === 'Equations' ? 'white' : '#94a3b8', cursor: 'pointer', fontWeight: '500' }}
              >
                Equations
              </button>
            </div>
          ) : '3D Builder Tools'}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {mode === '3D' && (
            <button 
              className="btn" 
              onClick={() => setIs3DQuestionGeneratorOpen(true)}
              style={{ padding: '6px 12px', fontSize: '12px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontWeight: '600' }}
            >
              <Sparkles size={14} /> 3D Questions
            </button>
          )}
          {mode === '2D' && (
            <button 
              className="btn" 
              onClick={() => setIsWizardOpen(true)}
              style={{ padding: '6px 12px', fontSize: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontWeight: '600' }}
            >
              <Compass size={14} /> Diagram Wizard
            </button>
          )}
          {mode === '2D' && (
            <button
              className="btn"
              onClick={() => setIsSampleImageOpen(true)}
              style={{ padding: '6px 12px', fontSize: '12px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontWeight: '600' }}
            >
              <Scan size={14} /> Clone from Image
            </button>
          )}
          <div style={{ width: '1px', background: '#334155', margin: '0 4px' }} />
          <button className="btn-icon" onClick={handleUndo} title="Undo (Ctrl+Z)" disabled={!activeDoc.history2D?.length}>
            <Undo size={18} />
          </button>
          <button className="btn-icon" onClick={handleRedo} title="Redo (Ctrl+Y)" disabled={!activeDoc.future2D?.length}>
            <Redo size={18} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar 
          mode={mode === '2D' ? subMode : mode} 
          setMode={setMode} 
          addShape={addShape} 
          handleExport={handleExport}
          handleSaveToLibrary={handleSaveToLibrary}
          recentlyUsed={recentlyUsed}
          openAIGenerator={() => setIsAIGeneratorOpen(true)}
        />

      <div className="canvas-area" style={{ flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}>
        <TabBar
          documents={documents}
          activeDocId={activeDocId}
          setActiveDocId={setActiveDocId}
          createDoc={createDoc}
          deleteDoc={deleteDoc}
          renameDoc={renameDoc}
        />
          <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            {is2D ? (
              <CanvasEditor2D
                shapes={shapes2D}
                setShapes={(newShapes, skipHistory = false) => setActiveShapes(newShapes, false, skipHistory)}
                selectedId={selectedId2D}
                setSelectedId={setSelectedId2D}
                stageRef={stageRef2D}
                showGrid={mode === 'Equations'}
              />
            ) : (
              <CanvasEditor3D
                shapes={shapes3D}
                setShapes={(newShapes, skipHistory = false) => setActiveShapes(newShapes, true, skipHistory)}
                selectedId={selectedId3D}
                setSelectedId={setSelectedId3D}
                canvasRef={canvasRef3D}
              />
            )}
          </div>
          <QuestionPanel
            question={currentQuestion}
            onDismiss={() => setCurrentQuestion(null)}
            isRegenerating={isRegeneratingQuestion}
            onRegenerate={() => {}}
          />
      </div>

      <PropertiesPanel 
        selectedShape={selectedShape}
        updateShape={updateShape}
        deleteShape={deleteShape}
        reorderShape={reorderShape}
        mode={mode}
        openIconPicker={(currentIconName, callback) => {
          setIconPickerCallback(() => (selectedIcon) => {
            callback(selectedIcon);
            setIsIconPickerOpen(false);
          });
          setIsIconPickerOpen(true);
        }}
      />
      <IconPickerModal 
        isOpen={isIconPickerOpen} 
        onClose={() => setIsIconPickerOpen(false)} 
        onSelect={(iconName) => {
          if (iconPickerCallback) iconPickerCallback(iconName);
        }}
      />
      <AIGeneratorModal
        isOpen={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        onGenerate={handleAIGenerate}
        onQuestionGenerated={setCurrentQuestion}
      />
      <SampleImageModal
        isOpen={isSampleImageOpen}
        onClose={() => setIsSampleImageOpen(false)}
        onGenerate={handleAIGenerate}
        onQuestionGenerated={setCurrentQuestion}
      />
      <DiagramWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSelectTemplate={(shapes) => {
          const newShapes = shapes.map(s => ({
            ...s,
            id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9)
          }));
          setActiveShapes([...shapes2D, ...newShapes]);
        }}
        onQuestionGenerated={setCurrentQuestion}
      />
      {is3DQuestionGeneratorOpen && (
        <ThreeDQuestionGenerator 
          initialData={loadedQuizData}
          onClose={() => {
            setIs3DQuestionGeneratorOpen(false);
            setLoadedQuizData(null);
          }} 
          onSave={(generatedShapes) => {
            setActiveShapes(generatedShapes, true);
          }}
        />
      )}
    </div>
    </div>
  );
}

export default App;
