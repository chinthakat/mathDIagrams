const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// Model definitions
export const AVAILABLE_MODELS = [
  { id: 'claude-sonnet-4-6',       label: 'Claude Sonnet 4.6',  provider: 'claude',   supportsVision: true,  description: 'Best quality' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', provider: 'claude',   supportsVision: true,  description: 'Fast & cheap' },
  { id: 'deepseek-chat',            label: 'DeepSeek V3',        provider: 'deepseek', supportsVision: false, description: 'Very cheap (text only)' },
  { id: 'deepseek-reasoner',        label: 'DeepSeek R1',        provider: 'deepseek', supportsVision: false, description: 'Strong reasoning' },
];

export function getModel() {
  return localStorage.getItem('maths_model') || 'claude-sonnet-4-6';
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
function callAI(userMessage, apiKey) {
  const def = getModelDef();
  if (def.provider === 'deepseek') {
    const dsKey = apiKey || getDeepSeekApiKey();
    if (!dsKey) throw new Error('DeepSeek API key not set.');
    return callDeepSeek(userMessage, dsKey);
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

// ─── Key helpers ──────────────────────────────────────────────────────────────

export function getApiKey() { return localStorage.getItem('claude_api_key') || import.meta.env.VITE_CLAUDE_API_KEY || ''; }
export function saveApiKey(key) { localStorage.setItem('claude_api_key', key); }
