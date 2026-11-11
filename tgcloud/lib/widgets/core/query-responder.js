import { api, BotApiError } from 'sdk';
import { serializeQueryResult } from './validators.js';

/**
 * Responds to a widget_query safely, suppressing QUERY_ID_INVALID (400) errors for expired queries.
 * @param {string} widgetQueryId
 * @param {*} [resultData]
 * @returns {Promise<*>}
 */
export async function safeAnswerWidgetQuery(widgetQueryId, resultData) {
  const payload = {
    widget_query_id: widgetQueryId,
  };
  if (resultData !== undefined && resultData !== null) {
    payload.data = serializeQueryResult(resultData);
  }

  try {
    return await api.answerWidgetQuery(payload);
  } catch (err) {
    const isBotApiError = err instanceof BotApiError || err?.name === 'BotApiError' || err?.code !== undefined;
    if (
      isBotApiError &&
      err.code === 400 &&
      (/QUERY_ID_INVALID/i.test(err.description ?? '') ||
       /query.*invalid/i.test(err.description ?? '') ||
       /query is too old/i.test(err.description ?? ''))
    ) {
      console.warn(`[safeAnswerWidgetQuery] Expired query ${widgetQueryId}: ${err.description}`);
      return false;
    }
    throw err;
  }
}
