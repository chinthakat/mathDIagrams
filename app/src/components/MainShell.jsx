import React, { useState } from 'react';
import { Sparkles, Wand2 } from 'lucide-react';
import App from '../App';
import MapEditor from './MapEditor';
import TopNavigation from './TopNavigation';
import SavedLibraryModal from './SavedLibraryModal';
import MockExamBrowser from './MockExamBrowser';
import WelcomeWizardModal from './WelcomeWizardModal';

export default function MainShell() {
  const [globalMode, setGlobalMode] = useState('Map');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [globalLoadedData, setGlobalLoadedData] = useState(null);

  // Welcome Wizard state
  const [showWizard, setShowWizard] = useState(true);
  const [autoOpenWizard, setAutoOpenWizard] = useState(false);
  const [selectedExamFromWizard, setSelectedExamFromWizard] = useState(null);
  const [selectedGradeFromWizard, setSelectedGradeFromWizard] = useState('');

  return (
    <div className="main-shell" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <div className="topbar" style={{ padding: '8px 16px', background: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
        <div className="topbar-logo" style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 'bold' }}>
          <Sparkles color="#8b5cf6" /> MathDiagram AI
        </div>
        <TopNavigation mode={globalMode} setMode={setGlobalMode} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn"
            onClick={() => setShowWizard(true)}
            style={{ padding: '6px 14px', fontSize: '12px', background: '#8b5cf6', border: '1px solid #8b5cf6', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontWeight: '700', borderRadius: '6px', cursor: 'pointer', boxShadow: '0 0 0 rgba(139,92,246,0.5)' }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.borderColor = '#7c3aed'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#8b5cf6'; e.currentTarget.style.borderColor = '#8b5cf6'; }}
          >
            <Wand2 size={14} /> Quick Wizard
          </button>
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
        {(globalMode === '2D' || globalMode === '3D' || globalMode === 'Equations') && (
          <App 
            globalMode={globalMode} 
            setGlobalMode={setGlobalMode} 
            globalLoadedData={globalLoadedData} 
            setGlobalLoadedData={setGlobalLoadedData} 
            autoOpenWizard={autoOpenWizard}
            setAutoOpenWizard={setAutoOpenWizard}
          />
        )}
        {globalMode === 'MockExams' && (
          <MockExamBrowser 
            initialSelectedExam={selectedExamFromWizard} 
            initialGradeFilter={selectedGradeFromWizard}
            onSelectExam={(grade, exam) => {
              setSelectedGradeFromWizard(grade === 'All Grades' ? '' : grade);
              setSelectedExamFromWizard(exam);
            }}
          />
        )}
      </div>

      <SavedLibraryModal 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onLoad={(gen) => {
          if (gen.category === '2D_MAP') {
            setGlobalMode('Map');
          } else if (gen.category === 'EQUATIONS' || gen.category === '2D_GEOMETRY') {
            setGlobalMode('2D');
          } else if (gen.category === '3D_ELEVATIONS' || gen.category === '3D_NET_QUIZ') {
            setGlobalMode('3D');
          }
          setGlobalLoadedData(gen);
        }}
      />

      <WelcomeWizardModal 
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSelectTemplateMode={() => {
          setGlobalMode('2D');
          setAutoOpenWizard(true);
        }}
        onSelectExam={(grade, exam) => {
          setSelectedGradeFromWizard(grade === 'All Grades' ? '' : grade);
          setSelectedExamFromWizard(exam);
          setGlobalMode('MockExams');
        }}
      />
    </div>
  );
}
