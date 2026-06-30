import React, { useState, useCallback } from 'react';
import { Download, Play, Box, Cylinder, Globe, Search, ChevronDown, ChevronUp, Compass, Triangle, Hexagon, Smile } from 'lucide-react';
import { ObjectRegistry, getCategories } from '../registry/objectRegistry';
import ClipArtPanel from './ClipArtPanel';

export default function Sidebar({ mode, setMode, addShape, addClipart, handleExport, handleSaveToLibrary, recentlyUsed = [], openAIGenerator }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [sidebarTab, setSidebarTab] = useState('shapes');
  const [sidebarWidth, setSidebarWidth] = useState(260);

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

  const rawCategories = getCategories();
  const categories = {};
  
  // Filter categories based on mode
  const allowedCategories2D = ['Basic Shapes', 'Geometry', 'Triangles', 'Arrows', 'Diagram Annotations', 'Math Engines', 'Logic & Problem Solving', 'Text & Annotation', 'Images & Icons', 'Measurement', 'Coordinate Geometry', '3D & Diagram', 'Place Value & Counting'];
  const allowedCategoriesEq = ['Fractions', 'Graphs & Data', 'Number Lines', 'Text & Annotation', 'Place Value & Counting'];

  Object.keys(rawCategories).forEach(cat => {
    if ((mode === '2D' || mode === 'Geometry') && allowedCategories2D.includes(cat)) {
      categories[cat] = rawCategories[cat];
    } else if (mode === 'Equations' && allowedCategoriesEq.includes(cat)) {
      categories[cat] = rawCategories[cat];
    }
  });

  const allShapes = Object.values(ObjectRegistry).filter(shape => {
    if (mode === '2D' || mode === 'Geometry') return allowedCategories2D.includes(shape.category);
    if (mode === 'Equations') return allowedCategoriesEq.includes(shape.category);
    return false;
  });

  const filteredShapes = allShapes.filter(shape => 
    shape.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    shape.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recentShapes = recentlyUsed.map(id => ObjectRegistry[id]).filter(Boolean);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="sidebar" style={{ width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth, overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative', flexShrink: 0 }}>
      {/* Drag-to-resize handle */}
      <div
        onMouseDown={onResizeMouseDown}
        style={{ position: 'absolute', top: 0, right: 0, width: '5px', height: '100%', cursor: 'col-resize', zIndex: 10, background: 'transparent' }}
        title="Drag to resize"
      />
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        {(mode === '2D' || mode === 'Geometry' || mode === 'Equations') ? (
          <>
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
              <ClipArtPanel onInsert={item => addClipart?.(item)} />
            ) : (
            <>
            <div className="modal-search" style={{ marginBottom: '16px', background: 'var(--bg-dark)', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
              <Search size={16} className="search-icon" style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search objects..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', padding: '8px', outline: 'none', fontSize: '13px' }}
              />
            </div>

            {searchTerm ? (
              <div className="shape-grid-section" style={{ marginBottom: '24px' }}>
                <div className="section-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Search Results</div>
                <div className="shape-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {filteredShapes.length > 0 ? (
                    filteredShapes.map(shape => (
                      <button key={shape.id} className="shape-card" onClick={() => addShape(shape.id)} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'white', transition: 'all 0.2s' }}>
                        <div className="shape-icon" style={{ color: 'var(--accent)' }}>{shape.icon}</div>
                        <div className="shape-name" style={{ fontSize: '11px', textAlign: 'center' }}>{shape.name}</div>
                      </button>
                    ))
                  ) : (
                    <div style={{ padding: '20px', color: '#64748b', gridColumn: 'span 2', textAlign: 'center', fontSize: '12px' }}>No shapes found.</div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {recentShapes.length > 0 && (
                  <div className="shape-grid-section" style={{ marginBottom: '24px' }}>
                    <div className="section-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Recently Used</div>
                    <div className="shape-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {recentShapes.map(shape => (
                        <button key={`recent-${shape.id}`} className="shape-card" onClick={() => addShape(shape.id)} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'white', transition: 'all 0.2s' }}>
                          <div className="shape-icon" style={{ color: 'var(--accent)' }}>{shape.icon}</div>
                          <div className="shape-name" style={{ fontSize: '11px', textAlign: 'center' }}>{shape.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(categories).map(category => {
                  const shapes = categories[category];
                  const isExpanded = expandedCategories[category];
                  const displayedShapes = isExpanded ? shapes : shapes.slice(0, 4);
                  const hasMore = shapes.length > 4;

                  return (
                    <div className="shape-grid-section" key={category} style={{ marginBottom: '24px' }}>
                      <div className="section-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>{category}</div>
                      <div className="shape-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        {displayedShapes.map(shape => (
                          <button key={shape.id} className="shape-card" onClick={() => addShape(shape.id)} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'white', transition: 'all 0.2s' }}>
                            <div className="shape-icon" style={{ color: 'var(--accent)' }}>{shape.icon}</div>
                            <div className="shape-name" style={{ fontSize: '11px', textAlign: 'center' }}>{shape.name}</div>
                          </button>
                        ))}
                      </div>
                      {hasMore && (
                        <button 
                          className="expand-category-btn" 
                          onClick={() => toggleCategory(category)}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '8px', marginTop: '4px', cursor: 'pointer' }}
                        >
                          {isExpanded ? (
                            <><ChevronUp size={14} /> Show Less</>
                          ) : (
                            <><ChevronDown size={14} /> Expand ({shapes.length} Objects)</>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </>
            )}
            </>
            )}
          </>

        ) : (
          <>
            <div className="section-title" style={{ marginTop: '24px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Basic 3D Shapes</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <button className="shape-card" onClick={() => addShape('cube')} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'white' }}>
                <Box size={16} style={{ color: 'var(--accent)' }} /> <span style={{ fontSize: '11px', textAlign: 'center' }}>Cube</span>
              </button>
              <button className="shape-card" onClick={() => addShape('cuboid')} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'white' }}>
                <Box size={16} style={{ color: 'var(--accent)' }} /> <span style={{ fontSize: '11px', textAlign: 'center' }}>Cuboid</span>
              </button>
              <button className="shape-card" onClick={() => addShape('cylinder')} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'white' }}>
                <Cylinder size={16} style={{ color: 'var(--accent)' }} /> <span style={{ fontSize: '11px', textAlign: 'center' }}>Cylinder</span>
              </button>
              <button className="shape-card" onClick={() => addShape('cone')} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'white' }}>
                <Cylinder size={16} style={{ color: 'var(--accent)' }} /> <span style={{ fontSize: '11px', textAlign: 'center' }}>Cone</span>
              </button>
              <button className="shape-card" onClick={() => addShape('sphere')} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'white' }}>
                <Globe size={16} style={{ color: 'var(--accent)' }} /> <span style={{ fontSize: '11px', textAlign: 'center' }}>Sphere</span>
              </button>
              <button className="shape-card" onClick={() => addShape('squarePyramid')} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'white' }}>
                <Triangle size={16} style={{ color: 'var(--accent)' }} /> <span style={{ fontSize: '11px', textAlign: 'center' }}>Square Pyramid</span>
              </button>
              <button className="shape-card" onClick={() => addShape('tetrahedron')} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'white' }}>
                <Triangle size={16} style={{ color: 'var(--accent)' }} /> <span style={{ fontSize: '11px', textAlign: 'center' }}>Tetrahedron</span>
              </button>
              <button className="shape-card" onClick={() => addShape('octahedron')} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'white' }}>
                <Hexagon size={16} style={{ color: 'var(--accent)' }} /> <span style={{ fontSize: '11px', textAlign: 'center' }}>Octahedron</span>
              </button>
              <button className="shape-card" onClick={() => addShape('triangularPrism')} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'white' }}>
                <Box size={16} style={{ color: 'var(--accent)' }} /> <span style={{ fontSize: '11px', textAlign: 'center' }}>Triangular Prism</span>
              </button>
            </div>
          </>
        )}
      </div>

      <div style={{ flexShrink: 0, marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
        <div className="section-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Export & Save</div>
        <button className="btn" style={{ width: '100%', marginBottom: '6px', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px', background: '#6366f1' }} onClick={handleSaveToLibrary}>
          <Download size={16} /> Save to Library
        </button>
        <button className="btn" style={{ width: '100%', marginBottom: '6px', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px' }} onClick={() => handleExport('png')}>
          <Download size={16} /> Export PNG
        </button>
        <button className="btn" style={{ width: '100%', marginBottom: '6px', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px' }} onClick={() => handleExport('svg')}>
          <Download size={16} /> Export SVG
        </button>
        <button className="btn" style={{ width: '100%', marginBottom: '6px', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px' }} onClick={() => handleExport('json')}>
          <Download size={16} /> Export JSON
        </button>

        <div className="section-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>AI Generator</div>
        <button className="btn" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px' }} onClick={openAIGenerator}>
          <Play size={16} /> Auto-Generate Diagram
        </button>
      </div>
    </div>
  );
}
