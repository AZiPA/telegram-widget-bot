import { api } from 'sdk';
import { listWidgetDefinitions } from '../widgets/registry/index.js';

let cachedBotUsername = null;

async function getBotUsername() {
  if (cachedBotUsername) return cachedBotUsername;
  try {
    const me = await api.getMe();
    if (me?.username) {
      cachedBotUsername = me.username;
    }
  } catch (err) {
    console.warn('[InlineRouter] Failed to fetch bot info:', err?.description ?? err.message);
  }
  return cachedBotUsername;
}

export async function routeInlineQueryUpdate(inlineQuery) {
  if (!inlineQuery || !inlineQuery.id) return;

  const q = String(inlineQuery.query ?? '').trim().toLowerCase();
  const allDefs = listWidgetDefinitions();
  const matched = allDefs.filter(
    (d) =>
      !q ||
      d.type.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      (d.description && d.description.toLowerCase().includes(q))
  );
  const defs = matched.length > 0 ? matched : allDefs;

  const botUsername = await getBotUsername();

  const results = defs.map((def) => {
    const icon = def.icon || '🧩';
    const label = def.launchLabel || `Launch ${def.title}`;
    const buttonText = `${icon} ${label}`;
    const caption = typeof def.defaultCaption === 'function' ? def.defaultCaption({}) : def.title;
    const descText = def.description ? `\n${def.description}` : '';

    const button = botUsername
      ? { text: buttonText, url: `https://t.me/${botUsername}?start=launch_${def.type}` }
      : { text: buttonText, callback_data: `share_new:${def.type}` };

    return {
      type: 'article',
      id: `launch_${def.type}`,
      title: `${icon} ${def.title}`,
      description: def.description || 'Tap to launch in bot chat',
      input_message_content: {
        message_text: `${caption}${descText}\n\nTap the button below to launch this widget in a private chat.`,
      },
      reply_markup: {
        inline_keyboard: [[button]],
      },
    };
  });

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
