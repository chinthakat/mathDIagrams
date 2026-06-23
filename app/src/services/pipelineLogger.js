/**
 * Pipeline logger — captures every model request/response in the repair pipeline.
 * Writes JSON-lines entries to the Express backend (server/logs/repair_pipeline.log)
 * and keeps an in-memory buffer for the session.
 */

const SERVER_URL = 'http://localhost:3001';

// In-memory buffer for current session
let _sessionLog = [];

function ts() { return new Date().toISOString(); }

/**
 * Log a structured entry.
 * @param {object} entry — any fields; always gets a timestamp added.
 */
export async function logEntry(entry) {
  const record = { timestamp: ts(), ...entry };
  _sessionLog.push(record);

  // Fire-and-forget POST to server (non-blocking)
  try {
    await fetch(`${SERVER_URL}/api/repair-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
  } catch {
    // Server not running — silently continue, in-memory log still works
  }
}

/**
 * Log a full model API call: request payload + raw response text + parsed result.
 */
export async function logModelCall({ stage, attempt, model, systemPrompt, userMessages, responseText, parsedResult, durationMs, error }) {
  await logEntry({
    type: 'model_call',
    stage,
    attempt,
    model,
    request: {
      system: systemPrompt,
      messages: userMessages,
    },
    response: {
      raw: responseText,
      parsed: parsedResult,
    },
    durationMs,
    error: error ? String(error) : undefined,
  });
}

/** Log a pipeline lifecycle event (no model call). */
export async function logEvent({ stage, attempt, maxAttempts, message, data }) {
  await logEntry({ type: 'event', stage, attempt, maxAttempts, message, data });
}

/** Get the current session's in-memory log entries. */
export function getSessionLog() { return [..._sessionLog]; }

/** Clear the in-memory session buffer. */
export function clearSessionLog() { _sessionLog = []; }

/**
 * Download the full log file from the server as a JSON file.
 * Falls back to the in-memory session log if the server is unreachable.
 */
export async function downloadLog(filename = `repair_log_${Date.now()}.json`) {
  let entries;
  try {
    const resp = await fetch(`${SERVER_URL}/api/repair-logs`);
    entries = await resp.json();
  } catch {
    entries = _sessionLog;
  }

  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Clear the server-side log file.
 */
export async function clearServerLog() {
  try {
    await fetch(`${SERVER_URL}/api/repair-logs`, { method: 'DELETE' });
  } catch {}
  clearSessionLog();
}
