import React, { useState } from 'react';
import { AVAILABLE_MODELS, getModel, saveModel, getApiKey, saveApiKey, getDeepSeekApiKey, saveDeepSeekApiKey } from '../services/claudeService';

export default function ModelSelector({ onModelChange }) {
  const [currentModel, setCurrentModel] = useState(getModel);
  const [claudeKey, setClaudeKey] = useState(getApiKey);
  const [dsKey, setDsKey] = useState(getDeepSeekApiKey);
  const [open, setOpen] = useState(false);

  const def = AVAILABLE_MODELS.find(m => m.id === currentModel) || AVAILABLE_MODELS[0];

  const handleModelChange = (id) => {
    saveModel(id);
    setCurrentModel(id);
    onModelChange?.(id);
  };

  const handleSave = () => {
    saveApiKey(claudeKey);
    saveDeepSeekApiKey(dsKey);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Select AI model"
        style={{
          background: '#0f172a', border: '1px solid #334155', borderRadius: '6px',
          color: '#94a3b8', cursor: 'pointer', padding: '5px 10px', fontSize: '11px',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}
      >
        🤖 {def.label}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 2000,
          background: '#1e293b', border: '1px solid #334155', borderRadius: '10px',
          padding: '14px', minWidth: '300px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Generation Model
          </div>

          {AVAILABLE_MODELS.map(m => (
            <label key={m.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', marginBottom: '4px',
              background: currentModel === m.id ? 'rgba(99,102,241,0.12)' : 'transparent',
              border: `1px solid ${currentModel === m.id ? '#6366f1' : 'transparent'}`,
            }}>
              <input type="radio" name="model" value={m.id} checked={currentModel === m.id}
                onChange={() => handleModelChange(m.id)}
                style={{ marginTop: '2px', accentColor: '#6366f1' }} />
              <div>
                <div style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>{m.label}</div>
                <div style={{ color: '#64748b', fontSize: '11px' }}>
                  {m.description}{!m.supportsVision ? ' · no image input' : ''}
                </div>
              </div>
            </label>
          ))}

          <div style={{ borderTop: '1px solid #334155', marginTop: '12px', paddingTop: '12px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>API Keys</div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Claude (Anthropic)</label>
              <input type="password" value={claudeKey} onChange={e => setClaudeKey(e.target.value)}
                placeholder="sk-ant-..."
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: 'white', padding: '5px 8px', fontSize: '12px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>DeepSeek</label>
              <input type="password" value={dsKey} onChange={e => setDsKey(e.target.value)}
                placeholder="sk-..."
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: 'white', padding: '5px 8px', fontSize: '12px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setOpen(false)}
                style={{ padding: '5px 12px', borderRadius: '4px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
              <button onClick={handleSave}
                style={{ padding: '5px 12px', borderRadius: '4px', border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
