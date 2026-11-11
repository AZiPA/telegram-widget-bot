/**
 * Pure state and caption builders for the per-chat tap duel game (isShared: false).
 * Zero SDK or DB dependencies.
 */

/**
 * Parses parameters for the duel widget from raw text (e.g. "/duel 7" or "7").
 * Clamps target between 3 and 15 (default: 5).
 *
 * @param {string} [rawText='']
 * @returns {{ target: number }}
 */
export function parseDuelParams(rawText = '') {
  if (typeof rawText !== 'string' || rawText.trim().length === 0) {
    return { target: 5 };
  }

  const match = rawText.match(/\d+/);
  if (!match) {
    return { target: 5 };
  }

  let target = Number.parseInt(match[0], 10);
  if (Number.isNaN(target)) {
    target = 5;
  }
  target = Math.min(15, Math.max(3, target));
  return { target };
}

/**
 * Generates the default message caption for a duel widget.
 *
 * @param {object|string|number} [params={}]
 * @returns {string}
 */
export function defaultCaption(params = {}) {
  let target = 5;
  if (typeof params === 'number') {
    target = params;
  } else if (typeof params === 'string') {
    target = parseDuelParams(params).target;
  } else if (params && typeof params.target === 'number') {
    target = params.target;
  }
  target = Math.min(15, Math.max(3, target || 5));
  return '⚔️ Tap Duel (First to ' + target + ')';
}

/**
 * Creates initial chat_data payload for a duel widget.
 *
 * @param {object|string|number} [params={}]
 * @param {object} [options={}]
 * @param {number} [options.revision=1]
 * @returns {{ p1: null, p2: null, turn: null, target: number, winner: null, r: number }}
 */
export function createInitialChatData(params = {}, { revision = 1 } = {}) {
  let target = 5;
  if (typeof params === 'number') {
    target = params;
  } else if (typeof params === 'string') {
    target = parseDuelParams(params).target;
  } else if (params && typeof params.target === 'number') {
    target = params.target;
  }
  target = Math.min(15, Math.max(3, target || 5));

  return {
    p1: null,
    p2: null,
    turn: null,
    target,
    winner: null,
    r: revision,
  };
}

/**
 * Creates initial public_data payload for a duel widget (used as snapshot summary for forwards).
 *
 * @param {object|string|number} [params={}]
 * @param {object} [options={}]
 * @param {number} [options.revision=1]
 * @returns {{ summary: string, r: number }}
 */
export function createInitialPublicData(params = {}, { revision = 1 } = {}) {
  let target = 5;
  if (typeof params === 'number') {
    target = params;
  } else if (typeof params === 'string') {
    target = parseDuelParams(params).target;
  } else if (params && typeof params.target === 'number') {
    target = params.target;
  }
  target = Math.min(15, Math.max(3, target || 5));

  return {
    summary: 'Waiting for challengers (First to ' + target + ')',
    r: revision,
  };
}

/**
 * Pure state-machine function applying player moves (join or hit).
 *
 * @param {object} chatState
 * @param {object} user - Telegram User ({ id, first_name, ... })
 * @param {string} action - 'join' | 'hit'
 * @param {number} nextRevision
 * @returns {{ changed: boolean, chatData: object, publicData?: object }}
 */
export function applyDuelMove(chatState, user, action, nextRevision = 1) {
  if (!chatState) {
    chatState = createInitialChatData({}, { revision: nextRevision });
  }

  // If game has already concluded, ignore further moves
  if (chatState.winner) {
    return { changed: false, chatData: chatState };
  }

  if (!user || !user.id) {
    return { changed: false, chatData: chatState };
  }

  const playerName = user.first_name || user.username || 'Player';
  const nextChatData = {
    ...chatState,
    p1: chatState.p1 ? { ...chatState.p1 } : null,
    p2: chatState.p2 ? { ...chatState.p2 } : null,
  };

  let changed = false;

  if (action === 'join') {
    if (!nextChatData.p1) {
      nextChatData.p1 = { id: user.id, name: playerName, s: 0 };
      changed = true;
    } else if (nextChatData.p1.id !== user.id && !nextChatData.p2) {
      nextChatData.p2 = { id: user.id, name: playerName, s: 0 };
      nextChatData.turn = nextChatData.p1.id;
      changed = true;
    }
  } else if (action === 'hit') {
    if (nextChatData.p1 && nextChatData.p2 && nextChatData.turn === user.id) {
      const activePlayer = nextChatData.p1.id === user.id ? nextChatData.p1 : nextChatData.p2;
      const otherPlayer = nextChatData.p1.id === user.id ? nextChatData.p2 : nextChatData.p1;

      activePlayer.s += 1;
      if (activePlayer.s >= nextChatData.target) {
        nextChatData.winner = activePlayer.name;
        nextChatData.turn = null;
      } else {
        nextChatData.turn = otherPlayer.id;
      }
      changed = true;
    }
  }

  if (!changed) {
    return { changed: false, chatData: chatState };
  }

  nextChatData.r = nextRevision;

  let summary = '';
  if (nextChatData.winner) {
    summary = '🏆 ' + nextChatData.winner + ' won the duel (' + nextChatData.p1.s + ' - ' + nextChatData.p2.s + ')';
  } else if (nextChatData.p1 && nextChatData.p2) {
    summary = '⚔️ ' + nextChatData.p1.name + ' (' + nextChatData.p1.s + ') vs ' + nextChatData.p2.name + ' (' + nextChatData.p2.s + ')';
  } else if (nextChatData.p1) {
    summary = 'Waiting for challenger to face ' + nextChatData.p1.name + ' (First to ' + nextChatData.target + ')';
  } else {
    summary = 'Waiting for challengers (First to ' + nextChatData.target + ')';
  }

  const publicData = {
    summary,
    r: nextRevision,
  };

  return {
    changed: true,
    chatData: nextChatData,
    publicData,
  };
}
