import { CLIPART_ITEMS } from '../assets/clipartLibrary';
import { callGemini, getOrCreateShapeCache, getGeminiApiKey } from './geminiService';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// Model definitions
export const AVAILABLE_MODELS = [
  { id: 'gemini-3.5-flash',         label: 'Gemini 3.5 Flash',   provider: 'gemini',   supportsVision: true,  description: 'Fast, cheap, natively supports caching' },
  { id: 'claude-sonnet-4-6',       label: 'Claude Sonnet 4.6',  provider: 'claude',   supportsVision: true,  description: 'Best quality' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', provider: 'claude',   supportsVision: true,  description: 'Fast & cheap' },
  { id: 'deepseek-chat',            label: 'DeepSeek V3',        provider: 'deepseek', supportsVision: false, description: 'Very cheap (text only)' },
  { id: 'deepseek-reasoner',        label: 'DeepSeek R1',        provider: 'deepseek', supportsVision: false, description: 'Strong reasoning' },
];

export function getModel() {
  return localStorage.getItem('maths_model') || 'gemini-3.5-flash';
}
export function saveModel(id) {
  localStorage.setItem('maths_model', id);
}
export function getModelDef(id) {
  return AVAILABLE_MODELS.find(m => m.id === (id || getModel())) || AVAILABLE_MODELS[0];
}

export function getDeepSeekApiKey() { return localStorage.getItem('deepseek_api_key') || import.meta.env.VITE_DEEPSEEK_API_KEY || ''; }
export function saveDeepSeekApiKey(k) { localStorage.setItem('deepseek_api_key', k); }

export const SHAPE_CATALOGUE = `
Available shape types (use these exact strings for the "type" field):
- rectangle: { width, height, fill, stroke, strokeWidth, rotation }
- circle: { radius, fill, stroke, strokeWidth, rotation }
- triangle: { radius, fill, stroke, strokeWidth, rotation }
- polygon: { sides, radius, fill, stroke, strokeWidth, rotation }
- customPolygon: { points: [x1, y1, x2, y2, ...], fill, stroke, strokeWidth, closed, rotation } — closed custom polygon defined by relative coordinates; use this to draw custom irregular/composite shapes like L-shapes, T-shapes, or cut-corner rectangles (e.g. points relative to shape's x,y center)
- rasterImage: { src, width, height, opacity?, flipX?, flipY?, rotation } — renders a clipart/illustration (use for animals, items, vehicles, food). Set "src" to a lowercase word matching the item (e.g. "fishBlue", "butterfly", "apple", "car", "dog", "pencil", "clock", "house", "tree"). The system will automatically resolve the name to a high-quality Twemoji SVG.
- line: { length, stroke, strokeWidth, rotation }
- rightTriangle: { base, height, fill, stroke, strokeWidth, rotation }
- isoscelesTriangle: { base, height, fill, stroke, strokeWidth, rotation }
- equilateralTriangle: { sideLength, fill, stroke, strokeWidth, rotation }
- fractionCircle: { radius, sectors, shaded, fill, stroke, strokeWidth, rotation }
- fractionRectangle: { width, height, rows, cols, shaded, fill, stroke, strokeWidth, rotation }
- fractionBar: { width, height, partitions, shaded, fill, stroke, strokeWidth }
- numberline: { width, min, max, step, isOpen, jumpCount, jumpSize, labelMode, stroke, strokeWidth }
- cartesianPlane: { width, height, domain, range, step, showGrid, showLabels, stroke, strokeWidth, plots: [{expr, color}] }
- barGraph: { width, height, bars: [{label, value, color}], showGrid, strokeWidth }
- vennDiagram: { radius, overlapPercent, labelA, labelB, fillA, fillB, fillOverlap }
- annulus: { innerRadius, outerRadius, fill, stroke, strokeWidth, showLabels }
- bearings: { bearing, radius, stroke, strokeWidth, label }
- spinner: { radius, sectors, stroke, strokeWidth, pointerAngle, showPointer }
- factorTree: { rootValue, levelHeight, initialSpread, stroke, strokeWidth }
- angleMarker: { radius, angle, stroke, label }
- point: { radius, fill, label, labelPos }
- rightAngleMarker: { size, stroke, strokeWidth, rotation }
- lengthMarker: { length, label, stroke, strokeWidth, rotation }
- ruler: { width, units, stroke, strokeWidth }
- text: { text, fontSize, fontStyle, fill, fontFamily }
- spiderIcon: { size, fill, stroke, strokeWidth, label, labelPos } — stylised ant/spider creature with 6 legs; use for diagrams with insects/ants/spiders; label e.g. "(A)"
- robot: { width, height, label, fill, stroke, strokeWidth } — renders a customizable 2D robot figure. Set label to "A", "B", etc. Use for scale balance problems involving robots.
- weighingScale: { width, height, weightText, fill, stroke, strokeWidth } — renders a platform balance scale with a digital weight readout (e.g. weightText="85 kg").
- dottedLineArrow: { endX, endY, stroke, strokeWidth, dashSize, gapSize, pointerLength, pointerWidth } — dotted/dashed straight line with arrowhead from (0,0) to (endX,endY); use for dotted directional paths
- elbowArrow: { endX, endY, elbowStyle, stroke, strokeWidth, dash, dashSize, gapSize, pointerLength, pointerWidth } — orthogonal/right-angle connector arrow (mermaid flowchart style); elbowStyle: 'h-v','v-h','mid'
- bezierArrow: { endX, endY, curveStyle, curvature, stroke, strokeWidth, dash, dashSize, gapSize, pointerLength, pointerWidth } — smooth bezier curve arrow (plantuml style); curveStyle: 'auto','s-curve','c-curve'

CLOCK & TIME SHAPES — use these for any time/clock related questions:
- analogClock: { radius, hours, minutes, seconds, showSeconds, showNumbers, showTicks, faceColor, rimColor, handColor, secondColor, label, rimWidth, style }
    • hours: integer 0–11 (hour hand position), minutes: integer 0–59, seconds: integer 0–59
    • style: 'classic' (default) | 'minimal' | 'roman' (Roman numerals)
    • showSeconds: true to draw red second hand
    • Use for: "What time does this clock show?", elapsed time, half-past/quarter-to questions, reading time
    • Example: { type:'analogClock', x:300, y:250, radius:90, hours:3, minutes:30, label:'Clock A' }
- digitalClock: { timeText, width, height, style, bgColor, textColor, borderColor, label, fontSize }
    • timeText: exact string to display e.g. "3:15 PM", "09:45", "2:30 AM"
    • style: 'lcd' (green, default) | 'led' (red glow) | 'alarm' (cyan) | 'station' (amber, departure board style)
    • Use for: digital time reading, patterns of times, sequences of departure/arrival times as single-clock option shapes
    • Example: { type:'digitalClock', x:200, y:200, timeText:'10:15 AM', style:'lcd', width:160, height:80, label:'Bus departs' }
- departureBoard: { title, times, width, height, bgColor, textColor, titleColor, label }
    • title: board heading e.g. "DEPARTURES", "ARRIVALS", "TRAIN TIMES"
    • times: comma-separated list of time strings, use "?" for the missing entry e.g. "08:15,08:45,09:15,?"
    • Use for: train/bus departure pattern questions, time sequence puzzles with a question mark entry
    • Example: { type:'departureBoard', x:400, y:300, title:'DEPARTURES', times:'08:15,08:45,09:15,?', width:220, height:160 }

CLOCK QUESTION GUIDANCE:
  ✓ For "what time does this clock show?" → use analogClock with specified hours/minutes
  ✓ For "which clock shows 3:30?" → use analogClock for options (small radius ~50)
  ✓ For digital sequence/pattern questions → use departureBoard or multiple digitalClock shapes
  ✓ For elapsed time questions → show two analogClock or digitalClock shapes side by side
  ✓ Always label clocks if there are multiple (label: 'Clock A', 'Start', 'Finish', etc.)

All shapes require: { type, x, y }

Canvas is 800x600 logical pixels. Center is x=400, y=300.
For option diagrams the canvas is 400x300 — centre at x=200, y=150. Keep option shapes small and centred there.
`;

const SYSTEM_PROMPT = `You are a mathematics diagram generator for primary and middle school (Years 2–8).
Your job is to generate diagram objects and a multiple-choice question (MCQ) for the given request.

${SHAPE_CATALOGUE}

You MUST respond with ONLY valid JSON in exactly this structure:

{
  "objects": [ ...shapes for the main diagram... ],
  "question": "Question stem text",
  "correctAnswer": <option>,
  "distractors": [<option>, <option>, <option>]
}

Where <option> is either:
  - A plain string like "24 cm²"    — for purely numerical/word answers only
  - An object { "text": "label", "objects": [...shapes] }  — when a diagram makes the option clearer

DECISION RULE — use diagram options whenever the answer involves a visual:
  ✓ Bearings / directions (show a small compass with the bearing arrow)
  ✓ Shapes / geometry (show the shape)
  ✓ Fractions (show a fraction circle or bar)
  ✓ Graphs / charts (show a mini bar or line graph)
  ✓ Number lines (show the number line with the value marked)
  ✓ Angles (show the angle)
  ✓ Multiple design variants (show each design as a small diagram)
  ✓ Any question where seeing the answer is clearer than reading it

Use plain text ONLY for:
  - Pure numerical calculation answers (e.g. "35 cm²", "12.5 m")
  - Simple word answers with no visual component (e.g. "addition", "rectangle")

When using diagram options:
- EVERY option (correctAnswer AND all 3 distractors) MUST use { "text", "objects" } format
- Option canvas is 400×300; centre shapes at x=200, y=150
- Use 1–3 shapes per option, keep them simple and clearly different from each other
- "text" can be a short label (e.g. "120°") or "" if the diagram is self-explanatory

Example for a bearings question — correctAnswer and each distractor should be:
  { "text": "120°", "objects": [{ "type": "bearings", "x": 200, "y": 150, "bearing": 120, "radius": 80 }] }
  { "text": "060°", "objects": [{ "type": "bearings", "x": 200, "y": 150, "bearing": 60,  "radius": 80 }] }

Rules for all questions:
- "question" must be a clean stem only — it must NOT list or describe the options inside it
- Use CONCRETE numbers (e.g. "side = 10 m") NOT abstract variables like "s", "a × b"
- Clipart / Illustrations: When generating diagrams that involve objects, animals, vehicles, or fruit, you MUST use rasterImage with a descriptive src (e.g. "fishBlue", "butterfly", "apple", "car", "dog") rather than drawing them manually with vectors. This makes diagrams look highly polished and premium.
- correctAnswer must be mathematically correct — double-check your arithmetic before writing it
- distractors must be plausible but wrong — common student errors
- Do NOT include any explanation, markdown, or text outside the JSON

Mathematical rules to apply (do not get these wrong):
- Perimeter of a rectangle = 2×(length + width). Removing a corner rectangle does NOT change perimeter; removing from a mid-edge INCREASES it.
- Area of triangle = ½×base×height. Area of trapezium = ½×(a+b)×h.
- Fractions: always reduce to lowest terms. Equivalent fractions must have the same value.
- Bearings are measured clockwise from North, 000°–360°.
- Probability: all outcomes must sum to 1.
`;

// ─── API callers ──────────────────────────────────────────────────────────────

async function callClaude(userMessage, apiKey, modelId) {
  const model = modelId || getModel();
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude API error: ${response.status}`);
  }
  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return normalise(JSON.parse(cleaned)); }
  catch { throw new Error('Claude returned invalid JSON. Please try again.'); }
}

async function callDeepSeek(userMessage, apiKey) {
  const modelId = getModel();
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 6000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `DeepSeek API error: ${response.status}`);
  }
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return normalise(JSON.parse(cleaned)); }
  catch { throw new Error('DeepSeek returned invalid JSON. Please try again.'); }
}

// Route to correct provider
async function callAI(userMessage, apiKey) {
  const def = getModelDef();
  if (def.provider === 'deepseek') {
    const dsKey = apiKey || getDeepSeekApiKey();
    if (!dsKey) throw new Error('DeepSeek API key not set.');
    return callDeepSeek(userMessage, dsKey);
  }
  
  if (def.provider === 'gemini') {
    const gKey = apiKey || getGeminiApiKey();
    if (!gKey) throw new Error('Gemini API key not set.');
    
    // Explicitly document all available cliparts to maximize cache effectiveness
    const clipartNames = CLIPART_ITEMS.map(c => `- ${c.id}: ${c.label} (Category: ${c.category})`).join('\n');
    const fullSystemInstruction = SYSTEM_PROMPT + '\n\nAVAILABLE RASTERIMAGE CLIPARTS:\n' + clipartNames;
    
    // Use Context Caching to eliminate system prompt latency and cost
    const cacheName = await getOrCreateShapeCache(gKey, fullSystemInstruction, `models/${def.id}`);
    
    const resText = await callGemini({
      systemInstruction: fullSystemInstruction,
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      model: def.id,
      apiKey: gKey,
      cachedContentName: cacheName
    });
    
    try { return normalise(JSON.parse(resText)); }
    catch { throw new Error('Gemini returned invalid JSON. Please try again.'); }
  }
  
  return callClaude(userMessage, apiKey, def.id);
}

// ─── Normalisation ─────────────────────────────────────────────────────────────

function normaliseOption(opt) {
  if (typeof opt === 'string') return { text: opt, objects: null };
  if (opt && typeof opt === 'object')
    return { text: opt.text ?? '', objects: Array.isArray(opt.objects) ? opt.objects : null };
  return { text: String(opt), objects: null };
}

function normalise(raw) {
  return {
    objects: raw.objects ?? [],
    question: raw.question ?? '',
    correctAnswer: normaliseOption(raw.correctAnswer),
    distractors: (raw.distractors ?? []).map(normaliseOption),
  };
}

// ─── Verification pass (always Haiku — cheap) ─────────────────────────────────

const VERIFY_PROMPT = `You are a mathematics teacher checking a generated MCQ question for accuracy.
You receive JSON: { question, correctAnswer, distractors }.
Check:
1. Is "question" a clean stem with NO option descriptions embedded in it? If not, rewrite it.
2. Does "question" use concrete numbers (not abstract variables like "s", "a×b")? If not, substitute real values.
3. Is correctAnswer mathematically correct? If not, fix it.
4. Are the distractors wrong but plausible? Fix any accidentally-correct distractor.

Return ONLY the corrected JSON with identical structure — no markdown, no explanation:
{ "question": "...", "correctAnswer": <same format>, "distractors": [<same format>, ...] }`;

async function verifyAndFix(generated, claudeApiKey) {
  const payload = { question: generated.question, correctAnswer: generated.correctAnswer, distractors: generated.distractors };
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: VERIFY_PROMPT,
        messages: [{ role: 'user', content: JSON.stringify(payload) }],
      }),
    });
    if (!response.ok) return generated;
    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const fixed = JSON.parse(cleaned);
    return {
      ...generated,
      question: fixed.question ?? generated.question,
      correctAnswer: normaliseOption(fixed.correctAnswer ?? generated.correctAnswer),
      distractors: (fixed.distractors ?? generated.distractors).map(normaliseOption),
    };
  } catch { return generated; }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function generateDiagramFromPrompt(prompt, apiKey, yearLevel = 5) {
  const message = `Year ${yearLevel} mathematics diagram request: ${prompt}

Generate diagram objects and an MCQ. Use concrete numbers. Use diagram options if visual.`;
  const result = await callAI(message, apiKey);
  return verifyAndFix(result, apiKey);
}

export async function generateFromTemplate(template, config, apiKey, yearLevel = 5) {
  const configDesc = Object.entries(config)
    .map(([k, v]) => `  ${k} = ${JSON.stringify(v)}`).join('\n');
  const message = `Year ${yearLevel} mathematics diagram: ${template.name}
Description: ${template.description}
Question type: ${template.questionHints?.type || 'general'}

Configuration:
${configDesc}

Generate diagram objects and an MCQ. Use the configured values above as concrete numbers.
For a visual/geometry diagram, use diagram-based answer options (each option shows a small diagram).`;
  const result = await callAI(message, apiKey);
  return verifyAndFix(result, apiKey);
}

// ─── Image classification (always Haiku vision) ───────────────────────────────

const CLASSIFY_PROMPT = `You are analysing a primary/middle school mathematics question image.
Respond with ONLY valid JSON:
{
  "mathConcept": "short name e.g. 'bar graph', '3D rotation', 'bearings', 'fractions', 'perimeter designs'",
  "questionType": "geometry | data_graph | number | measurement | probability | spatial | fractions | algebra",
  "yearLevel": number 2–8,
  "diagramDescription": "precise description of the diagram structure",
  "questionSummary": "precise summary of what the question asks",
  "answerStyle": "diagram | numerical | text_word"
}`;

function buildSonnetImagePrompt(classification, yearLevel) {
  const yr = yearLevel || classification.yearLevel;
  return `You are looking at a Year ${yr} mathematics question image.
Create a COMPLETELY NEW, DIFFERENT question of the SAME TYPE:
- Same mathematical concept: ${classification.mathConcept}
- Same question style: ${classification.questionSummary}
- Use CONCRETE numbers — no abstract variables like "s", "a", "x"
- Different numbers, context, and wording — do NOT copy the original

Answer style: ${classification.answerStyle}
${classification.answerStyle === 'diagram'
  ? '→ EVERY option MUST be { "text": "short label", "objects": [...] } with 1–2 simple shapes at x=200,y=150. Options must look clearly different.'
  : '→ Use plain string options.'}

CRITICAL: Keep main diagram to 2–6 shapes. Only use shape types from the catalogue. Return ONLY JSON.`;
}

async function callClaudeWithImage(imageBase64, mimeType, systemPrompt, userText, apiKey, model, maxTokens = 1024) {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
        { type: 'text', text: userText },
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

export async function generateFromSampleImage(imageBase64, mimeType, apiKey, yearLevel) {
  // Step 1 — Haiku: cheap image classification
  let classification;
  try {
    classification = await callClaudeWithImage(
      imageBase64, mimeType, CLASSIFY_PROMPT,
      'Analyse this maths question image and return the JSON classification.',
      apiKey, 'claude-haiku-4-5-20251001', 512
    );
  } catch {
    classification = { mathConcept: 'mathematics diagram', questionType: 'geometry', yearLevel: yearLevel || 5, diagramDescription: 'a mathematics diagram', questionSummary: 'a mathematics question', answerStyle: 'diagram' };
  }

  // For geometry/spatial/multi-design questions, force diagram answer style
  if (['geometry', 'spatial', 'measurement'].includes(classification.questionType) && classification.answerStyle === 'text_word') {
    classification.answerStyle = 'diagram';
  }

  // Step 2 — Sonnet (vision): sees original image + classification context
  const userPrompt = buildSonnetImagePrompt(classification, yearLevel);
  const selectedDef = getModelDef();
  // Always use a Claude vision model for image-based generation
  const visionModel = selectedDef.supportsVision ? selectedDef.id : 'claude-sonnet-4-6';
  const raw = await callClaudeWithImage(imageBase64, mimeType, SYSTEM_PROMPT, userPrompt, apiKey, visionModel, 6000);

  const normalised = normalise(raw);
  const verified = await verifyAndFix(normalised, apiKey);
  return { ...verified, classification };
}

// ─── Image-to-editable-shapes analysis ───────────────────────────────────────

// Pass 1: Extract every visible text/number/time value from the image via OCR.
async function extractImageValues(base64, mimeType, apiKey) {
  const system = `You are a precise OCR assistant for educational maths diagrams.
Extract text exactly as it appears — do not paraphrase or normalise.`;
  const user = `Look at this diagram image carefully.
Extract ALL visible text, numbers, times, and labels EXACTLY as they appear.

Return ONLY valid JSON with this structure:
{
  "allTexts": ["every visible string, exactly as shown in the image"],
  "times": ["time values e.g. '10:15 AM', '08:30', '2:15 PM'"],
  "numbers": ["numeric values e.g. '42', '3.14', '?'"],
  "labels": ["letter/word labels e.g. 'A', 'B', 'DEPARTURES', 'ARRIVALS'"],
  "missingSlots": ["slots showing '?' that represent the unknown"],
  "diagramDescription": "one sentence describing the diagram type and what it shows"
}

Critical: copy every string character-for-character including AM/PM, colons, spaces, and question marks.`;

  try {
    return await callClaudeWithImage(base64, mimeType, system, user, apiKey, 'claude-sonnet-4-6', 1024);
  } catch {
    return { allTexts: [], times: [], numbers: [], labels: [], missingSlots: [], diagramDescription: '' };
  }
}

// Pass 3: Verify that generated shapes use the extracted values, fix any mismatches.
function verifyAndFixExtractedValues(shapes, extracted) {
  if (!extracted || !Array.isArray(extracted.allTexts) || extracted.allTexts.length === 0) return { shapes, issues: [] };

  const allValid = new Set(extracted.allTexts.map(t => String(t).trim()));
  const issues = [];

  const fixed = shapes.map(s => {
    const out = { ...s };

    // Check digitalClock timeText
    if (s.type === 'digitalClock' && s.timeText && !allValid.has(String(s.timeText).trim())) {
      // Find a time from extracted that's not already used by another shape
      const usedTimes = shapes.filter(o => o !== s && o.type === 'digitalClock').map(o => o.timeText);
      const candidate = (extracted.times || []).find(t => !usedTimes.includes(t));
      if (candidate) {
        issues.push({ type: 'digitalClock', field: 'timeText', was: s.timeText, fixed: candidate });
        out.timeText = candidate;
      } else {
        issues.push({ type: 'digitalClock', field: 'timeText', was: s.timeText, fixed: null });
      }
    }

    // Check departureBoard times string
    if (s.type === 'departureBoard' && s.times) {
      const slots = s.times.split(',').map(t => t.trim());
      const extractedTimes = extracted.times || [];
      if (extractedTimes.length > 0) {
        // Replace all non-'?' slots with extracted times in order
        const knownTimes = extractedTimes.filter(t => t !== '?');
        let ti = 0;
        const fixedSlots = slots.map(slot => {
          if (slot === '?') return '?';
          if (!allValid.has(slot) && ti < knownTimes.length) {
            const replacement = knownTimes[ti++];
            issues.push({ type: 'departureBoard', field: 'times', was: slot, fixed: replacement });
            return replacement;
          }
          ti++;
          return slot;
        });
        out.times = fixedSlots.join(',');
      }
    }

    // Check text shapes
    if (s.type === 'text' && s.text && !allValid.has(String(s.text).trim())) {
      issues.push({ type: 'text', field: 'text', was: s.text, fixed: null });
    }

    return out;
  });

  return { shapes: fixed, issues };
}

export const REGISTERED_COMPONENT_TYPES = [
  'rasterImage',
  'rectangle','circle','triangle','polygon','customPolygon','line','rightTriangle','isoscelesTriangle',
  'equilateralTriangle','fractionCircle','fractionRectangle','fractionBar','numberline',
  'cartesianPlane','barGraph','vennDiagram','annulus','bearings','spinner','factorTree',
  'angleMarker','point','rightAngleMarker','lengthMarker','ruler','text',
  'road','roadJunction','bridge','tree','river','lake','sea','mountain','footpath',
  'playground','airport','port','mapMarker','mapSprite','gridMap','scaleBar',
  'compassRose','sunDirection','flag','dataTable','coordAxes',
  'spiderIcon','dottedLineArrow','elbowArrow','bezierArrow',
  'robot', 'weighingScale',
  'analogClock', 'digitalClock', 'departureBoard',
];


const makeAnalyseForEditingPrompt = (imageUrl, extractedValues) => {
const extractedBlock = extractedValues && (extractedValues.allTexts || []).length > 0 ? `
━━━ EXACT VALUES EXTRACTED FROM THE ORIGINAL IMAGE — MANDATORY ━━━
These values were OCR-extracted from the image with high precision.
You MUST use these EXACT strings in the corresponding shape fields.
DO NOT substitute, round, invent, or paraphrase any of these values.

All visible texts:  ${(extractedValues.allTexts || []).map(t => `"${t}"`).join(', ')}
Time values:        ${(extractedValues.times || []).length ? (extractedValues.times || []).map(t => `"${t}"`).join(', ') : '(none)'}
Numbers:            ${(extractedValues.numbers || []).length ? (extractedValues.numbers || []).map(n => `"${n}"`).join(', ') : '(none)'}
Labels:             ${(extractedValues.labels || []).length ? (extractedValues.labels || []).map(l => `"${l}"`).join(', ') : '(none)'}
Missing slots (?):  ${(extractedValues.missingSlots || []).length ? (extractedValues.missingSlots || []).join(', ') : '(none)'}
Diagram type:       ${extractedValues.diagramDescription || ''}

ENFORCEMENT RULES:
• Every digitalClock "timeText" MUST be one of the time values listed above.
• Every departureBoard "times" field MUST contain only the time values above (comma-separated).
• Every text shape "text" field MUST match one of the allTexts values above.
• If the diagram shows a question mark "?" in a slot, keep that slot as "?" in the shape data.
• If a value appears in the image but you are unsure of exact formatting, use what is listed above.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : '';

return `You are analysing a primary/middle school maths diagram image.
Your task: reconstruct it as editable Konva shape objects using ONLY the registered component types below.
${extractedBlock}

REGISTERED COMPONENT TYPES (use EXACT strings):
${REGISTERED_COMPONENT_TYPES.join(', ')}

━━━ CLIPART LIBRARY — USE THESE INSTEAD OF DRAWING ILLUSTRATIONS ━━━
We have a built-in clipart library. When the diagram contains animals, vehicles, or objects
that match an entry below, use rasterImage with the exact URL from this list.

Available clipart (id → URL):
${CLIPART_ITEMS.map(i => `  ${i.id}: ${i.url}  [${i.label}]`).join('\n')}

- rasterImage: { src, x, y, width, height, opacity?, flipX?, flipY? }
  • src = one of the clipart URLs above (preferred), OR src="ORIGINAL" for the source image
  • flipX: true  = mirror horizontally (use for reflections across a vertical axis)
  • flipY: true  = mirror vertically   (use for reflections across a horizontal axis)
  • rotation = degrees clockwise (use for rotations/turns)

  STRATEGY for illustration MCQ questions (e.g. "which fish is the reflection?"):
  1. Identify the BEST matching clipart item (e.g. 'fish' for a fish question).
  2. Place ONE clipart rasterImage at the MAIN question illustration position (the "before" shape).
  3. For EACH MCQ option box (A/B/C/D), ALSO place a clipart rasterImage inside the box
     with the correct transformation (flipX, flipY, rotation) to show what that option looks like.
     Example for a horizontal reflection question:
       - Main fish (original):  { src: fishUrl, flipX: false, flipY: false }
       - Option A (reflected):  { src: fishUrl, flipX: true,  flipY: false }
       - Option B (original):   { src: fishUrl, flipX: false, flipY: false }
       - Option C (rotated 90): { src: fishUrl, rotation: 90 }
       - Option D (reflected+rotated): { src: fishUrl, flipX: true, rotation: 180 }
  4. Draw rectangle frames for each option box and add letter labels (A, B, C, D) as text.
  5. Add the question text and any geometric elements (dotted lines, arrows).
  ❌ DO NOT use src="ORIGINAL" for individual option boxes — use clipart URLs instead.
  ❌ DO NOT trace illustrations with customPolygon.

${SHAPE_CATALOGUE}

━━━ POSITIONING RULES (critical — follow exactly) ━━━
The canvas is 800×500 logical pixels. x increases right, y increases down. (0,0) = top-left.

STEP 1 — MAP THE IMAGE: For every element estimate its centre as a fraction of image width/height,
  then convert: canvasX = fracX × 800, canvasY = fracY × 500.
STEP 2 — SIZE ELEMENTS: Element spanning 20% of image width → 160 px wide on canvas.
STEP 3 — VERIFY: No two shapes overlap unless they do in the original.

• Same horizontal row → same (or very close) y values.
• NEVER cluster everything at the centre — spread to match the original layout.

COLOR RULES:
• Border/frame boxes → fill='#ffffff', stroke='#333333', strokeWidth=2. NEVER black fill.
• Geometric content shapes → fill='#a8d8ea' (light blue) unless the image shows otherwise.
• Text labels → fill='#000000'.

SHAPE RULES:
• IRREGULAR SHAPES (L-shape, notched rect, trapezoid): use customPolygon with points relative to shape x,y.
• TEXT LABELS: add a text shape for every visible number, letter, or word.

Also identify visual elements that CANNOT be represented by the registered components.

Respond ONLY with valid JSON:
{
  "description": "brief description",
  "diagramType": "e.g. reflection, geometry, graph, fraction, map, etc.",
  "shapes": [ ...shape objects with type, x, y, and type-specific props... ],
  "missingComponents": [
    { "name": "ComponentName", "description": "what it renders", "reason": "why needed" }
  ],
  "coveragePercent": number 0-100
}

If fully reproducible, missingComponents = [].
Image URL (for reference): ${imageUrl}`;
};

async function callClaudeWithImageUrl(imageUrl, systemPrompt, userText, apiKey, model, maxTokens = 1024) {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'url', url: imageUrl } },
        { type: 'text', text: userText },
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

async function fetchImageBase64(url) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const mimeType = blob.type || 'image/jpeg';
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ base64: reader.result.split(',')[1], mimeType });
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function analyseImageForEditing(imageUrl, apiKey) {
  // Fetch image as base64 first (avoids CORS in Konva canvas, also needed for Pass 1).
  const b64 = await fetchImageBase64(imageUrl);

  // ── Pass 1: Extract exact values (OCR) ───────────────────────────────────────
  let extractedValues = { allTexts: [], times: [], numbers: [], labels: [], missingSlots: [], diagramDescription: '' };
  if (b64) {
    extractedValues = await extractImageValues(b64.base64, b64.mimeType, apiKey);
  }

  // ── Pass 2: Generate shapes, injecting extracted values as hard constraints ──
  const prompt = makeAnalyseForEditingPrompt(imageUrl, extractedValues);
  const result = b64
    ? await callClaudeWithImage(b64.base64, b64.mimeType, prompt,
        'Analyse this diagram and output the JSON reconstruction. Use ONLY the exact values listed in the MANDATORY section.',
        apiKey, 'claude-haiku-4-5-20251001', 4096)
    : await callClaudeWithImageUrl(imageUrl, prompt,
        'Analyse this diagram and output the JSON reconstruction.',
        apiKey, 'claude-haiku-4-5-20251001', 4096);

  // Replace 'ORIGINAL' placeholder with a data URL.
  const dataUrlSrc = b64 ? `data:${b64.mimeType};base64,${b64.base64}` : imageUrl;
  let shapes = (Array.isArray(result.shapes) ? result.shapes : []).map(s =>
    s.type === 'rasterImage' && s.src === 'ORIGINAL' ? { ...s, src: dataUrlSrc } : s
  );

  // ── Pass 3: Verify & fix value mismatches ────────────────────────────────────
  const { shapes: verifiedShapes, issues } = verifyAndFixExtractedValues(shapes, extractedValues);

  return {
    description: result.description || '',
    diagramType: result.diagramType || 'diagram',
    shapes: verifiedShapes,
    missingComponents: Array.isArray(result.missingComponents) ? result.missingComponents : [],
    coveragePercent: typeof result.coveragePercent === 'number' ? result.coveragePercent : 100,
    extractedValues,
    valueVerification: issues,
  };
}

// ─── Key helpers ──────────────────────────────────────────────────────────────

export function getApiKey() { return localStorage.getItem('claude_api_key') || import.meta.env.VITE_CLAUDE_API_KEY || ''; }
export function saveApiKey(key) { localStorage.setItem('claude_api_key', key); }
