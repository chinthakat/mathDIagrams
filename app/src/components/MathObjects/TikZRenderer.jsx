/**
 * TikZRenderer — renders a TikZ source block to crisp SVG via TikZJax WASM CDN.
 *
 * Props:
 *   code       — TikZ source (the \begin{tikzpicture}...\end{tikzpicture} block)
 *   width      — container width (default 500)
 *   height     — container height (default 400)
 *   onSvg      — callback(svgString) when render completes
 *   onPng      — callback(pngDataUrl) when PNG export completes
 *   packages   — extra LaTeX packages to load (array of strings)
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadTikZJax, tikzSvgToPng } from '../../services/tikzService';
import { Loader, AlertTriangle, Download } from 'lucide-react';

export default function TikZRenderer({
  code,
  width = 500,
  height = 400,
  onSvg,
  onPng,
  packages = [],
  style = {},
}) {
  const [status, setStatus] = useState('idle'); // idle | loading | rendered | error
  const [error, setError] = useState(null);
  const [svgContent, setSvgContent] = useState(null);
  const containerRef = useRef(null);
  const renderIdRef = useRef(0);

  const render = useCallback(async (tikzCode) => {
    if (!tikzCode?.trim()) return;

    const renderId = ++renderIdRef.current;
    setStatus('loading');
    setError(null);
    setSvgContent(null);

    try {
      await loadTikZJax();
      if (renderIdRef.current !== renderId) return; // Stale render

      // Build full document
      const pkgLines = packages.map(p => `\\usepackage{${p}}`).join('\n');
      const fullCode = `\\documentclass[tikz,border=4pt]{standalone}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18}
\\usepackage{amsmath,amssymb}
\\usetikzlibrary{angles,quotes,arrows.meta,decorations.pathmorphing,decorations.markings,shapes.geometric,patterns,calc,intersections}
${pkgLines}
\\begin{document}
${tikzCode.trim()}
\\end{document}`;

      const tempId = `tikz_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const div = document.createElement('div');
      div.id = tempId;
      div.style.cssText = 'position:fixed;left:-9999px;top:-9999px;visibility:hidden;';

      const scriptEl = document.createElement('script');
      scriptEl.setAttribute('type', 'text/tikz');
      scriptEl.textContent = fullCode;
      div.appendChild(scriptEl);
      document.body.appendChild(div);

      const svg = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Render timeout (30s) — check TikZ syntax')), 30000);

        const observer = new MutationObserver(() => {
          const svgEl = div.querySelector('svg');
          if (svgEl) {
            clearTimeout(timer);
            observer.disconnect();
            resolve(svgEl.outerHTML);
          }
          // Check for error indicator
          const errEl = div.querySelector('.tikzjax-error');
          if (errEl) {
            clearTimeout(timer);
            observer.disconnect();
            reject(new Error(errEl.textContent || 'TikZJax compile error'));
          }
        });
        observer.observe(div, { childList: true, subtree: true, attributes: true });

        // Trigger processing
        if (window.tikzjax) window.tikzjax(div);
        else if (window.TikZJax?.processDocument) window.TikZJax.processDocument(div);
      });

      document.body.removeChild(div);

      if (renderIdRef.current !== renderId) return;

      setSvgContent(svg);
      setStatus('rendered');
      onSvg?.(svg);

      // Auto-export PNG if requested
      if (onPng) {
        const png = await tikzSvgToPng(svg, width * 2, height * 2);
        if (renderIdRef.current === renderId) onPng(png);
      }
    } catch (e) {
      if (renderIdRef.current !== renderId) return;
      setError(e.message);
      setStatus('error');
    }
  }, [packages, width, height, onSvg, onPng]);

  useEffect(() => {
    render(code);
  }, [code, render]);

  const handleDownload = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'diagram.svg';
    a.click();
  };

  return (
    <div
      ref={containerRef}
      style={{
        width, height, position: 'relative', background: '#fff',
        border: '1px solid #e2e8f0', borderRadius: '4px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', ...style,
      }}
    >
      {status === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: '#64748b' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '13px' }}>Compiling TikZ via WASM…</span>
        </div>
      )}

      {status === 'rendered' && svgContent && (
        <>
          <div
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
          <button
            onClick={handleDownload}
            title="Download SVG"
            style={{
              position: 'absolute', bottom: '6px', right: '6px',
              background: '#1e293bcc', color: '#fff', border: 'none', borderRadius: '4px',
              padding: '4px 8px', fontSize: '10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600,
            }}
          >
            <Download size={10} /> SVG
          </button>
        </>
      )}

      {status === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', textAlign: 'center' }}>
          <AlertTriangle size={20} color="#f59e0b" />
          <span style={{ fontSize: '12px', color: '#ef4444', maxWidth: '90%' }}>{error}</span>
        </div>
      )}

      {status === 'idle' && (
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>No TikZ code</span>
      )}

      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
