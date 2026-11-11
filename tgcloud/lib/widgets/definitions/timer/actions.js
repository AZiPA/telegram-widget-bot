import { BotApiError } from 'sdk';
import {
  upsertSharedWidget,
  getSharedWidgetById,
  updateSharedWidgetRecord,
  updateSharedWidgetState,
  getWidgetInstanceByMessage,
  updateWidgetInstanceRecord,
  updateMessageWidgetState,
} from '../../index.js';
import { applyTimerAction, createInitialPublicData } from './state.js';

/**
 * Handles timer mutations (start, stop, resume, lap, reset) for shared widgets and instances.
 *
 * @param {object} params
 * @param {object} params.query - Telegram widget_query or shared_widget_query
 * @param {string} params.action - 'start' | 'stop' | 'resume' | 'lap' | 'reset'
 * @param {object} [params.instance] - widget instance record if already resolved
 * @returns {Promise<object>} Updated publicData state
 */
export async function handleTimerMutation({ query, action, instance } = {}) {
  const widgetId = query?.widget_id ? String(query.widget_id) : (instance?.widgetId ? String(instance.widgetId) : null);

  // Shared Widget Path
  if (widgetId) {
    const row = await getSharedWidgetById(widgetId);

    let rawState = row?.publicData ?? instance?.publicData;
    if (!rawState && query?.message?.widget?.public_data) {
      try {
        rawState = typeof query.message.widget.public_data === 'string'
          ? JSON.parse(query.message.widget.public_data)
          : query.message.widget.public_data;
      } catch {
        rawState = null;
      }
    }
    let currentState = rawState ?? createInitialPublicData();
    if (typeof currentState === 'string') {
      try {
        currentState = JSON.parse(currentState);
      } catch {
        currentState = createInitialPublicData();
      }
    }

    const nextRevision = Math.max(Number(row?.revision || 1), Number(currentState?.r || 1)) + 1;
    const { changed, publicData } = applyTimerAction(currentState, action, Date.now(), nextRevision);

    if (changed) {
      if (row) {
        await updateSharedWidgetRecord(widgetId, {
          publicData,
          revision: nextRevision,
          cacheTime: 10,
        });
      } else {
        await upsertSharedWidget({
          widgetId,
          type: 'timer',
          publicData,
          revision: nextRevision,
          cacheTime: 10,
          allowQueries: true,
          createdBy: query?.from?.id ?? null,
        });
      }

      try {
        await updateSharedWidgetState({ widgetId, publicData, cacheTime: 10 });
      } catch (err) {
        const isBotApi = err instanceof BotApiError || err?.name === 'BotApiError' || err?.code !== undefined;
        if (!(isBotApi && (err.code === 429 || err.code === 400))) {
          throw err;
        }
      }
    }

    return publicData;
  }

  // Fallback Instance Path (if widgetId is absent)
  const chatId = query?.chat?.id ?? query?.message?.chat?.id ?? null;
  const messageId = query?.message_id ?? query?.message?.message_id ?? null;
  const inlineMessageId = query?.inline_message_id ?? null;
  const inst = instance ?? (await getWidgetInstanceByMessage({ chatId, messageId, inlineMessageId }));

  let currentState = inst?.publicData ?? createInitialPublicData();
  if (typeof currentState === 'string') {
    try {
      currentState = JSON.parse(currentState);
    } catch {
      currentState = createInitialPublicData();
    }
  }

  const nextRevision = Math.max(Number(inst?.revision || 1), Number(currentState?.r || 1)) + 1;
  const { changed, publicData } = applyTimerAction(currentState, action, Date.now(), nextRevision);

  if (changed) {
    if (inst?.id) {
      await updateWidgetInstanceRecord(inst.id, {
        publicData,
        revision: nextRevision,
      });
    }

    const targetChatId = chatId ?? inst?.chatId;
    const targetMessageId = messageId ?? inst?.messageId;
    const targetInlineMessageId = inlineMessageId ?? inst?.inlineMessageId;

    if ((targetChatId && targetMessageId) || targetInlineMessageId) {
      try {
        await updateMessageWidgetState({
          chatId: targetChatId,
          messageId: targetMessageId,
          inlineMessageId: targetInlineMessageId,
          publicData,
        });
      } catch (err) {
        const isBotApi = err instanceof BotApiError || err?.name === 'BotApiError' || err?.code !== undefined;
        if (!(isBotApi && (err.code === 429 || err.code === 400))) {
          throw err;
        }
      }
    }
  }

  return publicData;
}

/**
 * Handles incoming query from original widget message.
 *
 * @param {object} ctx
 * @returns {Promise<object>}
 */
export async function onWidgetQuery(ctx) {
  return await handleTimerMutation(ctx);
}

/**
 * Handles incoming query from forwarded copy of shared widget.
 *
 * @param {object} ctx
 * @returns {Promise<object>}
 */
export async function onSharedWidgetQuery(ctx) {
  return await handleTimerMutation(ctx);
}
