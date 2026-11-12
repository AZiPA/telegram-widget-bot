import { api, BotApiError } from 'sdk';
import {
  getSharedWidgetById,
  listRecentSharedWidgets,
  sendSharedWidgetMessage,
  sendWidgetMessage,
  clearSharedWidgets,
} from '../widgets/index.js';
import {
  getWidgetDefinition,
  resolveAndDispatchWidgetQuery,
} from '../widgets/registry/index.js';

/**
 * Handles callback queries and widget query bridges.
 *
 * @param {object} callbackQuery - Telegram CallbackQuery object
 * @param {object} ctx - Context object containing the full update
 * @returns {Promise<*>} Result of handling the query
 */
export async function routeCallbackQueryUpdate(callbackQuery, ctx) {
  if (ctx?.update?.widget_query) {
    return await resolveAndDispatchWidgetQuery(ctx.update.widget_query, { isSharedCopy: false });
  }

  if (ctx?.update?.shared_widget_query) {
    return await resolveAndDispatchWidgetQuery(ctx.update.shared_widget_query, { isSharedCopy: true });
  }

  const data = callbackQuery?.data || '';

  if (data.startsWith('share_idx:')) {
    const idx = Number.parseInt(data.slice(10), 10);
    const recent = await listRecentSharedWidgets({ limit: 5 });
    const row = recent?.[idx];
    const chatId = callbackQuery.message?.chat?.id;
    if (row && chatId) {
      const def = getWidgetDefinition(row.type);
      if (def) {
        try {
          await sendSharedWidgetMessage(def, {
            chatId,
            widgetId: row.widgetId,
            params: row.publicData ?? {},
          });
        } catch (err) {
          console.warn('[callback-router] sendSharedWidgetMessage warning:', err?.description ?? err);
        }
      }
    }
    try {
      await api.answerCallbackQuery({
        callback_query_id: callbackQuery.id,
        text: 'Widget posted!',
      });
    } catch {}
    return { handled: true, idx };
  }

  if (data.startsWith('share_new:')) {
    const type = data.slice(10);
    const def = getWidgetDefinition(type);
    const chatId = callbackQuery.message?.chat?.id;
    if (def && chatId) {
      try {
        await sendWidgetMessage(def, {
          chatId,
          createdBy: callbackQuery.from?.id ?? null,
        });
      } catch (err) {
        console.warn('[callback-router] sendWidgetMessage warning:', err?.description ?? err);
      }
    }
    try {
      await api.answerCallbackQuery({
        callback_query_id: callbackQuery.id,
        text: 'New widget created!',
      });
    } catch {}
    return { handled: true, type };
  }

  if (data === 'share_clear:all') {
    try {
      await clearSharedWidgets();
    } catch (err) {
      console.warn('[callback-router] clearSharedWidgets warning:', err);
    }
    if (callbackQuery.message?.chat?.id && callbackQuery.message?.message_id) {
      try {
        await api.editMessageText({
          chat_id: callbackQuery.message.chat.id,
          message_id: callbackQuery.message.message_id,
          text: '✅ Saved widget list cleared. Send /timer or /poll to create a fresh widget.',
        });
      } catch (err) {
        console.warn('[callback-router] editMessageText warning:', err?.description ?? err);
      }
    }
    try {
      await api.answerCallbackQuery({
        callback_query_id: callbackQuery.id,
        text: 'Saved list cleared!',
      });
    } catch {}
    return { handled: true, cleared: true };
  }

  // Legacy share: callback fallback
  if (data.startsWith('share:')) {
    const widgetId = data.slice(6);
    const row = await getSharedWidgetById(widgetId);
    const chatId = callbackQuery.message?.chat?.id;
    if (row && chatId) {
      const def = getWidgetDefinition(row.type);
      if (def) {
        await sendSharedWidgetMessage(def, {
          chatId,
          widgetId: row.widgetId,
          params: row.publicData ?? {},
        });
      }
    }
    try {
      await api.answerCallbackQuery({
        callback_query_id: callbackQuery.id,
        text: 'Widget posted!',
      });
    } catch (err) {
      console.warn(`[callback-router] Failed to answer share callback ${callbackQuery.id}:`, err?.description || err.message);
    }
    return { handled: true, widgetId };
  }

  if (data.startsWith('wg:')) {
    return await resolveAndDispatchWidgetQuery(
      {
        id: callbackQuery.id,
        from: callbackQuery.from,
        chat: callbackQuery.message?.chat,
        message_id: callbackQuery.message?.message_id,
        inline_message_id: callbackQuery.inline_message_id,
        data: data.slice(3),
      },
      { isSharedCopy: false }
    );
  }

  if (callbackQuery?.id) {
    try {
      return await api.answerCallbackQuery({
        callback_query_id: callbackQuery.id,
      });
    } catch (err) {
      const isBotApi = err instanceof BotApiError || err?.name === 'BotApiError' || err?.code === 400;
      if (isBotApi && (err.code === 400 || err?.status === 400)) {
        console.warn(`[callback-router] Handled BotApiError 400 for callback ${callbackQuery.id}: ${err.description || err.message}`);
        return null;
      }
      throw err;
    }
  }

  return null;
}
