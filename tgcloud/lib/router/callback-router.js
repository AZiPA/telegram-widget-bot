import { api, BotApiError } from 'sdk';
import { resolveAndDispatchWidgetQuery } from '../widgets/registry/index.js';

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

  if (callbackQuery?.data?.startsWith('wg:')) {
    return await resolveAndDispatchWidgetQuery(
      {
        id: callbackQuery.id,
        from: callbackQuery.from,
        chat: callbackQuery.message?.chat,
        message_id: callbackQuery.message?.message_id,
        inline_message_id: callbackQuery.inline_message_id,
        data: callbackQuery.data.slice(3),
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
