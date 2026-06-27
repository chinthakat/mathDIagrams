/**
 * jsxgraphService — standardised AI ↔ JSXGraph bridge.
 *
 * AI generates a BoardConfig JSON; this service creates the live JSXGraph board
 * from that config and can export it to PNG for embedding in Konva.
 *
 * BoardConfig schema (what Claude outputs):
 * {
 *   boundingBox: [xMin, yMax, xMax, yMin],   // default [-6, 6, 6, -6]
 *   axis: boolean,
 *   grid: boolean,
 *   elements: [
 *     // Points
 *     { type: 'point',    id, coords: [x,y], name, size, color, fixed }
 *     // Segments / Lines / Rays
 *     { type: 'segment',  id, points: [id1, id2], color, strokeWidth, dash }
 *     { type: 'line',     id, points: [id1, id2], color, strokeWidth, dash }
 *     // Circles
 *     { type: 'circle',   id, center: id, through: id,  color, fillColor, strokeWidth }
 *     { type: 'circle',   id, center: id, radius: num,  color, fillColor, strokeWidth }
 *     // Polygons
 *     { type: 'polygon',  id, vertices: [id,...], color, fillColor, strokeWidth }
 *     // Angles
 *     { type: 'angle',    id, points: [A,B,C], radius, color, label }
 *     // Function graphs
 *     { type: 'functiongraph', id, fn: 'Math.sin(x)', domain: [a,b], color, strokeWidth }
 *     // Text
 *     { type: 'text',     id, coords: [x,y], text, fontSize, color }
 *     // Arrows (as lines with pointers)
 *     { type: 'arrow',    id, points: [id1, id2], color, strokeWidth }
 *     // Right-angle marker
 *     { type: 'rightangle', id, points: [A,B,C], size, color }
 *     // Midpoint
 *     { type: 'midpoint', id, points: [id1, id2], name, color }
 *     // Parallel line through point
 *     { type: 'parallel', id, line: id, point: id, color }
 *     // Perpendicular line through point
 *     { type: 'perpendicular', id, line: id, point: id, color }
 *   ]
 * }
 */

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// ── Default JSXGraph board attributes ─────────────────────────────────────────

const DEFAULT_BOARD_ATTRS = {
  boundingbox: [-6, 6, 6, -6],
  axis: true,
  grid: true,
  showCopyright: false,
  showNavigation: false,
  keepAspectRatio: true,
  pan: { enabled: false },
  zoom: { enabled: false },
};

// ── Board builder ──────────────────────────────────────────────────────────────

/**
 * Create a JSXGraph board from a BoardConfig JSON.
 * @param {string} containerId  - DOM id of the container div
 * @param {object} config       - BoardConfig JSON from AI or manual
 * @returns {JXG.Board}
 */
export function createBoard(containerId, config) {
  // Dynamic import so tree-shaking still works if JSXGraph isn't used
  const JXG = window.JXG;
  if (!JXG) throw new Error('JSXGraph not loaded');

  const bb = config.boundingBox || [-6, 6, 6, -6];

  const board = JXG.JSXGraph.initBoard(containerId, {
    ...DEFAULT_BOARD_ATTRS,
    boundingbox: bb,
    axis: config.axis !== false,
    grid: config.grid !== false,
    ...(config.boardAttrs || {}),
  });

  const elementMap = {}; // id → JXG element

  const getEl = (id) => {
    if (elementMap[id]) return elementMap[id];
    // Try to find by board element id
    return board.select(id) || null;
  };

  const color = (c) => c || '#000000';
  const sw = (s) => s || 2;

  for (const el of (config.elements || [])) {
    try {
      let jel;

      switch (el.type) {
        case 'point':
          jel = board.create('point', el.coords || [0, 0], {
            id: el.id,
            name: el.name ?? '',
            size: el.size ?? 4,
            strokeColor: color(el.color),
            fillColor: color(el.fillColor || el.color),
            fixed: el.fixed || false,
            label: el.label ? { autoPosition: true } : {},
          });
          break;

        case 'segment':
          jel = board.create('segment', [getEl(el.points[0]), getEl(el.points[1])], {
            id: el.id,
            strokeColor: color(el.color),
            strokeWidth: sw(el.strokeWidth),
            dash: el.dash ? 2 : 0,
          });
          break;

        case 'line':
          jel = board.create('line', [getEl(el.points[0]), getEl(el.points[1])], {
            id: el.id,
            strokeColor: color(el.color),
            strokeWidth: sw(el.strokeWidth),
            dash: el.dash ? 2 : 0,
          });
          break;

        case 'arrow':
          jel = board.create('arrow', [getEl(el.points[0]), getEl(el.points[1])], {
            id: el.id,
            strokeColor: color(el.color),
            strokeWidth: sw(el.strokeWidth),
          });
          break;

        case 'circle':
          if (el.through) {
            jel = board.create('circle', [getEl(el.center), getEl(el.through)], {
              id: el.id,
              strokeColor: color(el.color),
              fillColor: el.fillColor || 'transparent',
              strokeWidth: sw(el.strokeWidth),
            });
          } else {
            jel = board.create('circle', [getEl(el.center), el.radius ?? 1], {
              id: el.id,
              strokeColor: color(el.color),
              fillColor: el.fillColor || 'transparent',
              strokeWidth: sw(el.strokeWidth),
            });
          }
          break;

        case 'polygon':
          jel = board.create('polygon', el.vertices.map(getEl), {
            id: el.id,
            strokeColor: color(el.color),
            fillColor: el.fillColor || 'transparent',
            strokeWidth: sw(el.strokeWidth),
          });
          break;

        case 'angle':
          jel = board.create('angle', el.points.map(getEl), {
            id: el.id,
            radius: el.radius ?? 0.5,
            strokeColor: color(el.color),
            name: el.label ?? '',
          });
          break;

        case 'functiongraph': {
          // eslint-disable-next-line no-new-func
          const fn = new Function('x', `return (${el.fn})`);
          jel = board.create('functiongraph', [fn, ...(el.domain || [])], {
            id: el.id,
            strokeColor: color(el.color),
            strokeWidth: sw(el.strokeWidth),
          });
          break;
        }

        case 'text':
          jel = board.create('text', [...(el.coords || [0, 0]), el.text || ''], {
            id: el.id,
            fontSize: el.fontSize ?? 14,
            strokeColor: color(el.color),
            anchorX: 'middle',
            anchorY: 'middle',
          });
          break;

        case 'rightangle':
          jel = board.create('angle', el.points.map(getEl), {
            id: el.id,
            type: 'square',
            radius: el.size ?? 0.3,
            strokeColor: color(el.color),
            fillColor: 'transparent',
            name: '',
          });
          break;

        case 'midpoint':
          jel = board.create('midpoint', el.points.map(getEl), {
            id: el.id,
            name: el.name ?? 'M',
            strokeColor: color(el.color),
            fillColor: color(el.color),
          });
          break;

        case 'parallel':
          jel = board.create('parallel', [getEl(el.line), getEl(el.point)], {
            id: el.id,
            strokeColor: color(el.color),
          });
          break;

        case 'perpendicular':
          jel = board.create('perpendicular', [getEl(el.line), getEl(el.point)], {
            id: el.id,
            strokeColor: color(el.color),
          });
          break;

        default:
          console.warn(`[JSXGraph] Unknown element type: ${el.type}`);
          continue;
      }

      if (jel && el.id) elementMap[el.id] = jel;
    } catch (err) {
      console.warn(`[JSXGraph] Error creating element "${el.id}" (${el.type}):`, err.message);
    }
  }

  return board;
}

/**
 * Destroy a board cleanly.
 */
export function destroyBoard(containerId) {
  const JXG = window.JXG;
  if (JXG?.JSXGraph) JXG.JSXGraph.freeBoard(containerId);
}

/**
 * Export a board to PNG data-url.
 */
export function boardToDataUrl(board) {
  return board.renderer.dumpToDataURI
    ? board.renderer.dumpToDataURI('image/png')
    : null;
}

// ── AI: generate BoardConfig from text prompt ─────────────────────────────────

const JSXGRAPH_SYSTEM_PROMPT = `You are a mathematics diagram generator.
Your output is a JSXGraph BoardConfig JSON object.

Schema:
{
  "boundingBox": [xMin, yMax, xMax, yMin],
  "axis": boolean,
  "grid": boolean,
  "elements": [
    // Use ONLY these element types:
    // point:         { type, id, coords:[x,y], name, size, color, fixed }
    // segment:       { type, id, points:[id1,id2], color, strokeWidth, dash }
    // line:          { type, id, points:[id1,id2], color, strokeWidth, dash }
    // arrow:         { type, id, points:[id1,id2], color, strokeWidth }
    // circle:        { type, id, center:id, through:id OR radius:num, color, fillColor, strokeWidth }
    // polygon:       { type, id, vertices:[id,...], color, fillColor, strokeWidth }
    // angle:         { type, id, points:[A,B,C], radius, color, label }
    // functiongraph: { type, id, fn:"Math.sin(x)", domain:[a,b], color, strokeWidth }
    // text:          { type, id, coords:[x,y], text, fontSize, color }
    // rightangle:    { type, id, points:[A,B,C], size, color }
    // midpoint:      { type, id, points:[id1,id2], name, color }
    // parallel:      { type, id, line:id, point:id, color }
    // perpendicular: { type, id, line:id, point:id, color }
  ]
}

Rules:
- EVERY element referenced by another (e.g. in a segment) MUST be defined earlier in the array
- IDs must be unique strings
- Use colors as hex strings
- For function graphs, write fn as a valid JavaScript expression using x (e.g. "Math.pow(x,2)", "2*x+3")
- Return ONLY valid JSON, no markdown, no explanation`;

export async function generateJSXGraphFromPrompt(prompt, apiKey) {
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
      system: JSXGRAPH_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Generate a JSXGraph board for: ${prompt}` }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude API error: ${response.status}`);
  }
  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

export async function analyseImageToJSXGraph(imageUrl, apiKey) {
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
      system: JSXGRAPH_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'url', url: imageUrl } },
        { type: 'text', text: 'Analyse this mathematics diagram and generate a JSXGraph BoardConfig JSON that recreates it as accurately as possible.' },
      ]}],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude API error: ${response.status}`);
  }
  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}
