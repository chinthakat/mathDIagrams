import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Compass, Key, Search, ChevronRight, ChevronLeft, Loader, HelpCircle, X, ShieldAlert, RefreshCw } from 'lucide-react';
import { 
  getLmsApiKey, saveLmsApiKey, 
  getLmsWriteKey, saveLmsWriteKey, 
  fetchMockExamsPaginated,
  fetchLocalMockExams,
  saveLocalMockExams,
  clearLocalMockExams
} from '../services/lmsApiService';

const S = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(9, 15, 30, 0.9)',
    backdropFilter: 'blur(12px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    color: '#e2e8f0',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '720px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px rgba(124, 58, 237, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    padding: '32px 32px 16px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #f3e8ff 0%, #c084fc 50%, #818cf8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 8px 0',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    lineHeight: 1.6,
    margin: 0,
  },
  content: {
    padding: '32px',
    flex: 1,
    overflowY: 'auto',
    maxHeight: '440px',
  },
  footer: {
    padding: '20px 32px',
    background: 'rgba(15, 23, 42, 0.6)',
    borderTop: '1px solid rgba(255, 255, 255, 0.03)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  pathCard: {
    background: 'rgba(30, 41, 59, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '20px',
    padding: '24px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    textAlign: 'left',
    position: 'relative',
    overflow: 'hidden',
  },
  pathCardHover: {
    border: '1px solid rgba(139, 92, 246, 0.4)',
    background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.6) 0%, rgba(124, 58, 237, 0.08) 100%)',
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 24px -10px rgba(124, 58, 237, 0.3)',
  },
  iconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: '#fff',
    boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.4)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 600,
    background: 'rgba(124, 58, 237, 0.2)',
    color: '#c084fc',
    alignSelf: 'flex-start',
  },
  hint: {
    fontSize: '12px',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: 'auto',
    borderTop: '1px solid rgba(255,255,255,0.03)',
    paddingTop: '12px',
  },
  btn: {
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  btnGhost: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
    color: '#fff',
    boxShadow: '0 8px 20px -6px rgba(124, 58, 237, 0.5)',
  },
  gradeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '12px',
    marginTop: '8px',
  },
  gradeBtn: {
    padding: '14px 10px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(30, 41, 59, 0.3)',
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    textAlign: 'center',
    transition: 'all 0.2s',
  },
  gradeBtnActive: {
    border: '1px solid #7c3aed',
    background: 'rgba(124, 58, 237, 0.15)',
    color: '#c084fc',
    boxShadow: '0 0 15px rgba(124, 58, 237, 0.1)',
  },
  examItem: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.04)',
    background: 'rgba(30, 41, 59, 0.2)',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s',
    marginBottom: '8px',
  },
  examItemActive: {
    border: '1px solid #7c3aed',
    background: 'rgba(124, 58, 237, 0.12)',
  },
  configPanel: {
    background: 'rgba(15, 23, 42, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '16px',
  },
  input: {
    width: '100%',
    background: '#0f172a',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#fff',
    fontSize: '12px',
    outline: 'none',
    boxSizing: 'border-box',
    marginTop: '4px',
  }
};

export default function WelcomeWizardModal({ isOpen, onClose, onSelectTemplateMode, onSelectExam }) {
  const [step, setStep] = useState(1); // 1 = choose path, 2 = select grade, 3 = select exam
  const [hoveredCard, setHoveredCard] = useState(null);
  
  // Database connect keys & load state
  const [hasKeys, setHasKeys] = useState(!!(getLmsApiKey() || import.meta.env.VITE_LMS_API_KEY));
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [readKey, setReadKey] = useState(getLmsApiKey());
  const [writeKey, setWriteKey] = useState(getLmsWriteKey());

  // Exam list fetching
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Filters
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [searchText, setSearchText] = useState('');

  // Auto-fetch mock exams if has API keys
  useEffect(() => {
    if (isOpen && hasKeys && exams.length === 0) {
      loadExamsList(false);
    }
  }, [isOpen, hasKeys]);

  const loadExamsList = async (forceSync = false) => {
    if (forceSync) {
      setIsSyncing(true);
    } else {
      setLoadingExams(true);
    }
    setFetchError(null);
    try {
      // 1. Try to get cached mock exams from local database first (if not forcing a sync)
      if (!forceSync) {
        const cached = await fetchLocalMockExams();
        if (cached && cached.length > 0) {
          console.log(`[Cache] Loaded ${cached.length} exams from local SQLite database.`);
          setExams(cached);
          setLoadingExams(false);
          return;
        }
      }

      // 2. If cache is empty or we are forcing sync, load from SimplyMaths LMS API
      console.log('[Cache] Cache empty/sync requested. Fetching from LMS API...');
      const loadedList = [];
      await fetchMockExamsPaginated((batch, isFinal) => {
        loadedList.push(...batch);
        setExams(prev => {
          const ids = new Set(prev.map(e => e.id));
          const newItems = batch.filter(e => !ids.has(e.id));
          return [...prev, ...newItems];
        });
      });

      // 3. Cache the loaded exams list into the local SQLite database for instant retrieval next time
      if (loadedList.length > 0) {
        const cachePayload = loadedList.map(e => ({
          id: String(e.id),
          title: String(e.title || ''),
          gradeLevel: e.gradeLevel ? String(e.gradeLevel) : (e.title.match(/grade\s+(\d+)/i)?.[1] || ''),
          questionCount: Number(e.questionIds?.length || e.questions?.length || 0),
        }));
        await saveLocalMockExams(cachePayload);
        
        // Refresh local state to match database format
        const freshList = await fetchLocalMockExams();
        setExams(freshList);
      }
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setLoadingExams(false);
      setIsSyncing(false);
    }
  };

  const handleSaveKeys = () => {
    saveLmsApiKey(readKey);
    saveLmsWriteKey(writeKey);
    setHasKeys(!!(readKey));
    setShowKeyConfig(false);
    // Trigger load
    setExams([]);
    setTimeout(() => {
      loadExamsList(true);
    }, 100);
  };

  const extractGrade = (exam) => {
    if (exam.gradeLevel) {
      const gStr = String(exam.gradeLevel);
      return gStr.startsWith('Grade') ? gStr : `Grade ${gStr}`;
    }
    const m = (exam.title || '').match(/grade\s+(\d+)/i);
    return m ? `Grade ${m[1]}` : 'Unassigned';
  };

  // Derive unique list of grades from fetched exams
  const gradeOptions = ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'All Grades'];

  // Filter exams by grade & search text
  const getFilteredExams = () => {
    return exams.filter(e => {
      const g = extractGrade(e);
      if (selectedGrade && selectedGrade !== 'All Grades' && g !== selectedGrade) return false;
      if (searchText && !(e.title || '').toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  };

  if (!isOpen) return null;

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', zIndex: 10 }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={S.header}>
          <h1 style={S.title}>
            {step === 1 && "Welcome to MathDiagram AI"}
            {step === 2 && "Select Grade Level"}
            {step === 3 && "Choose Mock Exam"}
          </h1>
          <p style={S.subtitle}>
            {step === 1 && "Start building gorgeous interactive math diagrams or repair mock questions."}
            {step === 2 && "Narrow down the list of assessments to review by grade level."}
            {step === 3 && `Select the exam to edit from SimplyMaths database (${getFilteredExams().length} exams found).`}
          </p>
        </div>

        {/* Content Area */}
        <div style={S.content}>
          {step === 1 && (
            <div style={S.grid}>
              
              {/* Path 1: Template */}
              <div 
                style={{ ...S.pathCard, ...(hoveredCard === 'template' ? S.pathCardHover : {}) }}
                onMouseEnter={() => setHoveredCard('template')}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => {
                  onSelectTemplateMode();
                  onClose();
                }}
              >
                <div style={S.iconWrapper}>
                  <Compass size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: '#f1f5f9' }}>Create from Template</h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                    Select a preset layout (Fractions, Clocks, Coordinates, Triangles), customize parameters, and generate matching questions.
                  </p>
                </div>
                <div style={S.badge}>New Diagram & Question</div>
                <div style={S.hint}>
                  <HelpCircle size={12} />
                  <span>Best for starting from scratch</span>
                </div>
              </div>

              {/* Path 2: Mock Exams */}
              <div 
                style={{ ...S.pathCard, ...(hoveredCard === 'mock' ? S.pathCardHover : {}) }}
                onMouseEnter={() => setHoveredCard('mock')}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => setStep(2)}
              >
                <div style={{ ...S.iconWrapper, background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.4)' }}>
                  <BookOpen size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: '#f1f5f9' }}>Review Mock Exams</h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                    Connect to the SimplyMaths LMS database to pull and edit diagrams, fix texts, or trigger vision-based repairs on live questions.
                  </p>
                </div>
                <div style={{ ...S.badge, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>Live Exam Database</div>
                <div style={S.hint}>
                  <HelpCircle size={12} />
                  <span>Best for editing existing questions</span>
                </div>
              </div>

            </div>
          )}

          {step === 2 && (
            <div>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
                Select a grade level to filter assessments. Selecting "All Grades" will list everything.
              </p>
              
              <div style={S.gradeGrid}>
                {gradeOptions.map(g => (
                  <button 
                    key={g} 
                    style={{ ...S.gradeBtn, ...(selectedGrade === g ? S.gradeBtnActive : {}) }}
                    onClick={() => {
                      setSelectedGrade(g);
                      setStep(3);
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {!hasKeys && (
                <div style={{ marginTop: '24px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#fbbf24', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    <ShieldAlert size={14} />
                    <span>LMS Database Keys Configured as Mock</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 10px 0' }}>
                    The default API keys configured in the env are placeholder keys. If mock exam list fails to load, please set your custom LMS API keys.
                  </p>
                  <button 
                    style={{ ...S.btn, ...S.btnGhost, padding: '6px 12px', fontSize: '11px' }}
                    onClick={() => setShowKeyConfig(!showKeyConfig)}
                  >
                    <Key size={12} />
                    Configure API Keys
                  </button>
                </div>
              )}

              {showKeyConfig && (
                <div style={{ ...S.configPanel, marginTop: '16px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 12px 0' }}>SimplyMaths Database Connection</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>READ API KEY</span>
                      <input type="password" value={readKey} onChange={e => setReadKey(e.target.value)} style={S.input} />
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>WRITE API KEY</span>
                      <input type="password" value={writeKey} onChange={e => setWriteKey(e.target.value)} style={S.input} />
                    </div>
                    <button style={{ ...S.btn, ...S.btnPrimary, alignSelf: 'flex-start', padding: '6px 14px', fontSize: '11px', marginTop: '6px' }} onClick={handleSaveKeys}>
                      Save & Connect
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              {/* Search & Sync Row */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    style={{ ...S.input, paddingLeft: '32px', marginTop: 0 }}
                    placeholder="Filter exams by title…"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                  />
                </div>
                <button
                  style={{ 
                    ...S.btn, 
                    ...S.btnGhost, 
                    padding: '8px 14px', 
                    background: isSyncing ? 'rgba(124, 58, 237, 0.15)' : 'rgba(30, 41, 59, 0.4)',
                    color: isSyncing ? '#c084fc' : '#cbd5e1',
                    borderColor: isSyncing ? '#7c3aed' : 'rgba(255,255,255,0.1)'
                  }}
                  disabled={loadingExams || isSyncing}
                  onClick={() => loadExamsList(true)}
                  title="Pull latest mock exams from SimplyMaths database and save to local SQLite cache"
                >
                  <RefreshCw size={13} className={isSyncing ? "spin" : ""} />
                  {isSyncing ? "Syncing..." : "Sync Database"}
                </button>
              </div>

              {loadingExams && (
                <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  <Loader size={24} className="spin" style={{ margin: '0 auto 12px', color: '#8b5cf6' }} />
                  <p style={{ fontSize: '13px', margin: 0 }}>Loading mock exams from local database cache...</p>
                </div>
              )}

              {isSyncing && (
                <div style={{ padding: '24px 16px', background: 'rgba(124, 58, 237, 0.05)', border: '1px dashed rgba(124, 58, 237, 0.2)', borderRadius: '12px', textAlign: 'center', marginBottom: '16px' }}>
                  <Loader size={20} className="spin" style={{ margin: '0 auto 8px', color: '#c084fc' }} />
                  <span style={{ fontSize: '12px', color: '#c084fc', fontWeight: 600 }}>Syncing with SimplyMaths production server...</span>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0' }}>This pulls metadata for all mock exams to cache them locally. Subsequent loads will be instant.</p>
                </div>
              )}

              {fetchError && (
                <div style={{ padding: '20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
                  Error loading mock exams: {fetchError}. Please verify your LMS API keys.
                </div>
              )}

              {!loadingExams && !isSyncing && !fetchError && getFilteredExams().length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  No exams found matching your search.
                </div>
              )}

              <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                {getFilteredExams().map(exam => {
                  const grade = extractGrade(exam);
                  const isSelected = selectedExam?.id === exam.id;
                  
                  // Color codes for different grades
                  const gradeColors = {
                    'Grade 3': { bg: 'rgba(124, 58, 237, 0.15)', text: '#c084fc' },
                    'Grade 4': { bg: 'rgba(245, 158, 11, 0.15)', text: '#fcd34d' },
                    'Grade 5': { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa' },
                    'Grade 6': { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399' },
                  }[grade] || { bg: 'rgba(100, 116, 139, 0.15)', text: '#94a3b8' };

                  return (
                    <div 
                      key={exam.id}
                      style={{ 
                        ...S.examItem, 
                        ...(isSelected ? S.examItemActive : {}),
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                      onClick={() => setSelectedExam(exam)}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {exam.title}
                        </div>
                      </div>
                      
                      {/* Flag badges row */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: 700, 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          background: gradeColors.bg, 
                          color: gradeColors.text 
                        }}>
                          {grade}
                        </span>
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: 600, 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          background: 'rgba(255,255,255,0.04)', 
                          color: '#94a3b8',
                          border: '1px solid rgba(255,255,255,0.02)'
                        }}>
                          {(exam.questionCount || exam.questionIds?.length || exam.questions?.length || 0)} Qs
                        </span>
                        
                        {isSelected ? (
                          <span style={{ 
                            fontSize: '10px', 
                            fontWeight: 800, 
                            color: '#34d399', 
                            background: 'rgba(52,211,153,0.1)', 
                            padding: '2px 8px', 
                            borderRadius: '4px' 
                          }}>
                            SELECTED
                          </span>
                        ) : (
                          <ChevronRight size={13} color="#475569" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={S.footer}>
          {step > 1 ? (
            <button 
              style={{ ...S.btn, ...S.btnGhost }}
              onClick={() => setStep(step - 1)}
            >
              <ChevronLeft size={14} />
              Back
            </button>
          ) : (
            <span style={{ fontSize: '11px', color: '#64748b' }}>Interactive Question Generator v1.2</span>
          )}

          {step === 3 && (
            <button 
              style={{ ...S.btn, ...S.btnPrimary }}
              disabled={!selectedExam}
              onClick={() => {
                onSelectExam(selectedGrade, selectedExam);
                onClose();
              }}
            >
              Start Repairing Questions
              <ChevronRight size={14} />
            </button>
          )}

          {step === 1 && (
            <button 
              style={{ ...S.btn, ...S.btnGhost }}
              onClick={onClose}
            >
              Skip Wizard
            </button>
          )}
        </div>

      </div>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
