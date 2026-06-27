import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { CLIPART_ITEMS, CLIPART_CATEGORIES } from '../assets/clipartLibrary';

export default function ClipArtPanel({ onInsert }) {
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return CLIPART_ITEMS.filter(item =>
      (category === 'All' || item.category === category) &&
      (!q || item.label.toLowerCase().includes(q) || item.category.toLowerCase().includes(q))
    );
  }, [search, category]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 8px' }}>
        <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search clip art…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', padding: '7px 0', outline: 'none', fontSize: '12px' }}
        />
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {['All', ...CLIPART_CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              padding: '3px 8px', borderRadius: '12px', border: '1px solid',
              borderColor: category === cat ? 'var(--accent)' : 'var(--border-color)',
              background:  category === cat ? 'rgba(99,102,241,0.18)' : 'transparent',
              color:       category === cat ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '10px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', maxHeight: '340px', overflowY: 'auto', paddingRight: '2px' }}>
        {filtered.map(item => (
          <button
            key={item.id}
            onClick={() => onInsert(item)}
            title={item.label}
            style={{
              background: 'var(--bg-dark)', border: '1px solid var(--border-color)',
              borderRadius: '6px', padding: '8px 4px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '4px', cursor: 'pointer', transition: 'border-color .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <img src={item.url} alt={item.label} width={28} height={28} style={{ objectFit: 'contain' }} />
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.label}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: 'span 3', textAlign: 'center', color: '#475569', fontSize: '12px', padding: '16px' }}>
            No results
          </div>
        )}
      </div>
    </div>
  );
}
