/**
 * Gemini image generation and vision validation service.
 * Uses direct REST API (browser-compatible, no SDK required).
 *
 * Image generation: gemini-2.0-flash-preview-image-generation
 * Vision validation: gemini-2.0-flash (multimodal)
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const GEMINI_IMAGE_MODELS = [
  { id: 'gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash Image' },
  { id: 'gemini-3-pro-image-preview',     label: 'Gemini 3 Pro Image' },
];

export const GEMINI_VISION_MODELS = [
  { id: 'gemini-3.5-flash',         label: 'Gemini 3.5 Flash' },
  { id: 'gemini-3-flash-preview',   label: 'Gemini 3 Flash' },
  { id: 'gemini-2.0-flash',         label: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-flash',         label: 'Gemini 1.5 Flash' },
];

export function getGeminiApiKey() {
  return localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
}
export function saveGeminiApiKey(k) { localStorage.setItem('gemini_api_key', k); }

import { logModelCall } from './pipelineLogger.js';

let cachedContentMap = {};

/**
 * Creates or retrieves an active explicit context cache for a given system instruction.
 * @returns {Promise<string>} The cachedContent resource name (e.g. 'cachedContents/xyz123')
 */
export async function getOrCreateShapeCache(apiKey, systemInstruction, modelName = 'models/gemini-3.5-flash') {
  // Use a hash of the instruction to support multiple distinct caches if needed
  const cacheKey = modelName;
  const current = cachedContentMap[cacheKey];
  
  if (current && Date.now() < current.expiry) {
    return current.name;
  }
  
  const url = `https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${apiKey}`;
  const body = {
    model: modelName,
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    ttl: "3600s"
  };
  
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!resp.ok) {
      console.warn('Failed to create cache, falling back to uncached', await resp.text());
      return null;
    }
    
    const data = await resp.json();
    cachedContentMap[cacheKey] = {
      name: data.name,
      expiry: Date.now() + (55 * 60 * 1000) // 55 mins to be safe
    };
    return data.name;
  } catch (e) {
    console.warn('Error creating explicit cache:', e);
    return null;
  }
}


// ── Image generation ──────────────────────────────────────────────────────────

/**
 * Generate a math diagram image via Gemini.
 * @returns {string} base64 PNG data URI
 */
export async function generateGeminiImage({ prompt, referenceImageBase64 = null, feedbackHistory = [], model = GEMINI_IMAGE_MODELS[0].id, apiKey }) {
  const preamble =
    'A clear mathematics workbook diagram. Pure white background, clean black lines, strict 2D, all labels legible. ' +
    'CRITICAL RULES — strictly enforce: ' +
    '(1) Include ONLY the diagram itself — the grid, shapes, letters, arrows, and directional labels that are part of the diagram. ' +
    '(2) DO NOT add any title, difficulty label, question text, hints, challenge questions, answer keys, footnotes, or any explanatory text whatsoever. ' +
    '(3) The image must contain zero sentences or instructional prose — only diagram elements (shapes, grid lines, short single-word or single-letter labels). ';

  const parts = [];

  // Lead with failure history so the model pays attention to it first
  let textPrompt = preamble;
  if (feedbackHistory.length > 0) {
    textPrompt += '\n\nPREVIOUS ATTEMPT FAILURES — do NOT repeat these mistakes:\n';
    feedbackHistory.forEach((fb, i) => { textPrompt += `Attempt ${i + 1}: ${fb}\n`; });
    textPrompt += '\nFix ALL issues listed above.\n\n';
  }
  if (referenceImageBase64) {
    textPrompt += '⚠ THE ATTACHED IMAGE IS THE PREVIOUS FAILED ATTEMPT — study it only to understand mistakes, do NOT copy it.\n\n';
  }
  textPrompt += prompt;

  parts.push({ text: textPrompt });

  // Attach reference image if we have one (iterative regeneration)
  if (referenceImageBase64) {
    const b64 = referenceImageBase64.startsWith('data:')
      ? referenceImageBase64.split(',')[1]
      : referenceImageBase64;
    parts.push({ inlineData: { mimeType: 'image/png', data: b64 } });
  }

  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: { responseModalities: ['IMAGE'] },
  };

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini image API error: ${resp.status}`);
    }

    const data = await resp.json();
    const parts2 = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts2.find(p => p.inlineData?.data);
    if (!imagePart) {
      const textOut = parts2.find(p => p.text)?.text || 'No image returned';
      throw new Error(`Gemini returned no image. Response: ${textOut.slice(0, 200)}`);
    }

    const finalImageUri = `data:image/png;base64,${imagePart.inlineData.data}`;
    await logModelCall({
      stage: 'generate_image',
      attempt: 0,
      model,
      systemPrompt: preamble,
      userMessages: [{ role: 'user', parts: [{ text: textPrompt }] }],
      responseText: '[Base64 PNG Image Generated]',
      parsedResult: { image: '[IMAGE DATA]' },
      durationMs: Date.now() - t0,
    });
    return finalImageUri;
  } catch (e) {
    await logModelCall({
      stage: 'generate_image',
      attempt: 0,
      model,
      systemPrompt: preamble,
      userMessages: [{ role: 'user', parts: [{ text: textPrompt }] }],
      responseText: '',
      parsedResult: null,
      durationMs: Date.now() - t0,
      error: e.message,
    });
    throw e;
  }
}

// ── Vision validation ─────────────────────────────────────────────────────────

/**
 * Validate a generated diagram image via Gemini vision.
 * @returns {{ isCorrect: boolean, feedback: string, score: number }}
 */
export async function validateWithGemini({ imageBase64, analysis, feedbackHistory = [], model = GEMINI_VISION_MODELS[0].id, apiKey, attempt = 0 }) {
  const t0 = Date.now();
  const checklist = (analysis.verificationChecklist || [])
    .map(item => item.replace(/[✓✗☑☒]/g, '').replace(/\b(true|false|correct|incorrect|not 3\/4|= 3\/4)\b/gi, '').trim())
    .filter(item => item.length > 10 && !item.startsWith('e.g.') && !item.startsWith('VISUAL') && !item.startsWith('Format') && !item.startsWith('Each item'))
    .join('\n- ');
  const b64 = imageBase64.startsWith('data:') ? imageBase64.split(',')[1] : imageBase64;

  const prompt = `You are a mathematics diagram QA validator for primary and middle school workbooks.

Diagram type: ${analysis.diagramType}
Description: ${analysis.diagramDescription}

Verification checklist (VISUAL checks only):
- ${checklist}
${feedbackHistory.length > 0 ? `\nPrevious failure notes (use as context):\n${feedbackHistory.map((f, i) => `Attempt ${i + 1}: ${f}`).join('\n')}` : ''}

Look at the attached image carefully. Check ONLY what is physically visible.
Respond with ONLY valid JSON — no markdown, no preamble:
{
  "isCorrect": true or false,
  "feedback": "if incorrect: concise plain-text description of what is wrong and exactly how to fix it. If correct: empty string.",
  "score": 0-100
}`;

  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        { inlineData: { mimeType: 'image/png', data: b64 } },
      ],
    }],
    generationConfig: { temperature: 0.1 },
  };

  let text = '';
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini vision API error: ${resp.status}`);
    }

    const data = await resp.json();
    text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Strip markdown fences if present
    let cleaned = text;
    const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenced) cleaned = fenced[1];
    const objStart = cleaned.indexOf('{');
    if (objStart > 0) cleaned = cleaned.slice(objStart);

    const parsed = JSON.parse(cleaned);
    await logModelCall({
      stage: 'validate',
      attempt,
      model,
      systemPrompt: 'Mathematics diagram QA validation rules',
      userMessages: [{ role: 'user', parts: [{ text: prompt }, { text: '[Screenshot attached]' }] }],
      responseText: text,
      parsedResult: parsed,
      durationMs: Date.now() - t0,
    });

    return parsed;
  } catch (e) {
    await logModelCall({
      stage: 'validate',
      attempt,
      model,
      systemPrompt: 'Mathematics diagram QA validation rules',
      userMessages: [{ role: 'user', parts: [{ text: prompt }] }],
      responseText: text,
      parsedResult: null,
      durationMs: Date.now() - t0,
      error: e.message,
    });
    throw e;
  }
}

// ── Generic REST caller for Gemini ──────────────────────────────────────────

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

export async function callGemini({ systemInstruction, contents, model = 'gemini-3.5-flash', apiKey, responseMimeType = 'application/json', cachedContentName = null, stage = 'gemini_call', attempt = 0 }) {
  const t0 = Date.now();
  let text = '';
  try {
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
    const body = {
      contents,
      generationConfig: {
        temperature: 0.2,
      }
    };

    if (responseMimeType) {
      body.generationConfig.responseMimeType = responseMimeType;
    }

    if (cachedContentName) {
      body.cachedContent = cachedContentName;
      // System instruction is already in the cache; DO NOT send it again.
    } else if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini API error: ${resp.status}`);
    }

    const data = await resp.json();
    text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    let parsedResult = null;
    if (responseMimeType === 'application/json') {
      let cleaned = text;
      // Strip markdown fences if present
      const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (fenced) cleaned = fenced[1];
      const objStart = cleaned.indexOf('{');
      const arrStart = cleaned.indexOf('[');
      const start = objStart === -1 ? arrStart : arrStart === -1 ? objStart : Math.min(objStart, arrStart);
      if (start !== -1) cleaned = cleaned.slice(start);
      try { parsedResult = JSON.parse(cleaned); } catch {}
    }
    
    await logModelCall({
      stage,
      attempt,
      model,
      systemPrompt: cachedContentName ? `[CACHED INSTRUCTION] ${cachedContentName}\n\nOriginal Prompt:\n${systemInstruction}` : systemInstruction,
      userMessages: contents,
      responseText: text,
      parsedResult,
      durationMs: Date.now() - t0,
    });
    
    return text.trim();
  } catch (e) {
    await logModelCall({
      stage,
      attempt,
      model,
      systemPrompt: cachedContentName ? `[CACHED INSTRUCTION] ${cachedContentName}\n\nOriginal Prompt:\n${systemInstruction}` : systemInstruction,
      userMessages: contents,
      responseText: text,
      parsedResult: null,
      durationMs: Date.now() - t0,
      error: e.message,
    });
    throw e;
  }
}

/**
 * Analyze existing diagram with Gemini vision.
 */
export async function analyzeQuestionImageWithGemini({ imageUrl, questionText, systemPrompt, apiKey, model = 'gemini-3.5-flash' }) {
  const parts = [];
  
  if (imageUrl.startsWith('data:')) {
    const b64 = imageUrl.split(',')[1];
    const mt = imageUrl.match(/data:(image\/\w+)/)?.[1] || 'image/png';
    parts.push({ inlineData: { mimeType: mt, data: b64 } });
  } else {
    const fetched = await fetchImageBase64(imageUrl);
    if (fetched) {
      parts.push({ inlineData: { mimeType: fetched.mimeType, data: fetched.base64 } });
    } else {
      parts.push({ text: `Original Image URL: ${imageUrl} (could not fetch as base64)` });
    }
  }

  parts.push({ text: `Question context: ${questionText || 'No question text provided.'}\n\nAnalyse this diagram and return the JSON classification.` });

  const messages = [{
    role: 'user',
    parts
  }];

  const resText = await callGemini({
    systemInstruction: systemPrompt,
    contents: messages,
    model,
    apiKey,
    responseMimeType: 'application/json',
    stage: 'analyze',
    attempt: 0
  });

  return JSON.parse(resText);
}

/**
 * Generate MathsDiagram shapes via Gemini.
 */
export async function generateRepairShapesWithGemini({ prompt, systemPrompt, apiKey, model = 'gemini-3.5-flash', cachedContentName = null, attempt = 0 }) {
  const messages = [{
    role: 'user',
    parts: [{ text: prompt }]
  }];

  const resText = await callGemini({
    systemInstruction: systemPrompt,
    contents: messages,
    model,
    apiKey,
    responseMimeType: 'application/json',
    cachedContentName,
    stage: 'generate',
    attempt
  });

  return JSON.parse(resText);
}

