import { api, BotApiError } from 'sdk';
import { WIDGET_CONFIG } from '../widgets/config.js';
import { sendWidgetMessage } from '../widgets/index.js';
import {
  getWidgetDefinition,
  resolveAndDispatchWidgetQuery,
} from '../widgets/registry/index.js';
import { tryInterceptWidgetUpdate } from './widget-query-router.js';

/**
 * Handles callback queries and widget query bridges.
 *
 * @param {object} callbackQuery - Telegram CallbackQuery object
 * @param {object} ctx - Context object containing the full update
 * @returns {Promise<*>} Result of handling the query
 */
export async function routeCallbackQueryUpdate(callbackQuery, ctx) {
  const intercepted = await tryInterceptWidgetUpdate(ctx);
  if (intercepted.intercepted) {
    return intercepted.result;
  }

  const data = callbackQuery?.data || '';

  if (data.startsWith('share_new:')) {
    const type = data.slice(10);
    const chatType = callbackQuery.message?.chat?.type;
    const chatId = callbackQuery.message?.chat?.id;
    const isPrivateChat = chatType === 'private';
    const isAllowed = isPrivateChat || Boolean(WIDGET_CONFIG.ALLOW_GROUP_WIDGETS);

    if (!chatId || !isAllowed) {
      try {
        await api.answerCallbackQuery({
          callback_query_id: callbackQuery.id,
          text: 'Please open the bot in a private chat and send /start first.',
          show_alert: true,
        });
      } catch (err) {
        console.warn('[callback-router] Failed to answer restricted callback:', err?.description ?? err.message);
      }
      return { handled: true, chatRestricted: true };
    }

    const def = getWidgetDefinition(type);
    if (def) {
      try {
        await sendWidgetMessage(def, {
          chatId,
          chatType,
          createdBy: callbackQuery.from?.id ?? null,
        });
      } catch (err) {
        if (err instanceof BotApiError || err?.name === 'BotApiError') {
          console.warn(`[callback-router] BotApiError ${err.code} in sendWidgetMessage: ${err.description || err.message}`);
        } else {
          console.error('[callback-router] sendWidgetMessage error:', err);
        }
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
