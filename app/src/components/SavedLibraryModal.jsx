import React, { useEffect, useState } from 'react';
import { X, Search, Trash2, Download, Box, Map, PenTool } from 'lucide-react';

export default function SavedLibraryModal({ isOpen, onClose, onLoad }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [savedGenerations, setSavedGenerations] = useState([]);
  
  const fetchGenerations = async () => {
    try {
      const res = await fetch('/api/generations');
      const data = await res.json();
      setSavedGenerations(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGenerations();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoad = (gen) => {
    onLoad(gen);
    onClose();
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this generation?')) {
      try {
        await fetch(`/api/generations/${id}`, { method: 'DELETE' });
        fetchGenerations();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const filteredItems = savedGenerations.filter(gen => {
    const matchesSearch = gen.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || gen.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getIcon = (category) => {
    switch(category) {
      case '3D_NET_QUIZ': return <Box size={24} color="#f59e0b" />;
      case '3D_ELEVATIONS': return <Box size={24} color="#f59e0b" />;
      case '2D_MAP': return <Map size={24} color="#10b981" />;
      case '2D_GEOMETRY': return <PenTool size={24} color="#3b82f6" />;
      case 'EQUATIONS': return <PenTool size={24} color="#8b5cf6" />;
      default: return <Box size={24} />;
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-container" style={{
        background: '#1e293b', border: '1px solid #334155', borderRadius: '12px',
        width: '800px', maxWidth: '90%', maxHeight: '85vh',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #334155' }}>
          <h3 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: 600 }}>My Saved Library</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', gap: '16px', borderBottom: '1px solid #334155' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748b' }} />
            <input 
              type="text" 
              placeholder="Search library..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
            />
          </div>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
          >
            <option value="ALL">All Categories</option>
            <option value="2D_GEOMETRY">2D Geometry</option>
            <option value="EQUATIONS">Equations</option>
            <option value="2D_MAP">2D Maps</option>
            <option value="3D_NET_QUIZ">3D Nets</option>
            <option value="3D_ELEVATIONS">3D Elevations</option>
          </select>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {filteredItems.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#64748b', padding: '40px' }}>
              No saved generations found.
            </div>
          ) : (
            filteredItems.map(gen => (
              <div 
                key={gen.id} 
                onClick={() => handleLoad(gen)}
                style={{ 
                  background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '16px',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#334155'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {getIcon(gen.category)}
                  <button onClick={(e) => handleDelete(gen.id, e)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{gen.title}</div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>{new Date(gen.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', background: '#1e293b', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>
                    {gen.category.replace('_', ' ')}
                  </span>
                  <Download size={14} color="#6366f1" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
