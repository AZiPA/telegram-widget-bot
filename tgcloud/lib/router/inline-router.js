import { api } from 'sdk';
import { listRecentSharedWidgets, serializeStateData } from '../widgets/index.js';
import { listWidgetDefinitions, getWidgetDefinition } from '../widgets/registry/index.js';

export function cleanObject(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) {
      out[k] = v;
    }
  }
  return out;
}

export async function routeInlineQueryUpdate(inlineQuery) {
  if (!inlineQuery || !inlineQuery.id) return;

  const q = String(inlineQuery.query ?? '').trim().toLowerCase();
  let recentShared = [];
  try {
    recentShared = await listRecentSharedWidgets({ limit: 3 });
  } catch {}

  const allDefs = [...listWidgetDefinitions()].sort((a, b) =>
    a.type === 'timer' ? -1 : b.type === 'timer' ? 1 : 0
  );
  const matchingDefs = allDefs.filter(
    (d) => !q || d.type.includes(q) || d.title.toLowerCase().includes(q)
  );
  const defsToUse = matchingDefs.length > 0 ? matchingDefs : allDefs;

  // Tier 1: Native Widget Inline Results (InputSharedWidgetMessageContent & InputWidgetMessageContent)
  const widgetResults = [];
  for (let i = 0; i < recentShared.length; i++) {
    const row = recentShared[i];
    if (!row?.widgetId) continue;
    const def = getWidgetDefinition(row.type);
    if (!def) continue;

    widgetResults.push({
      type: 'article',
      id: `shared_${i}`,
      title: `🔄 Active ${def.title} #${i + 1}`,
      description: 'Post this synchronized live widget to the current chat',
      input_message_content: cleanObject({
        widget_id: String(row.widgetId),
        caption: def.defaultCaption({}),
      }),
    });
  }

  for (const def of defsToUse) {
    const initPub = def.createInitialPublicData
      ? def.createInitialPublicData({}, { revision: 1 })
      : null;
    const initChat = def.createInitialChatData
      ? def.createInitialChatData({}, { revision: 1 })
      : null;

    widgetResults.push({
      type: 'article',
      id: `new_${def.type}`,
      title: def.type === 'timer' ? '⏱️ Create New Stopwatch' : `➕ Create New: ${def.title}`,
      description: def.description || 'Send an interactive widget to this chat',
      input_message_content: cleanObject({
        html: def.renderHtml({}),
        width: def.width ?? 0,
        height: def.height ?? 0,
        caption: def.defaultCaption({}),
        allow_queries: Boolean(def.allowQueries),
        is_shared: Boolean(def.isShared),
        public_data: initPub ? serializeStateData(initPub) : undefined,
        chat_data: initChat ? serializeStateData(initChat) : undefined,
      }),
    });
  }

  try {
    await api.answerInlineQuery({
      inline_query_id: inlineQuery.id,
      results: widgetResults.slice(0, 10),
      cache_time: 1,
      is_personal: true,
    });
    return;
  } catch (err) {
    console.warn('[InlineRouter] Tier-1 widget inline results rejected, using Tier-2 card fallback:', err?.description ?? err);
  }

  // Tier 2 Fallback: Standard Text Articles with Interactive Launch Buttons
  try {
    const fallbackResults = defsToUse.map((def) => ({
      type: 'article',
      id: `card_${def.type}`,
      title: def.type === 'timer' ? '⏱️ Launch Shared Stopwatch' : `🚀 Launch ${def.title}`,
      description: def.description || 'Tap to post this interactive tool',
      input_message_content: {
        message_text: `${def.defaultCaption({})}\n\nTap below to launch the interactive widget:`,
      },
      reply_markup: {
        inline_keyboard: [
          [{ text: `▶️ Open ${def.title}`, callback_data: `share_new:${def.type}` }],
        ],
      },
    }));

    await api.answerInlineQuery({
      inline_query_id: inlineQuery.id,
      results: fallbackResults,
      cache_time: 1,
      is_personal: true,
    });
  } catch (fallbackErr) {
    console.error('[InlineRouter] Tier-2 fallback failed:', fallbackErr);
  }
}
