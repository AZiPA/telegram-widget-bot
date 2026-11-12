import {
  upsertSharedWidget,
  getSharedWidgetById,
  getLatestSharedWidgetByType,
  updateSharedWidgetRecord,
  updateSharedWidgetState,
  getWidgetInstanceByMessage,
  updateWidgetInstanceRecord,
  updateMessageWidgetState,
} from '../../index.js';
import { applyTimerAction, createInitialPublicData } from './state.js';

function safeParseState(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(String(raw));
  } catch {
    return null;
  }
}

async function handleTimerMutation({ query, action, instance, sharedWidget }) {
  const nowMs = Date.now();
  const chatId = query?.chat?.id ?? query?.message?.chat?.id ?? null;
  const messageId = query?.message_id ?? query?.message?.message_id ?? null;
  const inlineMessageId = query?.inline_message_id ?? null;

  let inst = instance ?? null;
  if (!inst && ((chatId && messageId) || inlineMessageId)) {
    try {
      inst = await getWidgetInstanceByMessage({ chatId, messageId, inlineMessageId });
    } catch {}
  }

  const rawWid = query?.widget_id ?? query?.message?.widget?.id ?? inst?.widgetId ?? sharedWidget?.widgetId ?? null;
  let widgetId = rawWid !== null && rawWid !== undefined ? String(rawWid) : null;

  let sharedRow = sharedWidget ?? null;
  if (!sharedRow && widgetId) {
    try {
      sharedRow = await getSharedWidgetById(widgetId);
    } catch {}
  }
  if (!sharedRow && !widgetId) {
    try {
      sharedRow = await getLatestSharedWidgetByType('timer');
      if (sharedRow?.widgetId) widgetId = String(sharedRow.widgetId);
    } catch {}
  }

  const msgState = safeParseState(query?.message?.widget?.public_data);
  const currentState =
    safeParseState(sharedRow?.publicData) ??
    safeParseState(inst?.publicData) ??
    msgState ??
    createInitialPublicData({}, { revision: 1 });

  const baseRev = Math.max(
    Number(sharedRow?.revision || 0),
    Number(inst?.revision || 0),
    Number(currentState?.r || 1)
  );
  const nextRevision = baseRev + 1;

  const { changed, publicData } = applyTimerAction(currentState, action, nowMs, nextRevision);

  if (changed) {
    if (widgetId) {
      try {
        if (sharedRow) {
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
      } catch (dbErr) {
        console.warn('[TimerActions] DB update warning:', dbErr);
      }

      try {
        await updateSharedWidgetState({ widgetId, publicData, cacheTime: 10 });
      } catch (apiErr) {
        console.warn('[TimerActions] editSharedWidgetData warning:', apiErr?.description ?? apiErr);
      }
    }

    if (inst?.id) {
      try {
        await updateWidgetInstanceRecord(inst.id, {
          chatData: inst.chatData ?? null,
          publicData,
          revision: nextRevision,
        });
      } catch {}
    }

    if (!widgetId && ((chatId && messageId) || inlineMessageId)) {
      try {
        await updateMessageWidgetState({
          chatId,
          messageId,
          inlineMessageId,
          publicData,
        });
      } catch (apiErr) {
        console.warn('[TimerActions] editMessageWidgetData warning:', apiErr?.description ?? apiErr);
      }
    }
  }

  return publicData;
}

export async function onWidgetQuery(ctx) {
  return await handleTimerMutation(ctx);
}

export async function onSharedWidgetQuery(ctx) {
  return await handleTimerMutation(ctx);
}
