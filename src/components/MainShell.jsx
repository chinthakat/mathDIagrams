import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import App from '../App';
import MapEditor from './MapEditor';
import TopNavigation from './TopNavigation';
import SavedLibraryModal from './SavedLibraryModal';

export default function MainShell() {
  const [globalMode, setGlobalMode] = useState('Map');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [globalLoadedData, setGlobalLoadedData] = useState(null);

  return (
    <div className="main-shell" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <div className="topbar" style={{ padding: '8px 16px', background: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
        <div className="topbar-logo" style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 'bold' }}>
          <Sparkles color="#8b5cf6" /> MathDiagram AI
        </div>
        <TopNavigation mode={globalMode} setMode={setGlobalMode} />
        <div style={{ display: 'flex' }}>
          <button 
            className="btn" 
            onClick={() => setIsLibraryOpen(true)}
            style={{ padding: '6px 12px', fontSize: '12px', background: 'transparent', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1', fontWeight: '600', borderRadius: '6px', cursor: 'pointer' }}
            onMouseOver={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = '#1e293b'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.background = 'transparent'; }}
          >
            <Sparkles size={14} /> My Library
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {globalMode === 'Map' && <MapEditor globalMode={globalMode} setGlobalMode={setGlobalMode} globalLoadedData={globalLoadedData} setGlobalLoadedData={setGlobalLoadedData} />}
        {(globalMode === '2D' || globalMode === '3D' || globalMode === 'Equations') && <App globalMode={globalMode} setGlobalMode={setGlobalMode} globalLoadedData={globalLoadedData} setGlobalLoadedData={setGlobalLoadedData} />}
      </div>

      <SavedLibraryModal 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onLoad={(gen) => {
          if (gen.category === '2D_MAP') {
            setGlobalMode('Map');
          } else if (gen.category === 'EQUATIONS') {
            setGlobalMode('Equations');
          } else if (gen.category === '2D_GEOMETRY') {
            setGlobalMode('2D');
          } else if (gen.category === '3D_ELEVATIONS' || gen.category === '3D_NET_QUIZ') {
            setGlobalMode('3D');
          }
          setGlobalLoadedData(gen);
        }}
      />
    </div>
  );
}
