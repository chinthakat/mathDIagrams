import React, { useState } from 'react';
import { Plus, X, Pencil } from 'lucide-react';

export default function TabBar({ documents, activeDocId, setActiveDocId, createDoc, deleteDoc, renameDoc }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleDoubleClick = (doc) => {
    setEditingId(doc.id);
    setEditValue(doc.name);
  };

  const submitRename = (id) => {
    if (editValue.trim()) {
      renameDoc(id, editValue.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') submitRename(id);
    if (e.key === 'Escape') setEditingId(null);
  };

  return (
    <div className="tab-bar">
      <div className="tabs-container">
        {documents.map(doc => (
          <div 
            key={doc.id} 
            className={`tab ${doc.id === activeDocId ? 'active' : ''}`}
            onClick={() => setActiveDocId(doc.id)}
            onDoubleClick={() => handleDoubleClick(doc)}
          >
            {editingId === doc.id ? (
              <input
                type="text"
                className="tab-rename-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => submitRename(doc.id)}
                onKeyDown={(e) => handleKeyDown(e, doc.id)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="tab-title">{doc.name}</span>
            )}
            
            {documents.length > 1 && (
              <button 
                className="tab-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteDoc(doc.id);
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      <button className="tab-add-btn" onClick={createDoc} title="New Diagram">
        <Plus size={18} />
      </button>
      
      {/* Portal target removed from here, moved to App.jsx sub-toolbar */}
    </div>
  );
}
