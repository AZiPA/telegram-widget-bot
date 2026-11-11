import { BotApiError } from 'sdk';
import {
  getWidgetInstanceByMessage,
  updateWidgetInstanceRecord,
  updateMessageWidgetState,
} from '../../index.js';
import { applyDuelMove, createInitialChatData } from './state.js';

/**
 * Handles incoming query for a duel widget message.
 *
 * @param {object} params
 * @param {object} params.query - widget_query object
 * @param {string} params.action - 'join' | 'hit'
 * @param {object} [params.instance] - widget instance record from DB if already loaded
 * @returns {Promise<object|null>}
 */
export async function onWidgetQuery({ query, action, instance }) {
  if (!instance) {
    const chatId = query?.chat?.id ?? query?.message?.chat?.id ?? null;
    const messageId = query?.message_id ?? query?.message?.message_id ?? null;
    const inlineMessageId = query?.inline_message_id ?? null;
    if (inlineMessageId || (chatId != null && messageId != null)) {
      try {
        instance = await getWidgetInstanceByMessage({ chatId, messageId, inlineMessageId });
      } catch (err) {
        console.warn('[DuelActions] getWidgetInstanceByMessage warning:', err);
      }
    }
  }

  let currentChatData = instance?.chatData;
  if (typeof currentChatData === 'string') {
    try {
      currentChatData = JSON.parse(currentChatData);
    } catch {
      currentChatData = null;
    }
  }

  if (!currentChatData) {
    currentChatData = createInitialChatData();
  }

  const nextRevision = (instance?.revision ?? currentChatData.r ?? 1) + 1;
  const user = query?.from;
  const result = applyDuelMove(currentChatData, user, action, nextRevision);

  if (result.changed) {
    const { chatData, publicData } = result;

    if (instance?.id) {
      try {
        await updateWidgetInstanceRecord(instance.id, {
          chatData,
          publicData,
          revision: nextRevision,
        });
      } catch (dbErr) {
        console.warn('[DuelActions] updateWidgetInstanceRecord warning:', dbErr);
      }
    }

    const chatId = query?.chat?.id ?? query?.message?.chat?.id ?? instance?.chatId;
    const messageId = query?.message_id ?? query?.message?.message_id ?? instance?.messageId;
    const inlineMessageId = query?.inline_message_id ?? instance?.inlineMessageId;

    try {
      await updateMessageWidgetState({
        chatId,
        messageId,
        inlineMessageId,
        chatData,
        publicData,
      });
    } catch (err) {
      const isBotApi = err instanceof BotApiError || err?.name === 'BotApiError' || err?.code !== undefined;
      if (!(isBotApi && (err.code === 429 || err.code === 400))) {
        console.warn('[DuelActions] updateMessageWidgetState warning:', err);
      }
    }

    return chatData;
  }

  return result.chatData;
}
