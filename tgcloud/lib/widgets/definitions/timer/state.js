/**
 * Pure state machine, compact schema, and lap bounding for the Stopwatch widget.
 * Zero SDK or DB dependencies.
 */

export const MAX_CLIENT_LAPS = 100;

/**
 * Parses parameters for the timer widget from raw text (e.g. "/timer Workout" or "/timer new").
 * Clamps title to 40 characters.
 *
 * @param {string} [rawText='']
 * @returns {{ title: string, forceNew?: boolean }}
 */
export function parseTimerParams(rawText = '') {
  if (typeof rawText !== 'string') {
    rawText = String(rawText ?? '');
  }
  const trimmed = rawText.trim();
  if (trimmed.toLowerCase() === 'new') {
    return { title: '', forceNew: true };
  }
  return {
    title: trimmed.slice(0, 40),
    forceNew: false,
  };
}

/**
 * Generates the default message caption for a timer widget.
 *
 * @param {object|string} [params={}]
 * @returns {string}
 */
export function defaultCaption(params = {}) {
  const title = typeof params === 'string'
    ? parseTimerParams(params).title
    : (params?.title ? String(params.title).trim() : '');
  return title && title !== 'Stopwatch' && title !== 'Shared Stopwatch'
    ? `⏱️ Stopwatch — ${title}`
    : '⏱️ Stopwatch';
}

/**
 * Creates initial public_data payload for a timer widget (null for pure client-side personal timer).
 *
 * @returns {null}
 */
export function createInitialPublicData() {
  return null;
}

/**
 * Creates initial chat_data payload (null for pure client-side personal timer).
 *
 * @returns {null}
 */
export function createInitialChatData() {
  return null;
}
