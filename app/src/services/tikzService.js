/**
 * tikzService — AI ↔ TikZ/PGF bridge.
 *
 * Claude generates LaTeX/TikZ code; TikZJax (loaded via CDN WASM) renders it
 * to a crisp SVG in-browser. No server required.
 *
 * TikZ is unmatched for exact math diagrams: coordinate planes, geometric
 * constructions, fraction models, number lines, bearings, etc.
 */

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// ── TikZJax CDN loader ────────────────────────────────────────────────────────

let tikzjaxLoaded = false;
let tikzjaxLoading = null;

export function loadTikZJax() {
  if (tikzjaxLoaded) return Promise.resolve();
  if (tikzjaxLoading) return tikzjaxLoading;

  tikzjaxLoading = new Promise((resolve, reject) => {
    // Load TikZJax CSS (optional, for inline rendering)
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.type = 'text/css';
    style.href = 'https://tikzjax.com/v1/fonts.css';
    document.head.appendChild(style);

    const script = document.createElement('script');
    script.src = 'https://tikzjax.com/v1/tikzjax.js';
    script.async = true;
    script.onload = () => {
      tikzjaxLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load TikZJax from CDN'));
    document.head.appendChild(script);
  });

  return tikzjaxLoading;
}

/**
 * Render TikZ source code to an SVG string using TikZJax.
 * TikZJax processes <script type="text/tikz"> tags in the DOM.
 * We inject a hidden container, let TikZJax render it, then extract the SVG.
 *
 * @param {string} tikzCode  - Full TikZ source (the \begin{tikzpicture}...\end{tikzpicture} block)
 * @param {object} opts      - { packages: [] extra LaTeX packages, timeout: ms }
 * @returns {Promise<string>} - SVG element outerHTML
 */
export async function renderTikZ(tikzCode, opts = {}) {
  await loadTikZJax();

  const packages = (opts.packages || []).join(',');
  const timeout  = opts.timeout || 30000;

  // Wrap in full TikZ document structure
  const fullCode = `
\\documentclass[tikz]{standalone}
${packages ? `\\usepackage{${packages}}` : ''}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18}
\\usepackage{amsmath,amssymb}
\\begin{document}
${tikzCode.trim()}
\\end{document}
  `.trim();

  // Create isolated container
  const containerId = `tikz-render-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const div = document.createElement('div');
  div.id = containerId;
  div.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:800px;height:600px;visibility:hidden;';

  const scriptEl = document.createElement('script');
  scriptEl.setAttribute('type', 'text/tikz');
  scriptEl.textContent = fullCode;
  div.appendChild(scriptEl);
  document.body.appendChild(div);

  try {
    // TikZJax processes script tags and replaces them with SVG elements
    // We need to wait for the mutation
    const svg = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('TikZJax render timeout'));
      }, timeout);

      const observer = new MutationObserver(() => {
        const svgEl = div.querySelector('svg');
        if (svgEl) {
          clearTimeout(timer);
          observer.disconnect();
          resolve(svgEl.outerHTML);
        }
      });
      observer.observe(div, { childList: true, subtree: true });

      // Trigger TikZJax to process the new element
      if (window.TikZJax) {
        window.TikZJax.processDocument(div);
      }
    });

    return svg;
  } finally {
    document.body.removeChild(div);
  }
}

/**
 * Convert TikZ SVG string to a PNG data-URL (for embedding in Konva or saving).
 */
export async function tikzSvgToPng(svgString, width = 800, height = 600) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG-to-PNG conversion failed')); };
    img.src = url;
  });
}

// ── AI: generate TikZ from text prompt ───────────────────────────────────────

export const TIKZ_SYSTEM_PROMPT = `You are an expert in LaTeX/TikZ for Australian primary and middle school mathematics education (Years 2–8).

You generate ONLY the \\begin{tikzpicture}...\\end{tikzpicture} block — no preamble, no \\documentclass, no \\begin{document}.

The output will be rendered with:
  \\usepackage{tikz}
  \\usepackage{pgfplots}
  \\usepackage{amsmath}
  \\usetikzlibrary{angles,quotes,arrows.meta,decorations.pathmorphing,decorations.markings,shapes.geometric,patterns}

TikZ best practices for school math diagrams:
- Use clean black lines on white background
- Clearly label all points, angles, measurements
- Use \\node for text labels; \\draw for shapes and lines
- For number lines: \\draw[->] with \\foreach for tick marks
- For coordinate planes: \\draw[step=1,gray!30,thin] for grid, \\draw[->] for axes
- For fractions: use rectangle fills with \\fill and \\draw
- For angles: use \\draw[<->] arc or \\pic{angle}
- For dotted paths: \\draw[dashed] or \\draw[dotted]
- For arrows: \\draw[->,>=Stealth,thick]
- For ant/creature paths: \\draw[dashed,->] with \\node for creature labels
- Coordinate scale: use centimetres (1cm = 1 unit) for clean output
- Canvas: approximately 10cm × 8cm; place diagram centered

Return ONLY the tikzpicture block, nothing else. No markdown fences.`;

export async function generateTikZFromPrompt(prompt, apiKey) {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: TIKZ_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Generate a TikZ diagram for: ${prompt}` }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude API error: ${response.status}`);
  }
  const data = await response.json();
  let code = data.content?.[0]?.text || '';
  // Strip any accidental fences
  code = code.replace(/^```(?:latex|tikz)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return code;
}

export async function analyseImageToTikZ(imageUrl, apiKey) {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: TIKZ_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'url', url: imageUrl } },
        { type: 'text', text: 'Analyse this mathematics diagram and generate a TikZ tikzpicture block that recreates it as accurately as possible. Return ONLY the \\begin{tikzpicture}...\\end{tikzpicture} block.' },
      ]}],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude API error: ${response.status}`);
  }
  const data = await response.json();
  let code = data.content?.[0]?.text || '';
  code = code.replace(/^```(?:latex|tikz)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return code;
}
