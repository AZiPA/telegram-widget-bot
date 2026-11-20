import { api } from 'sdk';
import { serializeQueryResult } from './validators.js';

export async function safeAnswerWidgetQuery(widgetQueryId, resultData) {
  if (widgetQueryId === undefined || widgetQueryId === null) return;
  let dataStr = undefined;
  try {
    dataStr = serializeQueryResult(resultData);
  } catch (err) {
    console.warn('[QueryResponder] Serialization warning:', err?.message ?? err);
  }

  const payload = { widget_query_id: String(widgetQueryId) };
  if (typeof dataStr === 'string' && dataStr.length > 0) {
    payload.data = dataStr;
  }

  try {
    await api.answerWidgetQuery(payload);
  } catch (err) {
    console.warn('[QueryResponder] answerWidgetQuery non-fatal error:', err?.description ?? err?.message ?? err);
  }
}
