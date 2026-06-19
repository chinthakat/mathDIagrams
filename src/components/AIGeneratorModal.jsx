import React, { useState } from 'react';
import { X, Sparkles, Send } from 'lucide-react';

export default function AIGeneratorModal({ isOpen, onClose, onGenerate }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const examplePrompts = [
    "Create a fraction circle showing 5/8",
    "Draw a right triangle ABC with angle B = 90°",
    "Create a Year 5 ICAS-style number line",
    "Generate a coordinate grid with points A(2,3), B(5,1), C(6,4)"
  ];

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      onGenerate(prompt);
      setIsGenerating(false);
      onClose();
    }, 1500);
  };

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
        width: '650px',
        maxWidth: '90%',
        maxHeight: '85vh',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} style={{ color: 'var(--accent)' }} />
            <h3 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: 600 }}>AI Diagram Generator</h3>
          </div>
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

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#e2e8f0', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Describe your diagram:</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Draw an isosceles triangle ABC where AB = AC and angle A = 40°"
              style={{
                width: '100%',
                minHeight: '120px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: 'white',
                padding: '12px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleGenerate();
                }
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#e2e8f0', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Try these examples:</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(example)}
                  style={{
                    textAlign: 'left',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = 'var(--accent)';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#334155';
                    e.target.style.color = '#cbd5e1';
                  }}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #334155',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: '1px solid #334155',
              background: 'transparent',
              color: '#e2e8f0',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.borderColor = '#475569'}
            onMouseLeave={(e) => e.target.style.borderColor = '#334155'}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            style={{
              padding: '10px 24px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              cursor: isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: isGenerating || !prompt.trim() ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
          >
            {isGenerating ? (
              <span>Generating...</span>
            ) : (
              <>
                <Send size={16} />
                Generate Diagram
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
