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
    const chatId = query?.chat?.id;
    const messageId = query?.message_id;
    const inlineMessageId = query?.inline_message_id;
    if (inlineMessageId || (chatId != null && messageId != null)) {
      instance = await getWidgetInstanceByMessage({ chatId, messageId, inlineMessageId });
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
      await updateWidgetInstanceRecord(instance.id, {
        chatData,
        publicData,
        revision: nextRevision,
      });
    }

    const chatId = query?.chat?.id ?? instance?.chatId;
    const messageId = query?.message_id ?? instance?.messageId;
    const inlineMessageId = query?.inline_message_id ?? instance?.inlineMessageId;

    await updateMessageWidgetState({
      chatId,
      messageId,
      inlineMessageId,
      chatData,
      publicData,
    });

    return chatData;
  }

  return result.chatData;
}
