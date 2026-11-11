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

export const buildCleanWidgetContent = cleanObject;

export async function routeInlineQueryUpdate(inlineQuery) {
  if (!inlineQuery || !inlineQuery.id) return;

  const q = String(inlineQuery.query ?? '').trim().toLowerCase();
  const results = [];

  try {
    // 1. Include active shared widgets from SQLite so users can share their running stopwatch/poll
    try {
      const recentShared = await listRecentSharedWidgets({ limit: 5 });
      for (let i = 0; i < recentShared.length; i++) {
        const row = recentShared[i];
        if (!row?.widgetId) continue;
        const def = getWidgetDefinition(row.type);
        if (!def) continue;
        if (q && !def.type.includes(q) && !def.title.toLowerCase().includes(q)) continue;

        results.push({
          type: 'article',
          id: `shared_${i}_${String(row.widgetId).slice(-12)}`,
          title: `🔄 Share Active: ${def.title}`,
          description: 'Post this live synchronized widget to the current chat',
          input_message_content: cleanObject({
            widget_id: String(row.widgetId),
            caption: def.defaultCaption(row.publicData ?? {}),
          }),
          reply_markup: {
            inline_keyboard: [[{ text: '📤 Share to Chat', switch_inline_query: '' }]],
          },
        });
      }
    } catch (dbErr) {
      console.warn('[InlineRouter] Skipping shared widget lookup:', dbErr);
    }

    // 2. Always include "Create New" widget definitions (putting timer first)
    const defs = [...listWidgetDefinitions()].sort((a, b) => (a.type === 'timer' ? -1 : b.type === 'timer' ? 1 : 0));
    for (const def of defs) {
      if (q && !def.type.includes(q) && !def.title.toLowerCase().includes(q)) continue;

      const initPub = def.createInitialPublicData ? def.createInitialPublicData({}, { revision: 1 }) : null;
      const initChat = def.createInitialChatData ? def.createInitialChatData({}, { revision: 1 }) : null;

      results.push({
        type: 'article',
        id: `new_${def.type}`,
        title: def.type === 'timer' ? '⏱️ Create New Stopwatch' : `➕ Create New: ${def.title}`,
        description: def.description || 'Send a new interactive widget to this chat',
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
        ...(def.isShared
          ? {
              reply_markup: {
                inline_keyboard: [[{ text: '📤 Share to Chat', switch_inline_query: '' }]],
              },
            }
          : {}),
      });
    }

    await api.answerInlineQuery({
      inline_query_id: inlineQuery.id,
      results: results.slice(0, 20),
      cache_time: 1,
      is_personal: true,
    });
  } catch (err) {
    console.error('[InlineRouter] Failed to answer inline query:', err);
    try {
      await api.answerInlineQuery({
        inline_query_id: inlineQuery.id,
        results: [],
        cache_time: 1,
      });
    } catch {}
  }
}
