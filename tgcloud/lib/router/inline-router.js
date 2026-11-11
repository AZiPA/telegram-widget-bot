import { api } from 'sdk';
import {
  listRecentSharedWidgets,
  serializeStateData,
} from '../widgets/index.js';
import {
  listWidgetDefinitions,
  getWidgetDefinition,
} from '../widgets/registry/index.js';

/**
 * Handles inline query updates by providing articles for recent shared widgets
 * and registered widget templates.
 *
 * @param {object} inlineQuery - Telegram InlineQuery object
 * @returns {Promise<object|null>} Result of answerInlineQuery
 */
export async function routeInlineQueryUpdate(inlineQuery) {
  if (!inlineQuery?.id) {
    return null;
  }

  // Fetch up to 10 recent shared widgets
  const recentShared = await listRecentSharedWidgets({ limit: 10 });
  const sharedResults = [];

  for (const row of recentShared) {
    const def = getWidgetDefinition(row.type);
    if (!def) continue;

    const caption = typeof def.defaultCaption === 'function'
      ? def.defaultCaption(row.publicData ?? {})
      : (def.defaultCaption ?? '');

    sharedResults.push({
      type: 'article',
      id: `shared_${row.widgetId}`,
      title: `${def.title || row.type} (${row.widgetId})`,
      description: def.description || `Shared ${row.type} widget`,
      input_message_content: {
        widget_id: row.widgetId,
        caption,
      },
    });
  }

  // Map registered definitions to template articles
  const defs = listWidgetDefinitions();
  const defResults = defs.map((def) => {
    const caption = typeof def.defaultCaption === 'function'
      ? def.defaultCaption({})
      : (def.defaultCaption ?? '');

    const pubData = def.createInitialPublicData
      ? def.createInitialPublicData({}, { revision: 1 })
      : undefined;
    const chatData = def.createInitialChatData
      ? def.createInitialChatData({}, { revision: 1 })
      : undefined;

    const inputMessageContent = {
      html: typeof def.renderHtml === 'function' ? def.renderHtml({}) : '',
      width: def.width ?? 0,
      height: def.height ?? 0,
      caption,
      allow_queries: Boolean(def.allowQueries),
      is_shared: Boolean(def.isShared),
    };

    const pubSerialized = serializeStateData(pubData);
    if (pubSerialized !== undefined) {
      inputMessageContent.public_data = pubSerialized;
    }

    const chatSerialized = serializeStateData(chatData);
    if (chatSerialized !== undefined) {
      inputMessageContent.chat_data = chatSerialized;
    }

    return {
      type: 'article',
      id: `def_${def.type}`,
      title: def.title || def.type,
      description: def.description || `Create a new ${def.type} widget`,
      input_message_content: inputMessageContent,
    };
  });

  const results = [...sharedResults, ...defResults];

  return await api.answerInlineQuery({
    inline_query_id: inlineQuery.id,
    results,
    cache_time: 5,
  });
}
