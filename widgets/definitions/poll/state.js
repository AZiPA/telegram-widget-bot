/**
 * Pure state and caption builders for the live shared poll widget.
 * Zero SDK or DB dependencies.
 */

const DEFAULT_QUESTION = 'Which feature should we ship next?';
const DEFAULT_OPTIONS = ['Widgets v1', 'Mini App Sync', 'Inline Mode'];

/**
 * Parses a parameter string formatted as: "Question | Option A | Option B | ..."
 * Clamps options between 2 and 5.
 *
 * @param {string} [rawText='']
 * @returns {{ q: string, o: string[] }}
 */
export function parsePollParams(rawText = '') {
  if (typeof rawText !== 'string' || rawText.trim().length === 0) {
    return {
      q: DEFAULT_QUESTION,
      o: [...DEFAULT_OPTIONS],
    };
  }

  const parts = rawText
    .split('|')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return {
      q: DEFAULT_QUESTION,
      o: [...DEFAULT_OPTIONS],
    };
  }

  const q = parts[0];
  let o = parts.slice(1);

  if (o.length === 0) {
    o = [...DEFAULT_OPTIONS];
  } else if (o.length === 1) {
    o.push('Option 2');
  } else if (o.length > 5) {
    o = o.slice(0, 5);
  }

  return { q, o };
}

/**
 * Generates the default message caption for a poll widget.
 *
 * @param {object|string} [params={}]
 * @returns {string}
 */
export function defaultCaption(params = {}) {
  const q = typeof params === 'string' ? parsePollParams(params).q : params?.q;
  return '📊 ' + (q || 'Live Shared Poll');
}

/**
 * Creates the initial public_data payload for a shared poll.
 *
 * @param {object|string} [params={}]
 * @param {object} [options={}]
 * @param {number} [options.revision=1]
 * @returns {{ q: string, o: string[], v: number[], r: number }}
 */
export function createInitialPublicData(params = {}, { revision = 1 } = {}) {
  let parsed;
  if (typeof params === 'string') {
    parsed = parsePollParams(params);
  } else if (params && params.q && Array.isArray(params.o) && params.o.length >= 2) {
    let o = params.o;
    if (o.length > 5) o = o.slice(0, 5);
    parsed = { q: params.q, o };
  } else {
    const raw = params?.rawText ?? params?.text ?? '';
    parsed = parsePollParams(raw);
  }

  return {
    q: parsed.q,
    o: parsed.o,
    v: parsed.o.map(() => 0),
    r: revision,
  };
}

/**
 * Creates the initial chat_data payload.
 * Poll state is 100% shared across all chats/forwards via public_data.
 *
 * @returns {null}
 */
export function createInitialChatData() {
  return null;
}
