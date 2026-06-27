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

function isMockExam(q) {
  const tags = (q.tags || []).map(t => t.toLowerCase());
  // Primary: tagged MockExam (matches admin page filter exactly)
  if (tags.some(t => t === 'mockexam' || t === 'mock exam' || t === 'mock_exam')) return true;
  // Secondary: title contains 'mock exam' or 'mock test' as a phrase
  const title = (q.title || '').toLowerCase();
  return title.includes('mock exam') || title.includes('mock test');
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

  // Try tag-filtered search (most efficient — matches admin page behaviour)
  try {
    const tagData = await lmsGet('/search', { type: 'QUIZ', tag: 'MockExam' });
    const tagIds = tagData?.ids || tagData?.results?.map(r => r.id) || [];
    if (tagIds.length > 0) {
      console.log(`[LMS] Tag search returned ${tagIds.length} MockExam IDs`);
      const BATCH = 20;
      for (let i = 0; i < tagIds.length; i += BATCH) {
        const chunk = tagIds.slice(i, i + BATCH);
        const results = await Promise.allSettled(chunk.map(id => lmsGet(`/quizzes/${id}`)));
        const batch = results
          .filter(r => r.status === 'fulfilled' && r.value)
          .map(r => r.value);
        if (batch.length > 0) onBatch(batch, i + BATCH >= tagIds.length);
      }
      return;
    }
  } catch {}

  // Fallback: paginate through ALL quizzes and filter by MockExam tag
  // The /search endpoint may paginate — follow nextToken/lastKey until exhausted
  let allIds = [];
  let nextToken = null;
  do {
    const params = { type: 'QUIZ', limit: 200 };
    if (nextToken) params.nextToken = nextToken;
    const searchData = await lmsGet('/search', params);
    const pageIds = searchData?.ids || searchData?.results?.map(r => r.id) || [];
    allIds = allIds.concat(pageIds);
    nextToken = searchData?.nextToken || searchData?.lastKey || null;
    console.log(`[LMS] Search page: ${pageIds.length} IDs, nextToken: ${!!nextToken}`);
  } while (nextToken);

  console.log(`[LMS] Total quiz IDs found: ${allIds.length}`);

  const BATCH = 20;
  for (let i = 0; i < allIds.length; i += BATCH) {
    const chunk = allIds.slice(i, i + BATCH);
    const results = await Promise.allSettled(chunk.map(id => lmsGet(`/quizzes/${id}`)));
    const mockBatch = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value)
      .filter(isMockExam);
    if (mockBatch.length > 0) onBatch(mockBatch, i + BATCH >= allIds.length);
  }
}

// ── Quizzes ───────────────────────────────────────────────────────────────────

export async function fetchQuiz(quizId) {
  return lmsGet(`/quizzes/${quizId}`);
}

export async function fetchQuizWithQuestions(quizId) {
  const quiz = await lmsGet(`/quizzes/${quizId}`);
  if (!quiz) return null;

  // Try a dedicated questions endpoint first (may return all questions in one call)
  try {
    const bulk = await lmsGet(`/quizzes/${quizId}/questions`);
    const bulkItems = bulk?.items || bulk?.questions || (Array.isArray(bulk) ? bulk : null);
    if (bulkItems?.length > 0) {
      return { ...quiz, questionDetails: bulkItems };
    }
  } catch {}

  const questionIds = quiz.questionIds || quiz.questions?.map(q => q.id) || [];

  // Fetch in parallel batches of 10 to avoid rate limits
  const BATCH = 10;
  const details = [];
  for (let i = 0; i < questionIds.length; i += BATCH) {
    const chunk = questionIds.slice(i, i + BATCH);
    const results = await Promise.allSettled(chunk.map(id => lmsGet(`/questions/${id}`)));
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value) {
        details.push(r.value);
      } else {
        console.warn(`[LMS] Failed to load question ${chunk[idx]}:`, r.reason?.message);
      }
    });
  }

  return { ...quiz, questionDetails: details };
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
