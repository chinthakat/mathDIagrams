import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { ICON_CATEGORIES } from '../registry/iconRegistry';

export default function IconPickerModal({ isOpen, onClose, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  if (!isOpen) return null;

  // Filter icons by category and search term
  const getFilteredIcons = () => {
    let result = [];
    if (selectedCategory === 'All') {
      // Flatten all categories
      Object.keys(ICON_CATEGORIES).forEach(cat => {
        result.push(...ICON_CATEGORIES[cat].map(icon => ({ ...icon, category: cat })));
      });
    } else {
      result = ICON_CATEGORIES[selectedCategory].map(icon => ({ ...icon, category: selectedCategory }));
    }

    if (searchTerm) {
      result = result.filter(icon => 
        icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        icon.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return result;
  };

  const filteredIcons = getFilteredIcons();

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="modal-container" style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        width: '600px',
        maxWidth: '90%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid #334155'
        }}>
          <h3 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: 600 }}>Select Mathematical Icon</h3>
          <button 
            onClick={onClose} 
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '4px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#334155'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '16px 20px 8px' }}>
          <div style={{
            background: '#0f172a',
            borderRadius: '6px',
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px'
          }}>
            <Search size={18} style={{ color: '#64748b', marginRight: '8px' }} />
            <input 
              type="text" 
              placeholder="Search math, tools, shapes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'white',
                padding: '10px 0',
                outline: 'none',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '12px 20px',
          borderBottom: '1px solid #334155'
        }}>
          <button 
            onClick={() => setSelectedCategory('All')}
            className={`tab-btn ${selectedCategory === 'All' ? 'active' : ''}`}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              background: selectedCategory === 'All' ? 'var(--accent)' : '#334155',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            All Icons
          </button>
          {Object.keys(ICON_CATEGORIES).map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: 'none',
                background: selectedCategory === cat ? 'var(--accent)' : '#334155',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Icon Grid */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
          gap: '12px',
          minHeight: '200px'
        }}>
          {filteredIcons.length > 0 ? (
            filteredIcons.map(icon => {
              const IconComp = icon.component;
              return (
                <button
                  key={icon.name}
                  onClick={() => onSelect(icon.name)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 8px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: 'white',
                    transition: 'all 0.2s ease-out'
                  }}
                  className="icon-picker-card"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.background = '#1e293b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = '#334155';
                    e.currentTarget.style.background = '#0f172a';
                  }}
                  title={icon.name}
                >
                  <div style={{ color: 'var(--accent)' }}>
                    <IconComp size={28} />
                  </div>
                  <span style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%', whiteSpace: 'nowrap' }}>
                    {icon.name}
                  </span>
                </button>
              );
            })
          ) : (
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px', color: '#64748b', fontSize: '14px' }}>
              No icons found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
