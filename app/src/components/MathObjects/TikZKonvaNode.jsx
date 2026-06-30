import React, { useState, useEffect, useRef } from 'react';
import { Group, Image as KonvaImage, Rect, Text } from 'react-konva';
import { loadTikZJax, tikzSvgToPng } from '../../services/tikzService';

export default function TikZKonvaNode({ props }) {
  const { code, width = 400, height = 300 } = props || {};
  const [img, setImg] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const activeRenderId = useRef(0);

  useEffect(() => {
    if (!code?.trim()) {
      setImg(null);
      setStatus('idle');
      return;
    }

    const renderId = ++activeRenderId.current;
    setStatus('loading');
    setImg(null);

    const compileAndLoad = async () => {
      const w = Number(width) || 400;
      const h = Number(height) || 300;

      try {
        await loadTikZJax();
        if (activeRenderId.current !== renderId) return;

        // Build full document (same libraries and packages loaded by TikZRenderer)
        const fullCode = `\\documentclass[tikz,border=4pt]{standalone}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18}
\\usepackage{amsmath,amssymb}
\\usetikzlibrary{angles,quotes,arrows.meta,decorations.pathmorphing,decorations.markings,shapes.geometric,patterns,calc,intersections}
\\begin{document}
${code.trim()}
\\end{document}`;

        const tempId = `tikz_konva_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const div = document.createElement('div');
        div.id = tempId;
        div.style.cssText = 'position:fixed;left:-9999px;top:-9999px;visibility:hidden;';

        const scriptEl = document.createElement('script');
        scriptEl.setAttribute('type', 'text/tikz');
        scriptEl.textContent = fullCode;
        div.appendChild(scriptEl);
        document.body.appendChild(div);

        const svg = await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('Render timeout (30s)')), 30000);

          const observer = new MutationObserver(() => {
            const svgEl = div.querySelector('svg');
            if (svgEl) {
              clearTimeout(timer);
              observer.disconnect();
              resolve(svgEl.outerHTML);
            }
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

        if (activeRenderId.current !== renderId) return;

        // Convert the rendered TikZ SVG to PNG (scaling up 2x for crispness on Konva canvas)
        const pngDataUrl = await tikzSvgToPng(svg, w * 2, h * 2);
        if (activeRenderId.current !== renderId) return;

        const image = new window.Image();
        image.onload = () => {
          if (activeRenderId.current === renderId) {
            setImg(image);
            setStatus('done');
          }
        };
        image.onerror = () => {
          if (activeRenderId.current === renderId) {
            setStatus('error');
          }
        };
        image.src = pngDataUrl;
      } catch (err) {
        console.error('TikZKonvaNode error:', err);
        if (activeRenderId.current === renderId) {
          setStatus('error');
        }
      }
    };

    compileAndLoad();

    return () => {
      // Cancel active compile/load operation if component unmounts or props change
      activeRenderId.current = 0;
    };
  }, [code, width, height]);

  const w = Number(width) || 400;
  const h = Number(height) || 300;

  return (
    <Group>
      <Rect width={w} height={h} fill="#ffffff" stroke="#e2e8f0" strokeWidth={1}  />
      {status === 'done' && img ? (
        <KonvaImage image={img} width={w} height={h}  />
      ) : (
        <Text
          text={
            status === 'loading' ? 'Compiling TikZ…' :
            status === 'error'   ? 'TikZ error' :
                                   'No TikZ code'
          }
          width={w} height={h}
          align="center" verticalAlign="middle"
          fontSize={13} fill="#94a3b8"
          
        />
      )}
    </Group>
  );
}

