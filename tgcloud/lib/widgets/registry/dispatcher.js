import {
  parseQueryData,
  getSharedWidgetById,
  getWidgetInstanceByMessage,
  safeAnswerWidgetQuery,
} from '../index.js';
import { getWidgetDefinition } from './catalog.js';

export async function resolveAndDispatchWidgetQuery(widgetQuery, { isSharedCopy = false } = {}) {
  if (!widgetQuery || !widgetQuery.id) return null;

  let answerPayload = undefined;
  try {
    const parsed = widgetQuery.data
      ? parseQueryData(String(widgetQuery.data))
      : { type: null, action: null, payload: null, raw: '' };

    const chat = widgetQuery.chat ?? widgetQuery.message?.chat ?? null;
    const chatId = chat?.id ?? null;
    const messageId = widgetQuery.message_id ?? widgetQuery.message?.message_id ?? null;
    const inlineMessageId = widgetQuery.inline_message_id ?? null;
    const rawWidgetId = widgetQuery.widget_id ?? widgetQuery.message?.widget?.id ?? null;
    const widgetId = rawWidgetId !== null && rawWidgetId !== undefined ? String(rawWidgetId) : null;

    let instance = null;
    if (!isSharedCopy && ((chatId && messageId) || inlineMessageId)) {
      try {
        instance = await getWidgetInstanceByMessage({ chatId, messageId, inlineMessageId });
      } catch (dbErr) {
        console.warn('[Dispatcher] Instance lookup warning:', dbErr);
      }
    }

    const resolvedWidgetId = widgetId ?? (instance?.widgetId ? String(instance.widgetId) : null);
    let sharedWidget = null;
    if (resolvedWidgetId) {
      try {
        sharedWidget = await getSharedWidgetById(resolvedWidgetId);
      } catch (dbErr) {
        console.warn('[Dispatcher] SharedWidget lookup warning:', dbErr);
      }
    }

    const resolvedType = parsed.type || sharedWidget?.type || instance?.type || null;
    const def = resolvedType ? getWidgetDefinition(resolvedType) : null;

    if (!def) {
      console.warn('[Dispatcher] No widget definition found for query:', widgetQuery.data);
      return null;
    }

    const normalizedQuery = {
      ...widgetQuery,
      chat,
      message_id: messageId,
      inline_message_id: inlineMessageId,
      widget_id: resolvedWidgetId,
    };

    const handlerFn = isSharedCopy
      ? (def.onSharedWidgetQuery ?? def.onWidgetQuery)
      : (def.onWidgetQuery ?? def.onSharedWidgetQuery);

    if (typeof handlerFn === 'function') {
      const result = await handlerFn({
        query: normalizedQuery,
        action: parsed.action,
        payload: parsed.payload,
        instance,
        sharedWidget,
      });
      if (result !== undefined && result !== null) {
        answerPayload = typeof result === 'string' ? result : JSON.stringify(result);
      }
    }
    return answerPayload;
  } catch (err) {
    console.error('[Dispatcher] Unhandled error during widget query:', err);
    return null;
  } finally {
    await safeAnswerWidgetQuery(widgetQuery.id, answerPayload);
  }
}
