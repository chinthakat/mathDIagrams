/**
 * JSXGraphBoard — React wrapper for JSXGraph.
 *
 * Renders a live, interactive mathematical board from a BoardConfig JSON.
 * Can export to PNG for embedding elsewhere.
 *
 * Props:
 *   config     — BoardConfig JSON (see jsxgraphService.js schema)
 *   width      — number (default 500)
 *   height     — number (default 400)
 *   interactive — boolean (allow user drag, default false for question display)
 *   onExport   — callback(pngDataUrl) called when export is triggered
 *   className  — extra CSS class
 */
import React, { useEffect, useRef, useId, useState } from 'react';
import { createBoard, destroyBoard, boardToDataUrl } from '../../services/jsxgraphService';

// Inject JSXGraph CSS once
let cssInjected = false;
function injectCSS() {
  if (cssInjected) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/node_modules/jsxgraph/distrib/jsxgraph.css';
  document.head.appendChild(link);
  cssInjected = true;
}

// Dynamically load JSXGraph JS (sets window.JXG)
let jxgLoading = null;
async function loadJXG() {
  if (window.JXG) return;
  if (jxgLoading) return jxgLoading;
  jxgLoading = import('jsxgraph').then(mod => {
    if (mod.default) window.JXG = mod.default;
    else if (mod.JXG) window.JXG = mod.JXG;
  });
  return jxgLoading;
}

export default function JSXGraphBoard({
  config,
  width = 500,
  height = 400,
  interactive = false,
  onExport,
  style = {},
}) {
  const uid = useId().replace(/:/g, '_');
  const containerId = `jxg_${uid}`;
  const boardRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    injectCSS();
    let cancelled = false;

    loadJXG().then(() => {
      if (cancelled) return;
      try {
        // Destroy previous board if config changes
        if (boardRef.current) {
          destroyBoard(containerId);
          boardRef.current = null;
        }

        if (!config || !window.JXG) return;

        // Apply interactivity override
        const cfg = interactive
          ? config
          : {
              ...config,
              boardAttrs: {
                ...(config.boardAttrs || {}),
                pan: { enabled: false },
                zoom: { enabled: false },
              },
            };

        boardRef.current = createBoard(containerId, cfg);
        setReady(true);
      } catch (e) {
        setError(e.message);
      }
    }).catch(e => setError(e.message));

    return () => {
      cancelled = true;
      try {
        destroyBoard(containerId);
        boardRef.current = null;
      } catch (_) {}
    };
  }, [config, containerId, interactive]);

  const handleExport = () => {
    if (!boardRef.current || !onExport) return;
    const url = boardToDataUrl(boardRef.current);
    if (url) onExport(url);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block', ...style }}>
      <div
        id={containerId}
        style={{ width, height, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px' }}
      />
      {error && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#fff8', fontSize: '12px', color: '#ef4444',
          padding: '8px', textAlign: 'center',
        }}>
          JSXGraph error: {error}
        </div>
      )}
      {onExport && ready && (
        <button
          onClick={handleExport}
          style={{
            position: 'absolute', bottom: '6px', right: '6px',
            background: '#1e293b', color: '#fff', border: 'none', borderRadius: '4px',
            padding: '4px 8px', fontSize: '10px', cursor: 'pointer', fontWeight: 600,
          }}
        >
          Export PNG
        </button>
      )}
    </div>
  );
}
