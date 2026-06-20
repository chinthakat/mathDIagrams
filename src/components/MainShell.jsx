import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import App from '../App';
import MapEditor from './MapEditor';
import TopNavigation from './TopNavigation';

export default function MainShell() {
  const [globalMode, setGlobalMode] = useState('Map');

  return (
    <div className="main-shell" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <div className="topbar" style={{ padding: '8px 16px', background: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
        <div className="topbar-logo" style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 'bold' }}>
          <Sparkles color="#8b5cf6" /> MathDiagram AI
        </div>
        <TopNavigation mode={globalMode} setMode={setGlobalMode} />
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {globalMode === 'Map' && <MapEditor globalMode={globalMode} setGlobalMode={setGlobalMode} />}
        {(globalMode === '2D' || globalMode === '3D' || globalMode === 'Equations') && <App globalMode={globalMode} setGlobalMode={setGlobalMode} />}
      </div>
    </div>
  );
}
