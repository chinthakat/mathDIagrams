import React, { useState } from 'react';
import { Download, Play, Box, Cylinder, Globe, Search, ChevronDown, ChevronUp, Compass } from 'lucide-react';
import { ObjectRegistry, getCategories } from '../registry/objectRegistry';

export default function Sidebar({ mode, setMode, addShape, handleExport, recentlyUsed = [], openAIGenerator }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  const categories = getCategories();
  delete categories['Map Elements'];

  const allShapes = Object.values(ObjectRegistry).filter(shape => shape.category !== 'Map Elements');

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
    <div className="sidebar" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        {mode === '2D' ? (
          <>
            <button 
              className="shape-btn" 
              onClick={() => window.open('?editor=map', '_blank')} 
              style={{ 
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', 
                border: 'none', 
                color: 'white', 
                fontWeight: '600', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '16px',
                padding: '12px'
              }}
            >
              <Compass size={16} /> Open Map Editor ↗
            </button>

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

        ) : (
          <>
            <div className="section-title" style={{ marginTop: '24px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Basic Shapes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="shape-btn" onClick={() => addShape('cube')} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '12px', color: 'white', cursor: 'pointer' }}>
                <Box size={16} style={{ color: 'var(--accent)' }} /> Cube
              </button>
              <button className="shape-btn" onClick={() => addShape('cylinder')} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '12px', color: 'white', cursor: 'pointer' }}>
                <Cylinder size={16} style={{ color: 'var(--accent)' }} /> Cylinder
              </button>
              <button className="shape-btn" onClick={() => addShape('sphere')} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '12px', color: 'white', cursor: 'pointer' }}>
                <Globe size={16} style={{ color: 'var(--accent)' }} /> Sphere
              </button>
            </div>
          </>
        )}
      </div>

      <div style={{ flexShrink: 0, marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
        <div className="section-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Export</div>
        <button className="btn" style={{ width: '100%', marginBottom: '6px', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px' }} onClick={() => handleExport('png')}>
          <Download size={16} /> Export PNG
        </button>
        <button className="btn" style={{ width: '100%', marginBottom: '6px', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px' }} onClick={() => handleExport('svg')}>
          <Download size={16} /> Export SVG
        </button>
        <button className="btn" style={{ width: '100%', marginBottom: '6px', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px' }} onClick={() => handleExport('json')}>
          <Download size={16} /> Export JSON
        </button>
        <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '12px', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px' }} onClick={() => handleExport('pdf')}>
          <Download size={16} /> Export PDF (WIP)
        </button>

        <div className="section-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>AI Generator</div>
        <button className="btn" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px' }} onClick={openAIGenerator}>
          <Play size={16} /> Auto-Generate Diagram
        </button>
      </div>
    </div>
  );
}
