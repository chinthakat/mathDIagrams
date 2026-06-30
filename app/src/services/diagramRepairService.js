/**
 * Agentic pipeline for repairing/regenerating question diagrams.
 *
 * Pipeline:
 *   Step 1 — Haiku vision: Analyze existing question image → classification + shape instructions
 *   Step 2 — Sonnet:       Generate MathsDiagram shape objects from instructions + user hints
 *   Step 3 — Haiku vision: Validate the rendered canvas screenshot against a checklist
 *   Loop up to maxRetries (default 5), feeding validation feedback back into Step 2
 *
 * Every model call is logged via pipelineLogger (→ server/logs/repair_pipeline.log).
 */

import { SHAPE_CATALOGUE, REGISTERED_COMPONENT_TYPES } from './claudeService.js';
import { logModelCall, logEvent, clearSessionLog } from './pipelineLogger.js';
import { generateGeminiImage, validateWithGemini, analyzeQuestionImageWithGemini, generateRepairShapesWithGemini, getOrCreateShapeCache } from './geminiService.js';
import { CLIPART_ITEMS } from '../assets/clipartLibrary';


const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// ── JSON extraction — handles preamble text before code blocks ────────────────

function extractJson(raw) {
  // 1. Prefer an explicit ```json ... ``` block (handles preamble thinking text)
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) return codeBlock[1].trim();
  // 2. Find first [ or { and return from there
  const arrIdx = raw.indexOf('[');
  const objIdx = raw.indexOf('{');
  const start = arrIdx === -1 ? objIdx : objIdx === -1 ? arrIdx : Math.min(arrIdx, objIdx);
  if (start !== -1) return raw.slice(start).trim();
  return raw.trim();
}

// ── Claude caller with full request/response logging ─────────────────────────

async function callClaude({ stage, attempt, model, system, messages, apiKey, maxTokens = 2048 }) {
  const t0 = Date.now();
  let responseText = '';

  try {
    const resp = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `Claude API error: ${resp.status}`);
    }

    const data = await resp.json();
    responseText = data.content?.[0]?.text || '';
    const cleaned = extractJson(responseText);

    // Try to parse so we can log the structured result
    let parsedResult = null;
    try { parsedResult = JSON.parse(cleaned); } catch {}

    await logModelCall({
      stage, attempt, model,
      systemPrompt: system,
      userMessages: messages,
      responseText,
      parsedResult,
      durationMs: Date.now() - t0,
    });

    return cleaned;
  } catch (e) {
    await logModelCall({
      stage, attempt, model,
      systemPrompt: system,
      userMessages: messages,
      responseText,
      parsedResult: null,
      durationMs: Date.now() - t0,
      error: e.message,
    });
    throw e;
  }
}

function buildImageContent(imageUrlOrBase64) {
  if (!imageUrlOrBase64) throw new Error('No image URL provided');
  if (imageUrlOrBase64.startsWith('data:')) {
    const b64 = imageUrlOrBase64.split(',')[1];
    const mt = imageUrlOrBase64.match(/data:(image\/\w+)/)?.[1] || 'image/png';
    return { type: 'image', source: { type: 'base64', media_type: mt, data: b64 } };
  }
  return { type: 'image', source: { type: 'url', url: imageUrlOrBase64 } };
}

// ── Step 1: Analyze existing image ────────────────────────────────────────────

const makeAnalyzeSystemPrompt = () => `You are a mathematics diagram analyst for primary and middle school questions.
Analyse the image carefully and return ONLY valid JSON (no markdown, no preamble):
{
  "diagramType": "short name e.g. 'bar graph', 'number line', 'fraction comparison grid'",
  "shapeComponents": ["list of visible shape types: rectangle, circle, line, text, etc."],
  "diagramDescription": "precise description of every element — positions, labels, colours, how many parts each shape is divided into and how many are shaded",
  "questionContext": "what the question is asking",
  "generationInstructions": "Step-by-step Konva-shape instructions for recreating this diagram. Include ALL shapes, exact division counts, shading counts, colours, and labels. Assume an 800x600 coordinate system with (0,0) at top-left. Explicitly state approximate X and Y coordinates for every shape. IMPORTANT: When the image contains illustrations of animals, vehicles, fruit, people, portals, or common objects, you MUST suggest using rasterImage with the EXACT matching clipart ID from the AVAILABLE RASTERIMAGE CLIPARTS list below, rather than drawing them with vectors. Mention the matched ID (e.g. 'person', 'portal') clearly in your instructions. CLOCK & TIME SHAPES: When the image contains an analogue clock face (round, with hands), use type 'analogClock' with hours/minutes props. When it contains a digital clock display (rectangular LED/LCD screen with digits), use type 'digitalClock' with timeText prop. When it contains a departure/arrival board (dark board listing multiple times), use type 'departureBoard' with title and times (comma-separated, '?' for missing entry) props.",
  "imagePrompt": "Detailed pixel-level instructions for an image AI to draw this diagram from scratch on a white background with black outlines. Describe the exact layout, each shape's position (using the 800x600 grid), size, colour, how many sections it is divided into, exactly which sections are shaded and which are white, and any text labels.",
  "verificationChecklist": [
    "VISUAL checks only — describe exactly what must be physically visible in a correct rendering. No maths, no fraction answers, no ✓ or ✗.",
    "Format every item as a factual statement about pixels/colours/counts",
    "Each item must be independently verifiable by looking at the image — no logic, no fractions as answers.",
    "If the image contains real-world objects or complex items (clocks, animals, vehicles), add a checklist item to ensure they are rendered cleanly as cliparts or dedicated components (not as messy primitive lines or text placeholders)."
  ],
  "librarySuitability": {
    "hasEnoughObjects": true,
    "missingObjects": [
      {
        "name": "lowercase component name e.g. 'robot', 'weighingScale'",
        "description": "precise visual description of the missing object in the image",
        "instructions": "conceptual React-Konva instructions on how to code this component"
      }
    ]
  }
}

AVAILABLE SHAPE COMPONENTS in the editor library:
${SHAPE_CATALOGUE}

AVAILABLE RASTERIMAGE CLIPARTS:
${CLIPART_ITEMS.map(c => `- ${c.id}: ${c.label} (Category: ${c.category})`).join('\n')}

Compare the original image against the available shape components and cliparts. Review all component descriptions and characteristics. If the original image contains complex objects (such as a balance scale, a robot, etc.) that cannot be natively drawn using the basic shape components or available cliparts, list them in "librarySuitability" and set "hasEnoughObjects" to false. If all objects can be natively represented, set "hasEnoughObjects" to true and leave "missingObjects" empty.

STRICT LOGICAL RULES FOR ANALYSIS:
1. ONLY describe what you physically see in the diagram. Do not assume or guess based on the question context. If the image has a stick figure and a doorway, describe a stick figure and a doorway. Do NOT invent flowcharts, arrows, or boxes that are not physically present in the image.
2. If there are characters, people, stick figures, animals, or objects (like a portal vortex), look up their names in the AVAILABLE RASTERIMAGE CLIPARTS list. You MUST write down their clipart IDs (e.g. "person" for a stick figure, "portal" for a space portal, "door" for an arch/doorway) and instruct the generator to draw them using "rasterImage".
3. Check the shape registry: if the diagram contains scales, clocks, or departure boards, instruct the generator to use their dedicated component types (e.g., 'weighingScale', 'analogClock') instead of building them out of rectangles and text.
4. GRAPH TYPE IDENTIFICATION — match the image to the EXACT component type:
   - Vertical bars with DISCRETE category labels (e.g. Gold/Silver, Mon/Tue) → "barGraph"
   - Vertical bars touching each other with INTERVAL labels (e.g. 0–5, 5–10) → "histogram"
   - Lines connecting data points over a category or time axis → "lineGraph"
   - Circular sector/pie diagram → "pieChart" (add innerRadius if it's a donut/ring)
   - Dots stacked above a number line → "dotPlot"
   - Two-column stem | leaves display → "stemLeafPlot"
   - Rows of repeated icons (stars/smiley faces etc.) representing counts → "pictograph"
   - Grid of cells with values → "dataTable"
   NEVER describe a bar chart as generic rectangles — always match to the correct graph type.
   For barGraph: extract exact bar labels and numeric values from the image. Include the chart title, x-axis label, and y-axis label in generationInstructions.`;


export async function analyzeQuestionImage({ imageUrl, questionText, userInstructions = '', apiKey, pipelineProvider = 'claude', geminiApiKey = '', model = 'gemini-3.5-flash' }) {
  const systemPrompt = makeAnalyzeSystemPrompt();

  if (pipelineProvider === 'gemini') {
    return analyzeQuestionImageWithGemini({
      imageUrl,
      questionText,
      userInstructions,
      systemPrompt,
      apiKey: geminiApiKey,
      model,
    });
  }

  const messages = [{
    role: 'user',
    content: [
      buildImageContent(imageUrl),
      { type: 'text', text: `Question context: ${questionText || 'No question text provided.'}${userInstructions ? `\n\nUSER CORRECTION FEEDBACK / INSTRUCTIONS (incorporate these changes into your analysis and generation instructions):\n${userInstructions}` : ''}\n\nAnalyse this diagram and return the JSON classification.` },
    ],
  }];

  const text = await callClaude({
    stage: 'analyze', attempt: 0,
    model: 'claude-haiku-4-5-20251001',
    system: systemPrompt,
    messages,
    apiKey, maxTokens: 2048,
  });

  try {
    return JSON.parse(text);
  } catch (e) {
    // Response was truncated — salvage whatever fields are parseable
    const grab = (key) => {
      const m = text.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)`));
      return m ? m[1] : '';
    };
    const partial = {
      diagramType: grab('diagramType') || 'unknown',
      diagramDescription: grab('diagramDescription') || text.slice(0, 400),
      questionContext: grab('questionContext') || '',
      generationInstructions: grab('generationInstructions') || 'Recreate the diagram visible in the image.',
      verificationChecklist: ['Diagram is visible and complete'],
      shapeComponents: ['rectangle', 'text'],
      librarySuitability: { hasEnoughObjects: true, missingObjects: [] }
    };
    await logEvent({ stage: 'analyze', attempt: 0, message: `Analyze JSON truncated — using partial fallback. Error: ${e.message}` });
    return partial;
  }
}


// ── Step 1b: Vision value extraction ──────────────────────────────────────────
// A dedicated, laser-focused pass that reads the image and returns ONLY the
// exact concrete values visible: times, numbers, sequences, labels.
// These become hard-locked constraints injected into every generation prompt.

const EXTRACT_VALUES_PROMPT = `You are a precise data-extraction assistant for mathematics diagrams.

Look at this image and extract EVERY specific value you can see: times, numbers, sequences, labels, text strings.
Return ONLY valid JSON — no markdown, no explanation:
{
  "times": ["list of every time string visible, e.g. \"08:15\", \"09:30 AM\", \"?\""],
  "numbers": ["list of every number visible, e.g. \"42\", \"3.5\", \"1/4\""],
  "labels": ["list of every text label visible, e.g. \"DEPARTURES\", \"Clock A\", \"Height = 8 cm\""],
  "sequences": ["list of any ordered sequences visible, comma-separated, e.g. \"08:15, 08:30, 08:45, ?, 09:15\""],
  "rawLock": "A single instruction string listing ALL values that MUST appear verbatim in the recreated diagram. Example: 'The diagram MUST show exactly these times in this order: 08:15, 08:30, 08:45, ?, 09:15. Do NOT change, reorder, or replace any value.'"
}

Be exhaustive. If no times are visible, return an empty array for times. Same for numbers and labels.
The rawLock string is the most important output — make it unambiguous and actionable.`;

async function extractImageValues({ imageUrl, apiKey, geminiApiKey, pipelineProvider, model }) {
  try {
    const imageContent = buildImageContent(imageUrl);

    if (pipelineProvider === 'gemini' && geminiApiKey) {
      const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
      const vModel = model || 'gemini-3.5-flash';
      const url = `${GEMINI_BASE}/${vModel}:generateContent?key=${geminiApiKey}`;

      // Build multipart content with image + prompt
      let imagePart;
      if (imageUrl.startsWith('data:')) {
        const [header, b64] = imageUrl.split(',');
        const mimeType = header.match(/data:(image\/\w+)/)?.[1] || 'image/jpeg';
        imagePart = { inlineData: { mimeType, data: b64 } };
      } else {
        imagePart = { fileData: { mimeType: 'image/jpeg', fileUri: imageUrl } };
      }

      const body = {
        contents: [{ role: 'user', parts: [imagePart, { text: EXTRACT_VALUES_PROMPT }] }],
        generationConfig: { responseMimeType: 'application/json' },
      };

      const resp = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error(`Gemini value extraction failed: ${resp.status}`);
      const data = await resp.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const cleaned = extractJson(raw);
      return JSON.parse(cleaned);
    }

    // Claude path
    if (!apiKey) return null;
    const resp = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: 'You extract exact values from math diagram images. Return only valid JSON.',
        messages: [{
          role: 'user',
          content: [imageContent, { type: 'text', text: EXTRACT_VALUES_PROMPT }],
        }],
      }),
    });
    if (!resp.ok) throw new Error(`Claude value extraction failed: ${resp.status}`);
    const data = await resp.json();
    const raw = data.content?.[0]?.text || '{}';
    const cleaned = extractJson(raw);
    return JSON.parse(cleaned);
  } catch (e) {
    // Non-fatal — if extraction fails, fall back to question text values
    await logEvent({ stage: 'extract_values', attempt: 0, message: `Value extraction failed (non-fatal): ${e.message}` });
    return null;
  }
}


// ── Step 2: Generate MathsDiagram shapes ─────────────────────────────────────

const GENERATE_SYSTEM = `You are a mathematics diagram generator for primary and middle school (Years 2–8).
Recreate a specific diagram using ONLY the registered component types listed below.

${SHAPE_CATALOGUE}

Respond with ONLY valid JSON — an array of shape objects:
[ { "type": "...", "x": ..., "y": ..., ... }, ... ]

Canvas is an 800×600 coordinate system. X ranges 0–800 (left to right). Y ranges 0–600 (top to bottom).
Keep all shapes within x: 20–780, y: 20–580 so nothing is clipped.
Use concrete coordinates for positions and sizes. 

CRITICAL: If the user feedback provides exact coordinates (e.g., "X: 200", "Y: 150"), you MUST place the objects at those exact coordinates.
Use the grid lines visible in the feedback images to perfectly align shapes.

COMPONENT SELECTION RULES (follow strictly):
- REVIEW ALL available components in the SHAPE_CATALOGUE and the AVAILABLE RASTERIMAGE CLIPARTS list. Decide which component or clipart best fits the objects in the original diagram based on their descriptions and characteristics before generating shapes.
- NEVER draw characters, people, animals, vehicles, fruit, portals, or other illustrative objects using primitive shapes (circles, lines, polygons). You MUST use "rasterImage" with the correct clipart ID (e.g., "person" for stick figures/people, "portal" for space portals, "door" for doorways/arches). Manual drawing of these objects is strictly forbidden and will fail validation.
- Use "departureBoard" for any train/bus departure/arrival timetable showing multiple times.
- Use "digitalClock" for any rectangular LED/LCD clock showing a single time (timeText prop).
- Use "analogClock" for any round clock face with hands (hours, minutes props).
- GRAPH & DATA COMPONENT SELECTION (strict — read all options before choosing):
  • "barGraph"      → vertical bar/column chart with DISCRETE categories (Gold/Silver/Bronze, Mon/Tue/Wed). Always supply bars[].label for category names and bars[].value for heights. Include title, xAxisLabel, yAxisLabel.
  • "histogram"     → continuous frequency chart where bars TOUCH (no gaps). Use for grouped data like "0–5", "5–10". Label bars[].label with interval strings.
  • "lineGraph"     → line/trend chart connected by lines. Use series[].points with {x,y} pairs. Supply xLabels[] for category x-axis (e.g. ["Jan","Feb",…]).
  • "pieChart"      → pie or donut/ring chart. Use slices[].value (raw numbers, auto-converted to %). Set innerRadius>0 for donut.
  • "dotPlot"       → frequency dot plot: supply values[] array (repeated values stack dots). Use for small integer datasets.
  • "stemLeafPlot"  → stem-and-leaf display: supply stems[] as [{stem, leaves:[]}]. Always include keyText.
  • "pictograph"    → icon-based chart: supply rows[] with {label, count}, iconSrc (clipart id e.g. "star"), iconValue (units per icon).
  • "tallyChart"    → table representing categories and tally mark counts (vertical lines crossed by diagonal lines for blocks of 5).
  • "dataTable"     → plain data table (rows, cols) with customized cell string content (pass 2D string array "data" for cells). Use when the original image shows a TABLE of values, not a chart.
  • "tenFrame"      → 1x5 or 2x5 grid filled with circular discs representing numbers. Use for ten-frame/five-frame addition or counting problems.
  • "baseTenBlocks" → place value blocks showing thousands (3D blocks), hundreds (flats), tens (rods), and ones (units) side-by-side.
  • "objectArray"   → grid arrays (multiplication arrays) or scattered groups of identical clipart items/circles representing count sets.
  • "vennDiagram"   → two overlapping circles with labelled regions.
  NEVER manually draw a chart, table, or array using individual rectangles/lines/circles when a dedicated component is available.
- Use "departureBoard" for any train/bus departure/arrival timetable showing multiple times.
- Use "fractionCircle", "fractionRectangle", or "fractionBar" for fraction diagrams.
- Use "numberline" for number lines. Use "cartesianPlane" for coordinate grids.
- Use "rectangle", "circle", "triangle", "text" etc. for basic geometry.
- NEVER use "rasterImage" for diagram structural elements (clocks, boards, graphs, shapes).
  Only use "rasterImage" for illustrative icons (animals, vehicles, food, people) when
  no specific component type covers it — set src to the lowercase clipart ID from the cache list.
- If the diagram requires a component type not in this list, output it anyway with a comment
  field: { "type": "MISSING_TYPE_NAME", "comment": "brief description of what this should be" }
  The system will detect it and notify the developer to add it to the library.

IMPORTANT — VALUES FIDELITY (CRITICAL):
- Use EXACT times, numbers, labels from the question context — never invent or round them.
- Changing values makes the question's answer WRONG.

Do NOT include any explanation, markdown, or text outside the JSON array.`;

// ── Post-generation: detect types not in the component registry ───────────────

const KNOWN_TYPES = new Set([
  'rasterImage','rectangle','circle','triangle','polygon','customPolygon','line',
  'rightTriangle','isoscelesTriangle','equilateralTriangle','fractionCircle',
  'fractionRectangle','fractionBar','numberline','cartesianPlane',
  'barGraph','lineGraph','pieChart','histogram','dotPlot','stemLeafPlot','pictograph',
  'tallyChart','tenFrame','baseTenBlocks','objectArray',
  'vennDiagram','annulus','bearings','spinner','factorTree','angleMarker','point',
  'rightAngleMarker','lengthMarker','ruler','text','road','roadJunction','bridge',
  'tree','river','lake','sea','mountain','footpath','playground','airport','port',
  'mapMarker','mapSprite','gridMap','scaleBar','compassRose','sunDirection','flag',
  'dataTable','coordAxes','spiderIcon','dottedLineArrow','elbowArrow','bezierArrow',
  'robot','weighingScale','analogClock','digitalClock','departureBoard',
]);

function validateShapeTypes(shapes) {
  const missing = [];
  const valid = shapes.filter(s => {
    if (KNOWN_TYPES.has(s.type)) return true;
    missing.push({ type: s.type, comment: s.comment || '' });
    return false;
  });
  return { valid, missing };
}

export async function generateRepairShapes({ analysis, feedbackHistory, userInstructions, apiKey, attempt, pipelineProvider = 'claude', geminiApiKey = '', model = 'gemini-3.5-flash', questionValues = null }) {
  let prompt = `Diagram type: ${analysis.diagramType}\nDescription: ${analysis.diagramDescription}\n\nInstructions:\n${analysis.generationInstructions}`;

  // Inject hard-coded question values as a non-negotiable constraint
  if (questionValues) {
    prompt = `CRITICAL — EXACT VALUES FROM THE QUESTION (you MUST use these exact values in the diagram, do NOT change any of them):\n${questionValues}\n\n` + prompt;
  } else if (analysis.questionContext) {
    prompt = `QUESTION CONTEXT (extract and use all exact numerical values, times, and labels from this):\n${analysis.questionContext}\n\n` + prompt;
  }

  if (userInstructions?.trim()) {
    prompt += `\n\nADDITIONAL USER INSTRUCTIONS (apply these precisely):\n${userInstructions.trim()}`;
  }

  if (feedbackHistory?.length > 0) {
    prompt += `\n\nPREVIOUS ATTEMPT FAILURES — do NOT repeat these mistakes:\n`;
    feedbackHistory.forEach((fb, i) => {
      prompt += `Attempt ${i + 1}: ${fb}\n`;
    });
    prompt += `\nRedraw from scratch. Fix ALL issues listed above. Each shape must be fully within the canvas bounds (x: 20–780, y: 20–580). Pay close attention to any coordinate grid positions visible in the feedback image.`;
  }

  let rawShapes;
  if (pipelineProvider === 'gemini') {
    const clipartNames = CLIPART_ITEMS.map(c => `- ${c.id}: ${c.label} (Category: ${c.category})`).join('\n');
    const fullSystemInstruction = GENERATE_SYSTEM + '\n\nAVAILABLE RASTERIMAGE CLIPARTS:\n' + clipartNames;
    const cacheName = await getOrCreateShapeCache(geminiApiKey, fullSystemInstruction, `models/${model}`);

    rawShapes = await generateRepairShapesWithGemini({
      prompt,
      systemPrompt: fullSystemInstruction,
      apiKey: geminiApiKey,
      model,
      cachedContentName: cacheName,
      attempt,
    });
  } else {
    const text = await callClaude({
      stage: 'generate', attempt,
      model: 'claude-sonnet-4-6',
      system: GENERATE_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
      apiKey, maxTokens: 4096,
    });
    rawShapes = JSON.parse(text);
  }

  if (!Array.isArray(rawShapes)) throw new Error('Generator returned non-array JSON');

  const { valid, missing } = validateShapeTypes(rawShapes);
  // Attach missing list to the array so callers can surface it to the UI
  valid.__missingComponents = missing;
  return valid;
}


// ── Step 2b: Refine image-generation prompt (Gemini path only) ───────────────

const REFINE_SYSTEM = `You are an expert at writing precise image-generation prompts for mathematics diagrams.

You will receive:
- The original diagram analysis (type, description, pixel-level instructions)
- Any user instructions requesting changes
- Previous attempt failures (if any)

Your job: produce a single, refined image-generation prompt that an image AI will use to draw the diagram.

STRICT RULES for the prompt you write:
1. Describe ONLY the diagram elements — grid lines, shapes, letters placed on cells, arrows, directional key labels (N↑ S↓ E→ W←). Nothing else.
2. NEVER mention difficulty levels, question text, hints, challenge tasks, answer keys, or any prose that should appear in the image.
3. Be exhaustive about spatial layout. Translate any 800x600 coordinates from the user feedback into exact relative positioning instructions for the image AI.
4. Incorporate any user instructions as diagram-level changes only (e.g. "make harder" → reposition labels, don't add text to the image).
5. Incorporate all previous failure feedback so those mistakes are not repeated.

Return ONLY the refined prompt text — no JSON, no preamble, no explanation.`;

export async function refineImagePrompt(analysis, userInstructions, feedbackHistory, apiKey) {
  let userMsg = `DIAGRAM TYPE: ${analysis.diagramType}\n\nDESCRIPTION:\n${analysis.diagramDescription}\n\nPIXEL-LEVEL INSTRUCTIONS:\n${analysis.imagePrompt || analysis.generationInstructions || ''}`;

  if (userInstructions?.trim()) {
    userMsg += `\n\nUSER INSTRUCTIONS (apply as diagram-level changes only):\n${userInstructions.trim()}`;
  }

  if (feedbackHistory?.length > 0) {
    userMsg += `\n\nPREVIOUS ATTEMPT FAILURES — these must be fixed:\n`;
    feedbackHistory.forEach((fb, i) => { userMsg += `Attempt ${i + 1}: ${fb}\n`; });
  }

  const text = await callClaude({
    stage: 'refine_prompt', attempt: feedbackHistory?.length ?? 0,
    model: 'claude-haiku-4-5-20251001',
    system: REFINE_SYSTEM,
    messages: [{ role: 'user', content: userMsg }],
    apiKey, maxTokens: 1024,
  });

  // callClaude runs extractJson on the response — but we want raw text here
  // Re-fetch the raw text: callClaude returns extractJson output, which is fine
  // for prose (no JSON brackets), so just use it directly.
  return text.trim();
}

// ── Step 3: Validate rendered diagram ────────────────────────────────────────

const VALIDATE_SYSTEM = `You are a mathematics diagram QA validator. Your ONLY job is to check what is physically drawn in the image.

Rules:
- Check ONLY what is visually present: shape counts, colours, shading counts, labels, layout.
- Do NOT apply mathematical reasoning. Do NOT decide if fractions are correct or wrong.
- Each checklist item describes what MUST be physically visible. Check each one literally.
- A shape with 3 out of 4 sections shaded blue passes "3 blue sections shaded" — do not override this with your own fraction analysis.
- If the image is blank or has no visible content, set isCorrect to false immediately.
- CRITICAL OBJECT USAGE RULE: Check if the diagram contains real-world objects (animals, food, vehicles) or complex domain elements (clocks, fraction circles, scales). If they look like messy, disjointed primitive drawings made of overlapping lines, or if they are just plain text placeholders instead of actual graphics, mark isCorrect to false. Provide explicit feedback telling the generator to use 'rasterImage' clip arts or the dedicated component types instead of raw vector lines.

Return ONLY valid JSON (no markdown):
{
  "isCorrect": true | false,
  "feedback": "if incorrect: for each failing item, state exactly what you see vs what the checklist requires, and how to fix it",
  "score": 0-100
}`;

export async function validateRenderedDiagram(screenshotBase64, analysis, apiKey, attempt) {
  // Strip answer-key markers (✓ ✗) so the validator focuses on visual checks only
  const checklist = (analysis.verificationChecklist || [])
    .map(item => item.replace(/[✓✗☑☒]/g, '').replace(/\b(true|false|correct|incorrect|not 3\/4|= 3\/4)\b/gi, '').trim())
    .filter(item => item.length > 10 && !item.startsWith('e.g.') && !item.startsWith('VISUAL') && !item.startsWith('Format') && !item.startsWith('Each item'))
    .join('\n- ');
  const messages = [{
    role: 'user',
    content: [
      buildImageContent(screenshotBase64),
      {
        type: 'text',
        text: `Diagram type: ${analysis.diagramType}\nDescription: ${analysis.diagramDescription}\n\nVerification checklist:\n- ${checklist}\n\nCheck the rendered image and return JSON.`,
      },
    ],
  }];

  const text = await callClaude({
    stage: 'validate', attempt,
    model: 'claude-haiku-4-5-20251001',
    system: VALIDATE_SYSTEM,
    messages,
    apiKey, maxTokens: 512,
  });
  return JSON.parse(text);
}

// ── Value extraction helper ───────────────────────────────────────────────────

/**
 * Builds a concise block of exact values extracted from the question data
 * that the AI must reproduce verbatim in the diagram.
 */
function buildQuestionValuesBlock(questionData) {
  const lines = [];

  // Question text
  if (questionData.text) {
    lines.push(`Question text: "${questionData.text}"`);
  }

  // Explanation
  if (questionData.explanation) {
    lines.push(`Explanation: "${questionData.explanation}"`);
  }

  // Correct answer
  const ca = questionData.correctAnswer || questionData.answer;
  if (ca) {
    const caText = typeof ca === 'string' ? ca : (ca.text || JSON.stringify(ca));
    lines.push(`Correct answer: ${caText}`);
  }

  // Distractors / options
  const opts = questionData.distractors || questionData.options || questionData.choices;
  if (Array.isArray(opts) && opts.length > 0) {
    const optTexts = opts.map(o => typeof o === 'string' ? o : (o.text || JSON.stringify(o)));
    lines.push(`Wrong options: ${optTexts.join(' | ')}`);
  }

  return lines.join('\n');
}

// ── Question text re-generation ───────────────────────────────────────────────

const REGEN_QUESTION_SYSTEM = `You are a mathematics question writer for primary and middle school (Years 2–8).

A diagram has been drawn with SPECIFIC VALUES that may differ from the original question text.
Your job: rewrite the question stem, correct answer, and distractors so they match the diagram values EXACTLY.

Rules:
- Keep the same question type and mathematical concept.
- Use ONLY the values visible in the new diagram description — do not use any values from the original question.
- The correct answer must be mathematically correct given the new diagram values.
- The 3 distractors must be plausible but wrong (common student errors).
- Return ONLY valid JSON:
{ "question": "...", "correctAnswer": "...", "distractors": ["...", "...", "..."] }
No markdown, no explanation.`;

/**
 * Re-generates question text / correct answer / distractors to match
 * the values actually present in the newly drawn diagram.
 *
 * @param {string} diagramDescription - Human-readable description of what the diagram now shows
 * @param {object} originalQuestion   - { text, correctAnswer, distractors }
 * @param {string} apiKey             - Claude API key
 * @param {string} geminiApiKey       - Gemini API key (optional fallback)
 * @returns {{ question, correctAnswer, distractors }}
 */
export async function regenerateQuestionText({ diagramDescription, originalQuestion, apiKey, geminiApiKey = '' }) {
  const userMsg = `Original question: "${originalQuestion.text || ''}"
Original correct answer: ${typeof originalQuestion.correctAnswer === 'string' ? originalQuestion.correctAnswer : (originalQuestion.correctAnswer?.text || '')}

NEW DIAGRAM VALUES (rewrite the question to match these exactly):
${diagramDescription}

Rewrite the question, correct answer, and 3 distractors to match the NEW diagram values above.`;

  // Try Claude first
  if (apiKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: REGEN_QUESTION_SYSTEM,
          messages: [{ role: 'user', content: userMsg }],
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text || '';
        const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        return JSON.parse(cleaned);
      }
    } catch { /* fall through to Gemini */ }
  }

  // Fallback: Gemini
  if (geminiApiKey) {
    const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
    const model = 'gemini-3.5-flash';
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${geminiApiKey}`;
    const body = {
      contents: [{ role: 'user', parts: [{ text: REGEN_QUESTION_SYSTEM + '\n\n' + userMsg }] }],
      generationConfig: { responseMimeType: 'application/json' },
    };
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(cleaned);
    }
  }

  throw new Error('No API key available for question text regeneration.');
}

// ── Main repair pipeline ──────────────────────────────────────────────────────

/**
 * @param {object}   questionData        - { id, text, image, options, … }
 * @param {string}   imageUrl            - Resolved image URL or base64 data URL
 * @param {string}   userInstructions    - Optional free-text hints from the user
 * @param {string}   apiKey              - Claude API key
 * @param {string}   geminiApiKey        - Gemini API key (for Gemini modes)
 * @param {string}   generationMode      - 'konva' | 'gemini'
 * @param {string}   validationMode      - 'claude' | 'gemini'
 * @param {string}   geminiImageModel    - Gemini image model ID
 * @param {string}   geminiVisionModel   - Gemini vision model ID
 * @param {function} onProgress          - Called with progress state objects
 * @param {function} renderAndCapture    - async (shapes) → screenshotBase64  (konva mode only)
 * @param {number}   maxRetries          - Default 5
 */
export async function repairDiagramWithRetry({
  questionData,
  imageUrl,
  userInstructions = '',
  apiKey,
  geminiApiKey = '',
  generationMode = 'konva',
  validationMode = 'claude',
  geminiImageModel,
  geminiVisionModel,
  onProgress,
  renderAndCapture,
  maxRetries = 5,
  pipelineProvider = 'gemini',
}) {
  clearSessionLog();

  const isGeminiGen = generationMode === 'gemini';
  const isGeminiVal = validationMode === 'gemini' || pipelineProvider === 'gemini';

  await logEvent({ stage: 'start', message: 'Repair pipeline started', data: { questionId: questionData.id, generationMode, validationMode, maxRetries, pipelineProvider } });

  // Step 1: Analyze with chosen provider
  onProgress({ stage: 'analyzing', attempt: 0, maxAttempts: maxRetries, pipelineProvider, geminiVisionModel });
  const analysis = await analyzeQuestionImage({
    imageUrl,
    questionText: questionData.text,
    userInstructions,
    apiKey,
    pipelineProvider,
    geminiApiKey,
    model: geminiVisionModel || 'gemini-3.5-flash',
  });
  await logEvent({ stage: 'analyzed', message: 'Image analysis complete', data: analysis });
  onProgress({ stage: 'analyzed', analysis, attempt: 0, maxAttempts: maxRetries, pipelineProvider, geminiVisionModel });

  // Step 1b: Vision OCR — extract the exact values visible in the image
  // This is the primary source of truth; question text is used as a fallback supplement.
  onProgress({ stage: 'extracting_values', attempt: 0, maxAttempts: maxRetries, pipelineProvider, geminiVisionModel });
  const imageExtracted = await extractImageValues({
    imageUrl,
    apiKey,
    geminiApiKey,
    pipelineProvider,
    model: geminiVisionModel || 'gemini-3.5-flash',
  });
  await logEvent({ stage: 'image_values_extracted', message: 'Image OCR complete', data: imageExtracted });

  // Build constraint block: vision-extracted values + question text values
  const questionValuesFromText = buildQuestionValuesBlock(questionData);
  const visionValuesBlock = imageExtracted?.rawLock
    ? `VISION-EXTRACTED VALUES (read directly from the image — highest priority):\n${imageExtracted.rawLock}\n\nTimes visible: ${(imageExtracted.times || []).join(', ') || '(none)'}\nNumbers visible: ${(imageExtracted.numbers || []).join(', ') || '(none)'}\nLabels visible: ${(imageExtracted.labels || []).join(', ') || '(none)'}\nSequences: ${(imageExtracted.sequences || []).join(' | ') || '(none)'}`
    : '';
  const questionValues = [visionValuesBlock, questionValuesFromText].filter(Boolean).join('\n\n');
  await logEvent({ stage: 'values_combined', message: 'Combined values block ready', data: { questionValues } });


  let feedbackHistory = [];
  let lastShapes = null;
  let lastImage = null;
  let lastValidation = null;
  let prevImageBase64 = null;
  let allMissingComponents = []; // accumulate across attempts

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await logEvent({ stage: 'attempt_start', attempt, maxAttempts: maxRetries, message: `Starting attempt ${attempt}` });

    try {
      let screenshot;

      if (isGeminiGen) {
        // ── Gemini image generation path ────────────────────────────────────

        // Refine the image prompt using Claude before sending to Gemini
        onProgress({ stage: 'refining_prompt', attempt, maxAttempts: maxRetries, analysis, mode: 'gemini' });
        await logEvent({ stage: 'refining_prompt', attempt, message: 'Refining image prompt with Claude...' });
        const prompt = await refineImagePrompt(analysis, userInstructions, feedbackHistory, apiKey);
        await logEvent({ stage: 'prompt_refined', attempt, message: 'Image prompt refined', data: { prompt } });

        onProgress({ stage: 'generating', attempt, maxAttempts: maxRetries, analysis, mode: 'gemini', pipelineProvider, geminiVisionModel });

        const imageDataUri = await generateGeminiImage({
          prompt,
          referenceImageBase64: prevImageBase64,
          feedbackHistory,
          model: geminiImageModel,
          apiKey: geminiApiKey,
        });

        lastImage = imageDataUri;
        prevImageBase64 = imageDataUri;
        screenshot = imageDataUri;

        await logEvent({ stage: 'generated', attempt, message: 'Gemini image generated' });
        onProgress({ stage: 'generated', attempt, maxAttempts: maxRetries, image: imageDataUri, analysis });
        onProgress({ stage: 'rendering', attempt, maxAttempts: maxRetries });
        await logEvent({ stage: 'rendered', attempt, message: 'Gemini image ready (no Konva render needed)' });

      } else {
        // ── Konva shape generation path ──────────────────────────────────────
        onProgress({ stage: 'generating', attempt, maxAttempts: maxRetries, analysis, mode: 'konva', pipelineProvider, geminiVisionModel });
        const shapes = await generateRepairShapes({
          analysis,
          feedbackHistory,
          userInstructions,
          apiKey,
          attempt,
          pipelineProvider,
          geminiApiKey,
          model: geminiVisionModel || 'gemini-3.5-flash',
          questionValues,
        });
        const missingComponents = shapes.__missingComponents || [];
        if (missingComponents.length) allMissingComponents.push(...missingComponents);
        lastShapes = shapes;
        await logEvent({ stage: 'generated', attempt, message: `${shapes.length} shapes generated`, data: { shapeTypes: shapes.map(s => s.type), missingComponents } });
        if (missingComponents.length > 0) {
          onProgress({ stage: 'missing_components', attempt, maxAttempts: maxRetries, missingComponents, pipelineProvider });
        }
        onProgress({ stage: 'generated', attempt, maxAttempts: maxRetries, shapes, analysis, missingComponents, pipelineProvider, geminiVisionModel });


        onProgress({ stage: 'rendering', attempt, maxAttempts: maxRetries, shapes });
        screenshot = await renderAndCapture(shapes);
        await logEvent({ stage: 'rendered', attempt, message: 'Canvas rendered and screenshot captured' });
      }

      // ── Validation ───────────────────────────────────────────────────────
      onProgress({ stage: 'validating', attempt, maxAttempts: maxRetries });
      let validation;

      if (isGeminiVal) {
        validation = await validateWithGemini({
          imageBase64: screenshot,
          analysis,
          feedbackHistory,
          model: geminiVisionModel,
          apiKey: geminiApiKey,
          attempt,
        });
        await logEvent({ stage: 'validated', attempt, message: `Gemini validation: ${validation.isCorrect ? 'PASS' : 'FAIL'}`, data: validation });
      } else {
        validation = await validateRenderedDiagram(screenshot, analysis, apiKey, attempt);
        await logEvent({ stage: 'validated', attempt, message: `Claude validation: ${validation.isCorrect ? 'PASS' : 'FAIL'}`, data: validation });
      }

      lastValidation = validation;
      onProgress({ stage: 'validated', attempt, maxAttempts: maxRetries, shapes: lastShapes, image: lastImage, validation });

      if (validation.isCorrect) {
        await logEvent({ stage: 'success', attempt, message: 'Pipeline succeeded' });
        return { shapes: lastShapes, image: lastImage, analysis, attempts: attempt, success: true, validation, generationMode, missingComponents: allMissingComponents };
      }

      feedbackHistory.push(validation.feedback);
      onProgress({ stage: 'retry', attempt, maxAttempts: maxRetries, feedback: validation.feedback, validation });

    } catch (attemptErr) {
      const msg = attemptErr.message || String(attemptErr);
      await logEvent({ stage: 'attempt_error', attempt, message: `Attempt ${attempt} threw: ${msg}` });
      onProgress({ stage: 'attempt_error', attempt, maxAttempts: maxRetries, message: msg });
      feedbackHistory.push(`Attempt failed with error: ${msg}. Try a simpler approach.`);
    }
  }

  await logEvent({ stage: 'exhausted', message: `All ${maxRetries} attempts failed`, data: lastValidation });
  return { shapes: lastShapes, image: lastImage, analysis, attempts: maxRetries, success: false, validation: lastValidation, generationMode, missingComponents: allMissingComponents };
}
