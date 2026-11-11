import {
  parseQueryData,
  getSharedWidgetById,
  getWidgetInstanceByMessage,
  safeAnswerWidgetQuery,
} from '../index.js';
import { getWidgetDefinition } from './catalog.js';

/**
 * Resolves the widget definition and dispatches incoming widget_query or shared_widget_query.
 * Guarantees safeAnswerWidgetQuery is always called in a try/finally block.
 *
 * @param {object} widgetQuery - Telegram widget_query or shared_widget_query payload
 * @param {object} [options={}]
 * @param {boolean} [options.isSharedCopy=false] - True if incoming query is shared_widget_query
 * @returns {Promise<*>} The resulting state or null
 */
export async function resolveAndDispatchWidgetQuery(widgetQuery, { isSharedCopy = false } = {}) {
  let answerPayload = null;
  let result = null;

  try {
    if (!widgetQuery || !widgetQuery.data) {
      return null;
    }

    const parsed = parseQueryData(widgetQuery.data);
    let sharedWidget = null;
    let instance = null;

    if (widgetQuery.widget_id) {
      sharedWidget = await getSharedWidgetById(widgetQuery.widget_id);
    }

    if (!isSharedCopy) {
      const chatId = widgetQuery.chat?.id;
      const messageId = widgetQuery.message_id;
      const inlineMessageId = widgetQuery.inline_message_id;
      if (inlineMessageId || (chatId != null && messageId != null)) {
        instance = await getWidgetInstanceByMessage({ chatId, messageId, inlineMessageId });
      }
    }

    const type = parsed.type || sharedWidget?.type || instance?.type;
    const def = getWidgetDefinition(type);

    if (!def) {
      console.warn(`[dispatcher] Unknown widget definition for type "${type}"`);
      return null;
    }

    if (isSharedCopy) {
      if (typeof def.onSharedWidgetQuery === 'function') {
        result = await def.onSharedWidgetQuery({
          query: widgetQuery,
          action: parsed.action,
          payload: parsed.payload,
          sharedWidget,
        });
      }
    } else {
      if (typeof def.onWidgetQuery === 'function') {
        result = await def.onWidgetQuery({
          query: widgetQuery,
          action: parsed.action,
          payload: parsed.payload,
          instance,
          sharedWidget,
        });
      }
    }

    if (result !== undefined && result !== null) {
      answerPayload = typeof result === 'object' ? JSON.stringify(result) : String(result);
    }

    return result;
  } catch (err) {
    console.error('[dispatcher] Dispatch error:', err);
    throw err;
  } finally {
    if (widgetQuery?.id) {
      await safeAnswerWidgetQuery(widgetQuery.id, answerPayload);
    }
  }
}
