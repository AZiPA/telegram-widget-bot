import { api } from 'sdk';
import {
  getSharedWidgetById,
  listRecentSharedWidgets,
  sendSharedWidgetMessage,
} from '../widgets/index.js';
import { getWidgetDefinition } from '../widgets/registry/index.js';

/**
 * Handles /share and /share_<widgetId> commands.
 *
 * @param {object} message - Telegram Message object
 * @param {string} [argText=''] - Arguments passed to command
 * @returns {Promise<object>}
 */
export async function handleShareCommand(message, argText = '') {
  if (!message?.chat?.id) {
    return { handled: false };
  }

  const trimmed = (message.text || '').trim();
  const spaceIdx = trimmed.search(/\s/);
  const firstToken = (spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx)).split('@')[0];

  let widgetId = '';
  if (firstToken.toLowerCase().startsWith('/share_')) {
    widgetId = firstToken.slice(7).trim();
  } else if (argText) {
    widgetId = argText.trim().split(/\s+/)[0];
  }

  // If widgetId is provided
  if (widgetId) {
    const row = await getSharedWidgetById(widgetId);
    if (!row) {
      await api.sendMessage({
        chat_id: message.chat.id,
        text: 'Shared widget not found. Verify your selection and try again.',
      });
      return { handled: true, command: '/share', error: 'NOT_FOUND' };
    }

    const def = getWidgetDefinition(row.type);
    if (!def) {
      await api.sendMessage({
        chat_id: message.chat.id,
        text: 'Widget definition not found.',
      });
      return { handled: true, command: '/share', error: 'UNKNOWN_TYPE' };
    }

    await sendSharedWidgetMessage(def, {
      chatId: message.chat.id,
      widgetId: row.widgetId,
      params: row.publicData ?? {},
    });

    return { handled: true, command: '/share', widgetId: row.widgetId, type: def.type };
  }

  // If /share is called without arguments
  const recent = await listRecentSharedWidgets({ limit: 8 });
  if (!recent || recent.length === 0) {
    await api.sendMessage({
      chat_id: message.chat.id,
      text: 'No shared widgets exist yet. Create one first with /timer or /poll!',
    });
    return { handled: true, command: '/share', count: 0 };
  }

  const lines = recent
    .map((row, idx) => {
      const def = getWidgetDefinition(row.type);
      const title = def ? def.defaultCaption(row.publicData ?? {}) : row.type;
      return `${idx + 1}. ${title}`;
    })
    .join('\n');
  const text = `<b>Select a Shared Widget to Post or Share:</b>\n\n${lines}`;

  const keyboard = recent.map((row) => [
    {
      text: '📨 Post Here',
      callback_data: 'share:' + String(row.widgetId),
    },
    {
      text: '📤 Share to Chat',
      switch_inline_query: '',
    },
  ]);

  await api.sendMessage({
    chat_id: message.chat.id,
    text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });

  return { handled: true, command: '/share', count: recent.length };
}
