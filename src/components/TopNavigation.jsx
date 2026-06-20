import React from 'react';
import { Sparkles } from 'lucide-react';

export default function TopNavigation({ mode, setMode }) {
  return (
    <div style={{ display: 'flex', background: '#1e293b', borderRadius: '8px', padding: '4px' }}>
      <button
        onClick={() => setMode('Map')}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: 'none',
          background: mode === 'Map' ? '#10b981' : 'transparent',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        Map Editor
      </button>
      <button
        onClick={() => setMode('2D')}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: 'none',
          background: mode === '2D' ? '#3b82f6' : 'transparent',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        Geometry
      </button>
      <button
        onClick={() => setMode('3D')}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: 'none',
          background: mode === '3D' ? '#f59e0b' : 'transparent',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        3D Builder
      </button>
      <button
        onClick={() => setMode('Equations')}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: 'none',
          background: mode === 'Equations' ? '#8b5cf6' : 'transparent',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        Equations
      </button>
    </div>
  );
}
