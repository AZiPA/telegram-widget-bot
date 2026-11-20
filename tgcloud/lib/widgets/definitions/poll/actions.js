import { BotApiError } from 'sdk';
import {
  WIDGET_CONFIG,
  getSharedWidgetById,
  updateSharedWidgetRecord,
  updateSharedWidgetState,
  getWidgetInstanceByMessage,
  updateWidgetInstanceRecord,
  updateMessageWidgetState,
} from '../../index.js';

/**
 * Applies a vote mutation to a poll widget (supporting both static per-message and shared polls).
 *
 * @param {object} params
 * @param {object} [params.query]
 * @param {string|number} params.payload
 * @param {object} [params.instance]
 * @param {object} [params.sharedWidget]
 * @param {string} [params.widgetId]
 * @returns {Promise<object|null>}
 */
export async function applyPollVote({ query, payload, instance, sharedWidget, widgetId: explicitWidgetId }) {
  const optionIdx = Number.parseInt(payload, 10);
  if (Number.isNaN(optionIdx)) {
    return null;
  }

  const rawWid = explicitWidgetId ?? query?.widget_id ?? query?.message?.widget?.id ?? instance?.widgetId ?? sharedWidget?.widgetId ?? null;
  const widgetId = rawWid !== null && rawWid !== undefined ? String(rawWid) : null;
  const isShared = Boolean(WIDGET_CONFIG.ALLOW_SHARED_WIDGETS && widgetId);

  const userId = query?.from?.id != null ? String(query.from.id) : null;

  if (isShared) {
    let row = sharedWidget ?? null;
    if (!row && widgetId) {
      try {
        row = await getSharedWidgetById(widgetId);
      } catch (err) {
        console.warn('[PollActions] getSharedWidgetById warning:', err);
      }
    }
    if (!row) {
      return null;
    }

    let publicData = row.publicData;
    if (typeof publicData === 'string') {
      try {
        publicData = JSON.parse(publicData);
      } catch {
        publicData = null;
      }
    }
    if (!publicData || typeof publicData !== 'object') {
      return null;
    }

    const options = Array.isArray(publicData.o) ? publicData.o : [];
    if (optionIdx < 0 || optionIdx >= options.length) {
      return null;
    }

    let inst = instance ?? null;
    if (!inst) {
      const chatId = query?.chat?.id ?? query?.message?.chat?.id ?? null;
      const messageId = query?.message_id ?? query?.message?.message_id ?? null;
      const inlineMessageId = query?.inline_message_id ?? null;
      if (inlineMessageId || (chatId != null && messageId != null)) {
        try {
          inst = await getWidgetInstanceByMessage({ chatId, messageId, inlineMessageId });
        } catch {}
      }
    }

    let chatData = inst?.chatData;
    if (typeof chatData === 'string') {
      try { chatData = JSON.parse(chatData); } catch { chatData = null; }
    }
    if (!chatData || typeof chatData !== 'object') {
      chatData = { voters: {} };
    } else if (!chatData.voters || typeof chatData.voters !== 'object') {
      chatData = { ...chatData, voters: {} };
    } else {
      chatData = { ...chatData, voters: { ...chatData.voters } };
    }

    const previousVote = userId && chatData.voters[userId] !== undefined ? chatData.voters[userId] : null;
    if (previousVote !== null && previousVote === optionIdx) {
      return publicData;
    }

    publicData = {
      ...publicData,
      v: Array.isArray(publicData.v) ? [...publicData.v] : options.map(() => 0),
    };
    while (publicData.v.length < options.length) {
      publicData.v.push(0);
    }

    if (previousVote !== null && previousVote >= 0 && previousVote < publicData.v.length) {
      publicData.v[previousVote] = Math.max(0, (publicData.v[previousVote] || 0) - 1);
    }
    publicData.v[optionIdx] = (publicData.v[optionIdx] || 0) + 1;

    if (userId) {
      chatData.voters[userId] = optionIdx;
    }

    const nextRevision = (Number(row.revision) || Number(publicData.r) || 1) + 1;
    publicData.r = nextRevision;

    // Commit-After-Edit: Call Telegram API FIRST
    try {
      await updateSharedWidgetState({
        widgetId,
        publicData,
        cacheTime: 15,
      });
    } catch (err) {
      const isBotApi = err instanceof BotApiError || err?.name === 'BotApiError' || err?.code !== undefined;
      if (!(isBotApi && (err.code === 429 || err.code === 400))) {
        console.warn('[PollActions] updateSharedWidgetState warning:', err);
      }
      throw err;
    }

    // Only update DB after Telegram API edit succeeds
    try {
      await updateSharedWidgetRecord(widgetId, {
        publicData,
        revision: nextRevision,
        cacheTime: 15,
      });
    } catch (dbErr) {
      console.warn('[PollActions] updateSharedWidgetRecord warning:', dbErr);
    }

    if (inst?.id) {
      try {
        await updateWidgetInstanceRecord(inst.id, {
          chatData,
          revision: nextRevision,
        });
      } catch (dbErr) {
        console.warn('[PollActions] updateWidgetInstanceRecord warning:', dbErr);
      }
    }

    return publicData;
  }

  // Per-message static poll (when WIDGET_CONFIG.ALLOW_SHARED_WIDGETS is false)
  let inst = instance ?? null;
  const chatId = query?.chat?.id ?? query?.message?.chat?.id ?? null;
  const messageId = query?.message_id ?? query?.message?.message_id ?? null;
  const inlineMessageId = query?.inline_message_id ?? null;

  if (!inst && (inlineMessageId || (chatId != null && messageId != null))) {
    try {
      inst = await getWidgetInstanceByMessage({ chatId, messageId, inlineMessageId });
    } catch (err) {
      console.warn('[PollActions] getWidgetInstanceByMessage warning:', err);
    }
  }

  if (!inst) {
    return null;
  }

  let publicData = inst.publicData;
  if (typeof publicData === 'string') {
    try {
      publicData = JSON.parse(publicData);
    } catch {
      publicData = null;
    }
  }
  if (!publicData || typeof publicData !== 'object') {
    return null;
  }

  const options = Array.isArray(publicData.o) ? publicData.o : [];
  if (optionIdx < 0 || optionIdx >= options.length) {
    return null;
  }

  let chatData = inst.chatData;
  if (typeof chatData === 'string') {
    try {
      chatData = JSON.parse(chatData);
    } catch {
      chatData = null;
    }
  }
  if (!chatData || typeof chatData !== 'object') {
    chatData = { voters: {} };
  } else if (!chatData.voters || typeof chatData.voters !== 'object') {
    chatData = { ...chatData, voters: {} };
  } else {
    chatData = { ...chatData, voters: { ...chatData.voters } };
  }

  const previousVote = userId && chatData.voters[userId] !== undefined ? chatData.voters[userId] : null;
  if (previousVote !== null && previousVote === optionIdx) {
    return publicData;
  }

  publicData = {
    ...publicData,
    v: Array.isArray(publicData.v) ? [...publicData.v] : options.map(() => 0),
  };
  while (publicData.v.length < options.length) {
    publicData.v.push(0);
  }

  if (previousVote !== null && previousVote >= 0 && previousVote < publicData.v.length) {
    publicData.v[previousVote] = Math.max(0, (publicData.v[previousVote] || 0) - 1);
  }
  publicData.v[optionIdx] = (publicData.v[optionIdx] || 0) + 1;

  if (userId) {
    chatData.voters[userId] = optionIdx;
  }

  const nextRevision = (Number(inst.revision) || Number(publicData.r) || 1) + 1;
  publicData.r = nextRevision;

  // Commit-After-Edit: Call Telegram API FIRST
  const targetChatId = chatId ?? inst.chatId;
  const targetMessageId = messageId ?? inst.messageId;
  const targetInlineMessageId = inlineMessageId ?? inst.inlineMessageId;

  try {
    await updateMessageWidgetState({
      chatId: targetChatId,
      messageId: targetMessageId,
      inlineMessageId: targetInlineMessageId,
      publicData,
    });
  } catch (err) {
    const isBotApi = err instanceof BotApiError || err?.name === 'BotApiError' || err?.code !== undefined;
    if (!(isBotApi && (err.code === 429 || err.code === 400))) {
      console.warn('[PollActions] updateMessageWidgetState warning:', err);
    }
    throw err;
  }

  // Only update DB after Telegram API edit succeeds
  if (inst.id) {
    try {
      await updateWidgetInstanceRecord(inst.id, {
        chatData,
        publicData,
        revision: nextRevision,
      });
    } catch (dbErr) {
      console.warn('[PollActions] updateWidgetInstanceRecord warning:', dbErr);
    }
  }

  return publicData;
}

/**
 * Handles incoming query from original widget message.
 *
 * @param {object} params
 * @param {object} params.query
 * @param {string} params.payload
 * @param {object} [params.instance]
 * @param {object} [params.sharedWidget]
 * @returns {Promise<object|null>}
 */
export async function onWidgetQuery({ query, payload, instance, sharedWidget }) {
  return await applyPollVote({ query, payload, instance, sharedWidget });
}

/**
 * Handles incoming query from forwarded copy of shared widget.
 *
 * @param {object} params
 * @param {object} params.query
 * @param {string} params.payload
 * @param {object} [params.instance]
 * @param {object} [params.sharedWidget]
 * @returns {Promise<object|null>}
 */
export async function onSharedWidgetQuery({ query, payload, instance, sharedWidget }) {
  return await applyPollVote({ query, payload, instance, sharedWidget });
}
