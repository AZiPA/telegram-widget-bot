import { api } from 'sdk';
import {
  getSharedWidgetById,
  listRecentSharedWidgets,
  serializeStateData,
} from '../widgets/index.js';
import {
  listWidgetDefinitions,
  getWidgetDefinition,
} from '../widgets/registry/index.js';

/**
 * Strips undefined or null values from an object.
 * Prevents passing null/undefined chat_data or public_data to Bot API.
 *
 * @param {object} fields
 * @returns {object}
 */
export function buildCleanWidgetContent(fields) {
  const clean = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Handles inline query updates by providing articles for requested/recent shared widgets
 * and registered widget templates.
 *
 * @param {object} inlineQuery - Telegram InlineQuery object
 * @returns {Promise<object|null>} Result of answerInlineQuery
 */
export async function routeInlineQueryUpdate(inlineQuery) {
  if (!inlineQuery?.id) {
    return null;
  }

  const q = (inlineQuery?.query || '').trim();
  const results = [];
  let matchedRow = null;

  // 1. If q matches an existing widgetId, prioritize it as the first article
  if (q) {
    matchedRow = await getSharedWidgetById(q);
    if (matchedRow) {
      const def = getWidgetDefinition(matchedRow.type);
      results.push({
        type: 'article',
        id: `shared_${matchedRow.widgetId}`,
        title: `📤 Send Shared ${def?.title || matchedRow.type} (#${String(matchedRow.widgetId).slice(-6)})`,
        description: 'Tap to post this synchronized live widget here',
        input_message_content: buildCleanWidgetContent({
          widget_id: String(matchedRow.widgetId),
          caption: def ? def.defaultCaption(matchedRow.publicData ?? {}, matchedRow.widgetId) : `Shared Widget #${matchedRow.widgetId}`,
          parse_mode: 'HTML',
        }),
        reply_markup: {
          inline_keyboard: [[{ text: '📤 Share Widget', switch_inline_query: String(matchedRow.widgetId) }]],
        },
      });
    }
  }

  // 2. Always Include "Create New" Articles (timer widget first)
  const defs = listWidgetDefinitions().slice().sort((a, b) => {
    if (a.type === 'timer') return -1;
    if (b.type === 'timer') return 1;
    return 0;
  });

  for (const def of defs) {
    const pubData = def.createInitialPublicData
      ? def.createInitialPublicData({}, { revision: 1 })
      : undefined;
    const chatData = def.createInitialChatData
      ? def.createInitialChatData({}, { revision: 1 })
      : undefined;

    const rawContent = {
      html: typeof def.renderHtml === 'function' ? def.renderHtml({}) : '',
      width: def.width ?? 0,
      height: def.height ?? 0,
      caption: typeof def.defaultCaption === 'function' ? def.defaultCaption({}) : (def.defaultCaption || ''),
      allow_queries: Boolean(def.allowQueries),
      is_shared: Boolean(def.isShared),
    };

    if (pubData !== null && pubData !== undefined) {
      const s = serializeStateData(pubData);
      if (s !== undefined && s !== null) rawContent.public_data = s;
    }
    if (chatData !== null && chatData !== undefined) {
      const s = serializeStateData(chatData);
      if (s !== undefined && s !== null) rawContent.chat_data = s;
    }

    results.push({
      type: 'article',
      id: `new_${def.type}`,
      title: def.type === 'timer' ? '⏱️ Create New Stopwatch' : `➕ New ${def.title}`,
      description: def.description,
      input_message_content: buildCleanWidgetContent(rawContent),
    });
  }

  // 3. Append Recent Active Shared Widgets
  const recentRows = await listRecentSharedWidgets({ limit: 10 });
  for (const row of recentRows) {
    if (matchedRow && String(row.widgetId) === String(matchedRow.widgetId)) {
      continue;
    }
    const def = getWidgetDefinition(row.type);
    const caption = def
      ? (typeof def.defaultCaption === 'function' ? def.defaultCaption(row.publicData ?? {}, row.widgetId) : def.defaultCaption)
      : `Shared Widget #${row.widgetId}`;

    results.push({
      type: 'article',
      id: `shared_${row.widgetId}`,
      title: `📤 Send Shared ${def?.title || row.type} (#${String(row.widgetId).slice(-6)})`,
      description: 'Tap to post this synchronized live widget here',
      input_message_content: buildCleanWidgetContent({
        widget_id: String(row.widgetId),
        caption,
        parse_mode: 'HTML',
      }),
      reply_markup: {
        inline_keyboard: [[{ text: '📤 Share Widget', switch_inline_query: String(row.widgetId) }]],
      },
    });
  }

  return await api.answerInlineQuery({
    inline_query_id: inlineQuery.id,
    results: results.slice(0, 20),
    cache_time: 1,
    is_personal: true,
  });
}
