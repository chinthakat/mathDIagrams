/**
 * LMS API client for SimplyMaths production database.
 * Mirrors agents/lms_api_client.py from the Simplymaths project.
 * Base URL: https://ptltn9zpid.execute-api.us-east-1.amazonaws.com
 */

const LMS_BASE = 'https://ptltn9zpid.execute-api.us-east-1.amazonaws.com';
const MEDIA_BASE = 'https://databasestack-lmsmediabucket5d6e06e5-ui9kia2mxwsl.s3.us-east-1.amazonaws.com';
const LEGACY_MEDIA_BASE = 'https://databasestack-lmsmediabucket5d6e06e5-wzdhnmxdaoze.s3.us-east-1.amazonaws.com';

// ── Key storage ──────────────────────────────────────────────────────────────

export function getLmsApiKey() { return localStorage.getItem('lms_api_key') || import.meta.env.VITE_LMS_API_KEY || ''; }
export function saveLmsApiKey(key) { localStorage.setItem('lms_api_key', key); }
export function getLmsWriteKey() { return localStorage.getItem('lms_write_key') || import.meta.env.VITE_LMS_WRITE_KEY || ''; }
export function saveLmsWriteKey(key) { localStorage.setItem('lms_write_key', key); }

function readHeaders() {
  return { 'x-api-key': getLmsApiKey() };
}
function writeHeaders() {
  return { 'x-api-key': getLmsWriteKey(), 'Content-Type': 'application/json' };
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────

async function lmsGet(path, params = {}) {
  const url = new URL(`${LMS_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  const resp = await fetch(url.toString(), { headers: readHeaders() });
  if (!resp.ok) throw new Error(`LMS GET ${path} → HTTP ${resp.status}`);
  return resp.json();
}

async function lmsPatch(path, body) {
  const resp = await fetch(`${LMS_BASE}${path}`, {
    method: 'PATCH',
    headers: writeHeaders(),
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`LMS PATCH ${path} → HTTP ${resp.status}`);
  return resp.json();
}

async function lmsPost(path, body) {
  const resp = await fetch(`${LMS_BASE}${path}`, {
    method: 'POST',
    headers: writeHeaders(),
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`LMS POST ${path} → HTTP ${resp.status}`);
  return resp.json();
}

// ── ID helpers ────────────────────────────────────────────────────────────────

export function decodeLmsId(opaqueId) {
  try {
    const padded = opaqueId + '='.repeat((-opaqueId.length) % 4);
    return atob(padded);
  } catch { return ''; }
}

// ── Image URL resolution ──────────────────────────────────────────────────────

export function resolveImageUrl(imageKey) {
  if (!imageKey) return null;
  if (imageKey.startsWith('http://') || imageKey.startsWith('https://')) return imageKey;
  const key = imageKey.replace(/^\//, '');
  return `${MEDIA_BASE}/${key}`;
}

// ── Mock Exams ────────────────────────────────────────────────────────────────

/**
 * Fetches mock exams from the LMS.
 * Tries /mock-exams first; falls back to searching QUIZ type filtered by "mock" in title/tags.
 */
export async function fetchMockExams() {
  // Try dedicated endpoint first
  try {
    const data = await lmsGet('/mock-exams');
    if (data?.items?.length > 0) return data.items;
  } catch {}

  // Fall back: GET /search?type=QUIZ and filter by title/tags
  try {
    const data = await lmsGet('/search', { type: 'QUIZ' });
    const ids = data?.ids || [];
    const results = await Promise.allSettled(
      ids.slice(0, 200).map(id => lmsGet(`/quizzes/${id}`))
    );
    return results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value)
      .filter(q => {
        const title = (q.title || '').toLowerCase();
        const tags = (q.tags || []).join(' ').toLowerCase();
        return title.includes('mock') || tags.includes('mock');
      });
  } catch (e) {
    throw new Error(`Failed to fetch mock exams: ${e.message}`);
  }
}

/**
 * Fetches all mock exams in paginated mode for faster load.
 * Shows results incrementally via onBatch callback.
 */
export async function fetchMockExamsPaginated(onBatch) {
  // Try dedicated endpoint first
  try {
    const data = await lmsGet('/mock-exams');
    if (data?.items?.length > 0) {
      onBatch(data.items, true);
      return;
    }
  } catch {}

  // Paginated quiz search
  const searchData = await lmsGet('/search', { type: 'QUIZ' });
  const ids = searchData?.ids || [];
  const BATCH = 20;

  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH);
    const results = await Promise.allSettled(chunk.map(id => lmsGet(`/quizzes/${id}`)));
    const mockBatch = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value)
      .filter(q => {
        const title = (q.title || '').toLowerCase();
        const tags = (q.tags || []).join(' ').toLowerCase();
        return title.includes('mock') || tags.includes('mock') || title.includes('exam');
      });
    if (mockBatch.length > 0) onBatch(mockBatch, i + BATCH >= ids.length);
  }
}

// ── Quizzes ───────────────────────────────────────────────────────────────────

export async function fetchQuiz(quizId) {
  return lmsGet(`/quizzes/${quizId}`);
}

export async function fetchQuizWithQuestions(quizId) {
  const quiz = await lmsGet(`/quizzes/${quizId}`);
  if (!quiz) return null;

  const questionIds = quiz.questionIds || quiz.questions?.map(q => q.id) || [];
  const questions = await Promise.allSettled(
    questionIds.map(id => lmsGet(`/questions/${id}`))
  );
  return {
    ...quiz,
    questionDetails: questions
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value),
  };
}

// ── Questions ─────────────────────────────────────────────────────────────────

export async function fetchQuestion(questionId) {
  return lmsGet(`/questions/${questionId}`);
}

export async function updateQuestion(questionId, updates) {
  return lmsPatch(`/questions/${questionId}`, updates);
}

// ── Media upload ─────────────────────────────────────────────────────────────

/**
 * Uploads a base64-encoded PNG to the LMS media CDN.
 * Returns the public CDN URL.
 */
export async function uploadDiagramImage(base64Data, folder = 'diagram-editor') {
  const filename = `diagram_${Date.now()}.png`;
  const byteChars = atob(base64Data.replace(/^data:image\/png;base64,/, ''));
  const byteArr = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);

  const registration = await lmsPost('/media/upload', {
    filename,
    contentType: 'image/png',
    folder,
  });

  if (!registration?.uploadUrl || !registration?.publicUrl) {
    throw new Error('Failed to get presigned upload URL');
  }

  const putResp = await fetch(registration.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/png' },
    body: byteArr,
  });
  if (!putResp.ok) throw new Error(`S3 upload failed: ${putResp.status}`);

  return registration.publicUrl;
}
