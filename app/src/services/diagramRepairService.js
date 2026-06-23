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

import { SHAPE_CATALOGUE } from './claudeService.js';
import { logModelCall, logEvent, clearSessionLog } from './pipelineLogger.js';
import { generateGeminiImage, validateWithGemini } from './geminiService.js';

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

const ANALYZE_SYSTEM = `You are a mathematics diagram analyst for primary and middle school questions.
Analyse the image carefully and return ONLY valid JSON (no markdown, no preamble):
{
  "diagramType": "short name e.g. 'bar graph', 'number line', 'fraction comparison grid'",
  "shapeComponents": ["list of visible shape types: rectangle, circle, line, text, etc."],
  "diagramDescription": "precise description of every element — positions, labels, colours, how many parts each shape is divided into and how many are shaded",
  "questionContext": "what the question is asking",
  "generationInstructions": "Step-by-step Konva-shape instructions for recreating this diagram. Include ALL shapes, exact division counts, shading counts, colours, and labels.",
  "imagePrompt": "Detailed pixel-level instructions for an image AI to draw this diagram from scratch on a white background with black outlines. Describe the exact layout, each shape's position, size, colour, how many sections it is divided into, exactly which sections are shaded and which are white, and any text labels. Be exhaustive and unambiguous — e.g. 'Top row, second shape: a circle divided into 4 equal quarters by two perpendicular lines. The top-left, top-right and bottom-left quarters are shaded blue. The bottom-right quarter is white.'",
  "verificationChecklist": [
    "VISUAL checks only — describe exactly what must be physically visible in a correct rendering. No maths, no fraction answers, no ✓ or ✗.",
    "Format every item as a factual statement about pixels/colours/counts, e.g.:",
    "'6 distinct shapes arranged in 2 rows of 3, evenly spaced'",
    "'Shape 1 (top-left): a 2×2 grid of 4 equal squares; exactly 3 squares filled green, 1 square white'",
    "'Shape 2 (top-center): a circle split into exactly 4 equal sectors by two perpendicular diameters; exactly 3 sectors filled blue, 1 sector white'",
    "'Shape 4 (bottom-left): a regular hexagon split into 6 triangles from the center; exactly 3 alternate triangles filled pink, 3 white'",
    "Each item must be independently verifiable by looking at the image — no logic, no fractions as answers."
  ]
}`;

export async function analyzeQuestionImage(imageUrl, questionText, apiKey) {
  const messages = [{
    role: 'user',
    content: [
      buildImageContent(imageUrl),
      { type: 'text', text: `Question context: ${questionText || 'No question text provided.'}\n\nAnalyse this diagram and return the JSON classification.` },
    ],
  }];

  const text = await callClaude({
    stage: 'analyze', attempt: 0,
    model: 'claude-haiku-4-5-20251001',
    system: ANALYZE_SYSTEM,
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
    };
    await logEvent({ stage: 'analyze', attempt: 0, message: `Analyze JSON truncated — using partial fallback. Error: ${e.message}` });
    return partial;
  }
}

// ── Step 2: Generate MathsDiagram shapes ─────────────────────────────────────

const GENERATE_SYSTEM = `You are a mathematics diagram generator for primary and middle school (Years 2–8).
Recreate a specific diagram using ONLY the available shape types below.

${SHAPE_CATALOGUE}

Respond with ONLY valid JSON — an array of shape objects:
[ { "type": "...", "x": ..., "y": ..., ... }, ... ]

Canvas is 800×500 logical pixels. Centre is x=400, y=250.
Keep all shapes within x: 20–780, y: 20–480 so nothing is clipped.
Use concrete positions and sizes. Include text labels where needed.
Do NOT include any explanation, markdown, or text outside the JSON array.`;

export async function generateRepairShapes(analysis, feedbackHistory, userInstructions, apiKey, attempt) {
  let prompt = `Diagram type: ${analysis.diagramType}\nDescription: ${analysis.diagramDescription}\n\nInstructions:\n${analysis.generationInstructions}`;

  if (userInstructions?.trim()) {
    prompt += `\n\nADDITIONAL USER INSTRUCTIONS (apply these precisely):\n${userInstructions.trim()}`;
  }

  if (feedbackHistory?.length > 0) {
    prompt += `\n\nPREVIOUS ATTEMPT FAILURES — do NOT repeat these mistakes:\n`;
    feedbackHistory.forEach((fb, i) => {
      prompt += `Attempt ${i + 1}: ${fb}\n`;
    });
    prompt += `\nRedraw from scratch. Fix ALL issues listed above. Each shape must be fully within the canvas bounds (x: 20–780, y: 20–480).`;
  }

  const text = await callClaude({
    stage: 'generate', attempt,
    model: 'claude-sonnet-4-6',
    system: GENERATE_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
    apiKey, maxTokens: 4096,
  });

  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error('Generator returned non-array JSON');
  return parsed;
}

// ── Step 3: Validate rendered diagram ────────────────────────────────────────

const VALIDATE_SYSTEM = `You are a mathematics diagram QA validator. Your ONLY job is to check what is physically drawn in the image.

Rules:
- Check ONLY what is visually present: shape counts, colours, shading counts, labels, layout.
- Do NOT apply mathematical reasoning. Do NOT decide if fractions are correct or wrong.
- Each checklist item describes what MUST be physically visible. Check each one literally.
- A shape with 3 out of 4 sections shaded blue passes "3 blue sections shaded" — do not override this with your own fraction analysis.
- If the image is blank or has no visible content, set isCorrect to false immediately.

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
}) {
  clearSessionLog();

  const isGeminiGen = generationMode === 'gemini';
  const isGeminiVal = validationMode === 'gemini';

  await logEvent({ stage: 'start', message: 'Repair pipeline started', data: { questionId: questionData.id, generationMode, validationMode, maxRetries } });

  // Step 1: Analyze with Claude Haiku (always — gives us structured description for both pipelines)
  onProgress({ stage: 'analyzing', attempt: 0, maxAttempts: maxRetries });
  const analysis = await analyzeQuestionImage(imageUrl, questionData.text, apiKey);
  await logEvent({ stage: 'analyzed', message: 'Image analysis complete', data: analysis });
  onProgress({ stage: 'analyzed', analysis, attempt: 0, maxAttempts: maxRetries });

  let feedbackHistory = [];
  let lastShapes = null;
  let lastImage = null;   // base64 data URI — used in gemini gen mode
  let lastValidation = null;
  let prevImageBase64 = null; // reference image for iterative Gemini regeneration

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await logEvent({ stage: 'attempt_start', attempt, maxAttempts: maxRetries, message: `Starting attempt ${attempt}` });

    try {
      let screenshot;

      if (isGeminiGen) {
        // ── Gemini image generation path ────────────────────────────────────
        onProgress({ stage: 'generating', attempt, maxAttempts: maxRetries, analysis, mode: 'gemini' });

        // Prefer the dedicated imagePrompt (pixel-level instructions) over Konva-style generationInstructions
        let prompt = analysis.imagePrompt || analysis.generationInstructions || analysis.diagramDescription;
        if (userInstructions?.trim()) prompt += `\n\nAdditional instructions: ${userInstructions.trim()}`;

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
        onProgress({ stage: 'generating', attempt, maxAttempts: maxRetries, analysis, mode: 'konva' });
        const shapes = await generateRepairShapes(analysis, feedbackHistory, userInstructions, apiKey, attempt);
        lastShapes = shapes;
        await logEvent({ stage: 'generated', attempt, message: `${shapes.length} shapes generated`, data: { shapeTypes: shapes.map(s => s.type) } });
        onProgress({ stage: 'generated', attempt, maxAttempts: maxRetries, shapes, analysis });

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
        return { shapes: lastShapes, image: lastImage, analysis, attempts: attempt, success: true, validation, generationMode };
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
  return { shapes: lastShapes, image: lastImage, analysis, attempts: maxRetries, success: false, validation: lastValidation, generationMode };
}
