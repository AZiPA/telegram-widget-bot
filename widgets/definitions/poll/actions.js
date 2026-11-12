import { BotApiError } from 'sdk';
import {
  getSharedWidgetById,
  updateSharedWidgetRecord,
  updateSharedWidgetState,
} from '../../index.js';

/**
 * Applies a vote mutation to a shared poll widget.
 *
 * @param {object} params
 * @param {string} params.widgetId
 * @param {string|number} params.payload
 * @returns {Promise<object|null>}
 */
export async function applyPollVote({ widgetId, payload }) {
  if (!widgetId) {
    return null;
  }

  const optionIdx = Number.parseInt(payload, 10);
  if (Number.isNaN(optionIdx)) {
    return null;
  }

  let row = null;
  try {
    row = await getSharedWidgetById(widgetId);
  } catch (err) {
    console.warn('[PollActions] getSharedWidgetById warning:', err);
  }
  if (!row) {
    return null;
  }

  let publicData = row.publicData;
  if (typeof publicData === 'string') {
    try {
      publicData = JSON.parse(publicData);
    } catch {
      publicData = null;
    }
  }

  if (!publicData || typeof publicData !== 'object') {
    return null;
  }

  const options = Array.isArray(publicData.o) ? publicData.o : [];
  if (optionIdx < 0 || optionIdx >= options.length) {
    return null;
  }

  // Clone publicData and votes array
  publicData = {
    ...publicData,
    v: Array.isArray(publicData.v) ? [...publicData.v] : options.map(() => 0),
  };
  while (publicData.v.length < options.length) {
    publicData.v.push(0);
  }

  publicData.v[optionIdx] = (publicData.v[optionIdx] || 0) + 1;

  const nextRevision = (row.revision ?? 1) + 1;
  publicData.r = nextRevision;

  try {
    await updateSharedWidgetRecord(widgetId, {
      publicData,
      revision: nextRevision,
      cacheTime: 15,
    });
  } catch (dbErr) {
    console.warn('[PollActions] updateSharedWidgetRecord warning:', dbErr);
  }

  try {
    await updateSharedWidgetState({
      widgetId,
      publicData,
      cacheTime: 15,
    });
  } catch (err) {
    const isBotApi = err instanceof BotApiError || err?.name === 'BotApiError' || err?.code !== undefined;
    if (!(isBotApi && (err.code === 429 || err.code === 400))) {
      console.warn('[PollActions] updateSharedWidgetState warning:', err);
    }
  }

  return publicData;
}

/**
 * Handles incoming query from original widget message.
 *
 * @param {object} params
 * @param {object} params.query
 * @param {string} params.payload
 * @param {object} [params.instance]
 * @returns {Promise<object|null>}
 */
export async function onWidgetQuery({ query, payload, instance }) {
  const widgetId = query?.widget_id ?? query?.message?.widget?.id ?? instance?.widgetId ?? null;
  return await applyPollVote({ widgetId, payload });
}

/**
 * Handles incoming query from forwarded copy of shared widget.
 *
 * @param {object} params
 * @param {object} params.query
 * @param {string} params.payload
 * @returns {Promise<object|null>}
 */
export async function onSharedWidgetQuery({ query, payload }) {
  const widgetId = query?.widget_id ?? query?.message?.widget?.id ?? null;
  return await applyPollVote({ widgetId, payload });
}
