import React from 'react';
import { Sparkles, BookOpen } from 'lucide-react';

export default function TopNavigation({ mode, setMode }) {
  return (
    <div style={{ display: 'flex', background: '#1e293b', borderRadius: '8px', padding: '4px', gap: '2px' }}>
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
        2D Diagrams
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
        onClick={() => setMode('MockExams')}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: 'none',
          background: mode === 'MockExams' ? '#7c3aed' : 'transparent',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <BookOpen size={15} />
        Mock Exams
      </button>
    </div>
  );
}
