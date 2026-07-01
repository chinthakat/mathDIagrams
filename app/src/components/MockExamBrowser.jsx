import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ChevronDown, ChevronRight, Image, Edit3, AlertCircle, RefreshCw, Key, Loader, Eye } from 'lucide-react';
import {
  getLmsApiKey, saveLmsApiKey,
  getLmsWriteKey, saveLmsWriteKey,
  fetchMockExamsPaginated, fetchQuizWithQuestions,
  resolveImageUrl,
  fetchLocalMockExams,
  saveLocalMockExams,
  clearLocalMockExams
} from '../services/lmsApiService.js';
import DiagramEditorModal from './DiagramEditorModal.jsx';
import QuestionEditorModal from './QuestionEditorModal.jsx';

const S = {
  root: { display: 'flex', flexDirection: 'column', height: '100%', background: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' },
  topBar: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#1e293b', borderBottom: '1px solid #334155', flexShrink: 0 },
  title: { fontSize: '16px', fontWeight: 700, color: '#f1f5f9', marginRight: '8px' },
  searchBox: { flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', color: '#e2e8f0', fontSize: '13px', outline: 'none' },
  btn: { padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' },
  btnPrimary: { background: '#3b82f6', color: '#fff' },
  btnGhost: { background: 'transparent', color: '#94a3b8', border: '1px solid #334155' },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  examList: { width: '310px', borderRight: '1px solid #1e293b', overflowY: 'auto', flexShrink: 0 },
  examItem: { padding: '10px 14px', borderBottom: '1px solid #1e293b', cursor: 'pointer', userSelect: 'none' },
  examTitle: { fontSize: '13px', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4 },
  examMeta: { fontSize: '11px', color: '#64748b', marginTop: '2px' },
  qPanel: { flex: 1, overflowY: 'auto', padding: '16px' },
  qGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' },
  qCard: { background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', overflow: 'hidden' },
  qCardHeader: { padding: '10px 12px', background: '#162032', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' },
  qCardBody: { padding: '10px 12px' },
  qText: { fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 },
  qImg: { width: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '4px', background: '#0f172a', marginTop: '8px' },
  qOptions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '8px' },
  qOpt: { padding: '4px 8px', background: '#0f172a', borderRadius: '4px', fontSize: '12px', color: '#94a3b8' },
  qOptCorrect: { background: '#064e3b', color: '#34d399' },
  editBtn: { padding: '5px 10px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' },
  badge: { display: 'inline-block', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: '#1e3a5f', color: '#60a5fa' },
  empty: { padding: '40px', textAlign: 'center', color: '#475569', fontSize: '14px' },
  apiKeyPanel: { padding: '20px', background: '#1e293b', borderRadius: '8px', margin: '20px', maxWidth: '480px' },
};

function ApiKeyConfig({ onSaved }) {
  const [readKey, setReadKey] = useState(getLmsApiKey());
  const [writeKey, setWriteKey] = useState(getLmsWriteKey());
  const save = () => { saveLmsApiKey(readKey); saveLmsWriteKey(writeKey); onSaved(); };
  return (
    <div style={S.apiKeyPanel}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Key size={18} color="#f59e0b" />
        <span style={{ fontWeight: 700, fontSize: '15px' }}>LMS API Keys Required</span>
      </div>
      <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
        Enter your SimplyMaths LMS API keys to browse mock exams and edit questions.
      </p>
      <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Read API Key</label>
      <input
        value={readKey} onChange={e => setReadKey(e.target.value)}
        placeholder="agent-read-key-123"
        style={{ ...S.searchBox, width: '100%', marginBottom: '10px', boxSizing: 'border-box' }}
      />
      <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Write API Key</label>
      <input
        value={writeKey} onChange={e => setWriteKey(e.target.value)}
        placeholder="agent-write-key-123"
        style={{ ...S.searchBox, width: '100%', marginBottom: '14px', boxSizing: 'border-box' }}
      />
      <button style={{ ...S.btn, ...S.btnPrimary, width: '100%', justifyContent: 'center' }} onClick={save}>
        Save & Connect
      </button>
    </div>
  );
}

function QuestionCard({ question, examId, onEditRepair, onView }) {
  const imageUrl = resolveImageUrl(question.image || question.imageUrl || question.imageKey);
  const options = question.options || [];
  const correct = question.correctAnswer;

  return (
    <div style={S.qCard}>
      <div style={S.qCardHeader}>
        <div style={{ flex: 1 }}>
          {question.tags?.slice(0, 3).map(t => (
            <span key={t} style={{ ...S.badge, marginRight: '4px' }}>{t}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {imageUrl && (
            <button style={{ ...S.editBtn, background: '#1e293b', border: '1px solid #475569', color: '#cbd5e1' }} onClick={() => onView(question)} title="View question details">
              <Eye size={11} /> View
            </button>
          )}
          <button
            style={{ ...S.editBtn, background: 'linear-gradient(135deg, #7c3aed, #0f766e)', color: '#fff' }}
            onClick={() => onEditRepair(question)}
            title="Edit diagram and question details, or run AI repair"
          >
            <Edit3 size={11} /> Edit / Repair
          </button>
        </div>
      </div>
      <div style={S.qCardBody}>
        <p style={S.qText}>{question.text || question.stem || '(No question text)'}</p>
        {imageUrl && (
          <div style={{ position: 'relative' }}>
            <img
              src={imageUrl}
              alt="question diagram"
              style={S.qImg}
              onError={e => { e.target.style.display = 'none'; }}
            />
            <button
              onClick={() => onEditRepair(question)}
              title="Edit / Repair this question"
              style={{
                position: 'absolute', top: '6px', right: '6px',
                background: 'rgba(124,58,237,0.85)', border: '1px solid #7c3aed', borderRadius: '6px',
                color: '#fff', cursor: 'pointer', padding: '4px 8px',
                fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Edit3 size={10} /> Edit / Repair
            </button>
          </div>
        )}
        {options.length > 0 && (
          <div style={S.qOptions}>
            {options.map((opt, i) => {
              const label = typeof opt === 'string' ? opt : opt.text || opt.label || JSON.stringify(opt);
              const isCorrect = correct === label || correct === opt || correct === String.fromCharCode(65 + i);
              return (
                <div key={i} style={{ ...S.qOpt, ...(isCorrect ? S.qOptCorrect : {}) }}>
                  {String.fromCharCode(65 + i)}) {label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function extractGrade(exam) {
  if (exam.gradeLevel) {
    const gStr = String(exam.gradeLevel);
    return gStr.startsWith('Grade') ? gStr : `Grade ${gStr}`;
  }
  const m = (exam.title || '').match(/grade\s+(\d+)/i);
  return m ? `Grade ${m[1]}` : '';
}

export default function MockExamBrowser({ initialSelectedExam, initialGradeFilter, onSelectExam }) {
  const [hasKeys, setHasKeys] = useState(!!(getLmsApiKey() || import.meta.env.VITE_LMS_API_KEY));
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examQuestions, setExamQuestions] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState(initialGradeFilter || '');
  const [editRepairQuestion, setEditRepairQuestion] = useState(null);
  const [viewQuestion, setViewQuestion] = useState(null);

  const loadExams = useCallback(async (forceSync = false) => {
    if (forceSync) {
      setIsSyncing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      // 1. Try to fetch cached mock exams from local database first (if not forcing a sync)
      if (!forceSync) {
        const cached = await fetchLocalMockExams();
        if (cached && cached.length > 0) {
          console.log(`[Cache] Loaded ${cached.length} exams from local SQLite database.`);
          setExams(cached);
          setLoading(false);
          return;
        }
      }

      // 2. Fetch from SimplyMaths LMS API if cache empty or forcing sync
      console.log('[Cache] Cache empty/sync requested. Fetching from LMS API...');
      setExams([]);
      const loadedList = [];
      await fetchMockExamsPaginated(batch => {
        loadedList.push(...batch);
        setExams(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const newOnes = batch.filter(e => !existingIds.has(e.id));
          return [...prev, ...newOnes];
        });
      });

      // 3. Cache the retrieved list in SQLite DB
      if (loadedList.length > 0) {
        const cachePayload = loadedList.map(e => ({
          id: String(e.id),
          title: String(e.title || ''),
          gradeLevel: e.gradeLevel ? String(e.gradeLevel) : (e.title.match(/grade\s+(\d+)/i)?.[1] || ''),
          questionCount: Number(e.questionIds?.length || e.questions?.length || 0),
        }));
        await saveLocalMockExams(cachePayload);

        // Fetch back cleanly to format correctly
        const freshList = await fetchLocalMockExams();
        setExams(freshList);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => { if (hasKeys) loadExams(false); }, [hasKeys, loadExams]);

  const selectExam = useCallback(async (exam) => {
    setSelectedExam(exam);
    onSelectExam?.(extractGrade(exam), exam);
    setExamQuestions(null);
    setLoadingQuestions(true);
    try {
      const full = await fetchQuizWithQuestions(exam.id);
      setExamQuestions(full?.questionDetails || []);
    } catch {
      setExamQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  }, [onSelectExam]);

  // Sync selection from initialSelectedExam prop (from Welcome Wizard)
  useEffect(() => {
    if (initialSelectedExam) {
      // Find matching exam in loaded list or use the prop directly
      const match = exams.find(e => e.id === initialSelectedExam.id);
      if (match) {
        // If already selected, do not reload questions to avoid infinite loop / redundant fetch
        if (selectedExam?.id !== match.id) {
          selectExam(match);
        }
      } else {
        if (selectedExam?.id !== initialSelectedExam.id) {
          selectExam(initialSelectedExam);
        }
      }
    }
  }, [initialSelectedExam, exams, selectedExam, selectExam]);

  // Sync gradeFilter if it changes from parent
  useEffect(() => {
    if (initialGradeFilter !== undefined) {
      setGradeFilter(initialGradeFilter || '');
    }
  }, [initialGradeFilter]);

  // Derive grade levels from loaded exams
  const gradeOptions = [...new Set(
    exams.map(e => extractGrade(e)).filter(Boolean)
  )].sort((a, b) => {
    const na = parseInt(a), nb = parseInt(b);
    return isNaN(na) || isNaN(nb) ? a.localeCompare(b) : na - nb;
  });

  const filteredExams = exams.filter(e => {
    if (search && !(e.title || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (gradeFilter && extractGrade(e) !== gradeFilter) return false;
    return true;
  });

  const filteredQuestions = (examQuestions || []).filter(q =>
    !search || (q.text || q.stem || '').toLowerCase().includes(search.toLowerCase())
  );

  if (!hasKeys) {
    return (
      <div style={S.root}>
        <div style={S.topBar}>
          <span style={S.title}>Mock Exam Browser</span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Connect to SimplyMaths production database</span>
        </div>
        <ApiKeyConfig onSaved={() => setHasKeys(true)} />
      </div>
    );
  }

  return (
    <div style={S.root}>
      {/* Top bar */}
      <div style={S.topBar}>
        <span style={S.title}>Mock Exams</span>
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            style={{ ...S.searchBox, paddingLeft: '28px' }}
            placeholder="Search exams or questions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={gradeFilter}
          onChange={e => setGradeFilter(e.target.value)}
          style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', color: gradeFilter ? '#e2e8f0' : '#64748b', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
        >
          <option value=''>All Grades</option>
          {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <button 
          style={{ 
            ...S.btn, 
            ...S.btnGhost,
            background: isSyncing ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
            color: isSyncing ? '#c084fc' : '#94a3b8',
            borderColor: isSyncing ? '#7c3aed' : '#334155'
          }} 
          onClick={() => loadExams(true)} 
          disabled={loading || isSyncing}
          title="Sync/reload list of mock exams from SimplyMaths database to local cache"
        >
          <RefreshCw size={13} className={isSyncing ? "spin" : ""} /> 
          {isSyncing ? 'Syncing DB...' : 'Sync DB'}
        </button>
        <button style={{ ...S.btn, ...S.btnGhost }} onClick={() => setHasKeys(false)} title="Change API keys">
          <Key size={13} />
        </button>
        {(loading || isSyncing) && <Loader size={16} style={{ animation: 'spin 1s linear infinite', color: '#60a5fa' }} />}
        {isSyncing && <span style={{ fontSize: '11px', color: '#a78bfa' }}>Syncing server...</span>}
      </div>

      <div style={S.body}>
        {/* Exam list sidebar */}
        <div style={S.examList}>
          {error && (
            <div style={{ padding: '16px', color: '#ef4444', fontSize: '12px', display: 'flex', gap: '6px' }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              {error}
            </div>
          )}
          {filteredExams.length === 0 && !loading && !error && (
            <div style={S.empty}>
              {search ? 'No exams match your search' : 'No mock exams found'}
            </div>
          )}
          {filteredExams.map(exam => {
            const grade = extractGrade(exam);
            const isSelected = selectedExam?.id === exam.id;
            
            // Color codes matching the wizard grade pills
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
                  background: isSelected ? '#1e293b' : 'transparent',
                  borderLeft: isSelected ? '3px solid #7c3aed' : 'none',
                  paddingLeft: isSelected ? '11px' : '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
                onClick={() => selectExam(exam)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
                  {isSelected ? <ChevronDown size={13} style={{ color: '#c084fc', flexShrink: 0 }} /> : <ChevronRight size={13} style={{ color: '#64748b', flexShrink: 0 }} />}
                  <span style={{ 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    color: isSelected ? '#f1f5f9' : '#cbd5e1',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1
                  }}>
                    {exam.title}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', paddingLeft: '17px' }}>
                  {grade && (
                    <span style={{ 
                      fontSize: '9px', 
                      fontWeight: 700, 
                      padding: '1px 6px', 
                      borderRadius: '3px', 
                      background: gradeColors.bg, 
                      color: gradeColors.text 
                    }}>
                      {grade}
                    </span>
                  )}
                  <span style={{ 
                    fontSize: '9px', 
                    fontWeight: 500, 
                    padding: '1px 5px', 
                    borderRadius: '3px', 
                    background: 'rgba(255,255,255,0.03)', 
                    color: '#64748b' 
                  }}>
                    {(exam.questionCount || exam.questionIds?.length || exam.questions?.length || 0)} questions
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Questions panel */}
        <div style={S.qPanel}>
          {!selectedExam && (
            <div style={S.empty}>
              <Image size={40} style={{ margin: '0 auto 12px', color: '#334155' }} />
              <p>Select a mock exam to view its questions</p>
            </div>
          )}

          {selectedExam && loadingQuestions && (
            <div style={S.empty}>
              <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: '#60a5fa', margin: '0 auto 12px' }} />
              <p>Loading questions…</p>
            </div>
          )}

          {selectedExam && !loadingQuestions && examQuestions !== null && (
            <>
              <div style={{ marginBottom: '14px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>{selectedExam.title}</h2>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{filteredQuestions.length} questions</span>
              </div>
              {filteredQuestions.length === 0 ? (
                <div style={S.empty}>No questions found</div>
              ) : (
                <div style={S.qGrid}>
                  {filteredQuestions.map(q => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      examId={selectedExam.id}
                      onEditRepair={q => setEditRepairQuestion(q)}
                      onView={q => setViewQuestion(q)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Unified Edit / Repair modal */}
      {editRepairQuestion && (
        <QuestionEditorModal
          question={editRepairQuestion}
          onClose={() => setEditRepairQuestion(null)}
          onSaved={(updated) => {
            setExamQuestions(prev => prev.map(q => q.id === updated.id ? updated : q));
            setEditRepairQuestion(null);
          }}
        />
      )}

      {/* View Question in Empty Editor */}
      {viewQuestion && (
        <DiagramEditorModal
          question={viewQuestion}
          onClose={() => setViewQuestion(null)}
          viewMode={true}
          onSaved={(updated) => {
            setExamQuestions(prev => prev.map(q => q.id === updated.id ? updated : q));
            setViewQuestion(null);
          }}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
