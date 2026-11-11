/**
 * Pure state machine, compact schema, and lap bounding for the Live Shared Stopwatch widget.
 * Zero SDK or DB dependencies.
 */

export const MAX_LAPS = 10;

/**
 * Parses parameters for the timer widget from raw text (e.g. "/timer Workout").
 * Clamps title to 40 characters (default: 'Shared Stopwatch').
 *
 * @param {string} [rawText='']
 * @returns {{ title: string }}
 */
export function parseTimerParams(rawText = '') {
  if (typeof rawText !== 'string') {
    rawText = String(rawText ?? '');
  }
  return {
    title: rawText.trim().slice(0, 40) || 'Shared Stopwatch',
  };
}

/**
 * Generates the default message caption for a timer widget.
 *
 * @param {object|string} [params={}]
 * @returns {string}
 */
export function defaultCaption(params = {}, widgetId = null) {
  let title = 'Shared Stopwatch';
  if (typeof params === 'string') {
    title = parseTimerParams(params).title;
  } else if (params && typeof params.title === 'string' && params.title.trim()) {
    title = params.title.trim().slice(0, 40);
  }
  const base = '⏱️ ' + (title || 'Shared Stopwatch');
  if (!widgetId) return base;
  return `${base}\n\n🔗 Widget ID: <code>${widgetId}</code>\nShare with: <code>/share ${widgetId}</code>`;
}

/**
 * Creates initial public_data payload for a timer widget.
 *
 * @param {object} [params={}]
 * @param {object} [options={}]
 * @param {number} [options.revision=1]
 * @returns {{ s: number, t0: number, acc: number, lc: number, laps: Array, r: number }}
 */
export function createInitialPublicData(params = {}, { revision = 1 } = {}) {
  return {
    s: 0,
    t0: 0,
    acc: 0,
    lc: 0,
    laps: [],
    r: revision,
  };
}

/**
 * Creates initial chat_data payload (null for shared timer).
 *
 * @returns {null}
 */
export function createInitialChatData() {
  return null;
}

/**
 * Pure state machine function applying stopwatch actions (start, stop, resume, lap, reset).
 *
 * @param {object|string} prevState - Previous public_data
 * @param {string} action - 'start' | 'stop' | 'resume' | 'lap' | 'reset'
 * @param {number} [nowMs=Date.now()] - Current epoch ms
 * @param {number} [nextRevision=1] - Next monotonic revision
 * @returns {{ changed: boolean, publicData: object }}
 */
export function applyTimerAction(prevState, action, nowMs = Date.now(), nextRevision = 1) {
  let state = prevState;
  if (typeof state === 'string') {
    try {
      state = JSON.parse(state);
    } catch {
      state = null;
    }
  }

  if (!state || typeof state !== 'object') {
    state = createInitialPublicData({}, { revision: nextRevision });
  } else {
    state = {
      s: typeof state.s === 'number' ? state.s : 0,
      t0: typeof state.t0 === 'number' ? state.t0 : 0,
      acc: typeof state.acc === 'number' ? state.acc : 0,
      lc: typeof state.lc === 'number' ? state.lc : 0,
      laps: Array.isArray(state.laps) ? [...state.laps] : [],
      r: typeof state.r === 'number' ? state.r : 1,
    };
  }

  if (action === 'start') {
    if (state.s !== 0) {
      return { changed: false, publicData: state };
    }
    const nextState = {
      s: 1,
      t0: nowMs,
      acc: 0,
      lc: 0,
      laps: [],
      r: nextRevision,
    };
    return { changed: true, publicData: nextState };
  }

  if (action === 'stop') {
    if (state.s !== 1) {
      return { changed: false, publicData: state };
    }
    const elapsed = state.acc + Math.max(0, nowMs - state.t0);
    const nextState = {
      s: 2,
      t0: 0,
      acc: elapsed,
      lc: state.lc,
      laps: state.laps,
      r: nextRevision,
    };
    return { changed: true, publicData: nextState };
  }

  if (action === 'resume') {
    if (state.s !== 2) {
      return { changed: false, publicData: state };
    }
    const nextState = {
      s: 1,
      t0: nowMs,
      acc: state.acc,
      lc: state.lc,
      laps: state.laps,
      r: nextRevision,
    };
    return { changed: true, publicData: nextState };
  }

  if (action === 'lap') {
    if (state.s !== 1) {
      return { changed: false, publicData: state };
    }
    const totalMs = state.acc + Math.max(0, nowMs - state.t0);
    const prevTotalMs = state.laps.length > 0 ? state.laps[0][2] : 0;
    const splitMs = Math.max(0, totalMs - prevTotalMs);
    const nextLapNum = (state.lc || 0) + 1;
    const nextLaps = [[nextLapNum, splitMs, totalMs], ...state.laps].slice(0, MAX_LAPS);
    const nextState = {
      s: 1,
      t0: state.t0,
      acc: state.acc,
      lc: nextLapNum,
      laps: nextLaps,
      r: nextRevision,
    };
    return { changed: true, publicData: nextState };
  }

  if (action === 'reset') {
    if (state.s !== 2 && state.s !== 0) {
      return { changed: false, publicData: state };
    }
    const nextState = {
      s: 0,
      t0: 0,
      acc: 0,
      lc: 0,
      laps: [],
      r: nextRevision,
    };
    return { changed: true, publicData: nextState };
  }

  return { changed: false, publicData: state };
}
