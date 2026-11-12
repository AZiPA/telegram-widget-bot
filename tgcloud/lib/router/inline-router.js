import { api } from 'sdk';
import { listWidgetDefinitions } from '../widgets/registry/index.js';

export async function routeInlineQueryUpdate(inlineQuery) {
  if (!inlineQuery || !inlineQuery.id) return;

  const q = String(inlineQuery.query ?? '').trim().toLowerCase();
  const allDefs = [...listWidgetDefinitions()].sort((a, b) =>
    a.type === 'timer' ? -1 : b.type === 'timer' ? 1 : 0
  );
  const matched = allDefs.filter(
    (d) => !q || d.type.includes(q) || d.title.toLowerCase().includes(q)
  );
  const defs = matched.length > 0 ? matched : allDefs;

  const results = defs.map((def) => ({
    type: 'article',
    id: `launch_${def.type}`,
    title: def.type === 'timer' ? '⏱️ Stopwatch (Analog & Digital)' : `🧩 ${def.title}`,
    description: def.description || 'Tap to post a launch card in this chat',
    input_message_content: {
      message_text: `${def.defaultCaption({})}\n${def.description || ''}\n\nUse /${def.type} in the bot chat to open the interactive widget.`,
    },
    reply_markup: {
      inline_keyboard: [
        [{ text: def.type === 'timer' ? '⏱️ Launch Stopwatch' : `🧩 Launch ${def.title}`, callback_data: `share_new:${def.type}` }],
      ],
    },
  }));

  try {
    await api.answerInlineQuery({
      inline_query_id: inlineQuery.id,
      results,
      cache_time: 1,
      is_personal: true,
    });
  } catch (err) {
    console.error('[InlineRouter] answerInlineQuery error:', err);
  }
}
