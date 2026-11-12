import { api, BotApiError } from 'sdk';
import { serializeStateData } from './validators.js';

/**
 * Updates chat_data and/or public_data on a specific widget message.
 * Catches 400 "message is not modified" errors idempotently and returns { modified: false }.
 * @param {object} options
 * @returns {Promise<object|boolean>}
 */
export async function updateMessageWidgetState({
  chatId,
  messageId,
  inlineMessageId,
  chatData,
  publicData,
}) {
  const payload = inlineMessageId
    ? { inline_message_id: inlineMessageId }
    : { chat_id: chatId, message_id: messageId };

  if (chatData !== undefined) {
    payload.chat_data = chatData === null ? '' : serializeStateData(chatData);
  }
  if (publicData !== undefined) {
    payload.public_data = publicData === null ? '' : serializeStateData(publicData);
  }

  try {
    return await api.editMessageWidgetData(payload);
  } catch (err) {
    const isBotApiError = err instanceof BotApiError || err?.name === 'BotApiError' || err?.code !== undefined;
    if (isBotApiError && err.code === 400 && /message is not modified/i.test(err.description ?? '')) {
      return { modified: false };
    }
    throw err;
  }
}

/**
 * Updates public_data and optional cache_time for a shared widget.
 * Clamps cacheTime to [5, 3600]. Catches 400 "not modified" errors and returns { modified: false }.
 * @param {object} options
 * @returns {Promise<object|boolean>}
 */
export async function updateSharedWidgetState({ widgetId, publicData, cacheTime }) {
  const payload = {
    widget_id: widgetId,
    public_data: publicData === null ? '' : serializeStateData(publicData),
  };
  if (cacheTime !== undefined) {
    payload.cache_time = cacheTime === 0 ? 0 : Math.min(3600, Math.max(5, Math.floor(Number(cacheTime))));
  }

  try {
    return await api.editSharedWidgetData(payload);
  } catch (err) {
    const isBotApiError = err instanceof BotApiError || err?.name === 'BotApiError' || err?.code !== undefined;
    if (isBotApiError && err.code === 400 && /not modified/i.test(err.description ?? '')) {
      return { modified: false };
    }
    throw err;
  }
}
