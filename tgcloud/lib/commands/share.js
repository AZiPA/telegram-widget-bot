import { api } from 'sdk';
import {
  listRecentSharedWidgets,
  sendSharedWidgetMessage,
  sendWidgetMessage,
} from '../widgets/index.js';
import { getWidgetDefinition } from '../widgets/registry/index.js';

function formatWidgetLabel(row, index) {
  const state = row?.publicData && typeof row.publicData === 'object' ? row.publicData : {};
  if (row.type === 'timer') {
    const statusText = state.s === 1 ? 'Running 🟢' : state.s === 2 ? 'Paused ⏸️' : 'Idle ⚪';
    return `⏱️ Stopwatch #${index + 1} (${statusText})`;
  }
  if (row.type === 'poll') {
    const q = state.q ? String(state.q).slice(0, 24) : 'Live Poll';
    return `📊 ${q}`;
  }
  return `🧩 ${row.type.toUpperCase()} #${index + 1}`;
}

export async function handleShareCommand(message) {
  const chatId = message?.chat?.id;
  if (!chatId) return;

  const recent = await listRecentSharedWidgets({ limit: 5 });

  const trimmed = (message?.text || '').trim();
  if (trimmed.toLowerCase().startsWith('/share_')) {
    const token = trimmed.split(/\s+/)[0];
    const rawIdx = token.slice(7);
    const parsedIdx = Number.parseInt(rawIdx, 10);
    if (!Number.isNaN(parsedIdx) && recent && recent.length > 0) {
      const targetRow = recent[parsedIdx] || recent[parsedIdx - 1] || recent[0];
      if (targetRow?.widgetId) {
        const def = getWidgetDefinition(targetRow.type);
        if (def) {
          await sendSharedWidgetMessage(def, {
            chatId,
            widgetId: targetRow.widgetId,
            params: targetRow.publicData ?? {},
          });
          return { handled: true, command: '/share', shared: true };
        }
      }
    }
  }

  if (!recent || recent.length === 0) {
    const timerDef = getWidgetDefinition('timer');
    if (timerDef) {
      await sendWidgetMessage(timerDef, { chatId, createdBy: message.from?.id ?? null });
      return;
    }
    await api.sendMessage({
      chat_id: chatId,
      text: 'No active shared widgets yet. Use /timer or /poll to start one!',
    });
    return;
  }

  const keyboard = recent.map((row, idx) => [
    {
      text: formatWidgetLabel(row, idx),
      callback_data: `share_idx:${idx}`,
    },
    {
      text: '📤 Share',
      switch_inline_query: row.type,
    },
  ]);

  keyboard.push([
    { text: '➕ New Stopwatch', callback_data: 'share_new:timer' },
    { text: '🗑️ Clear Saved List', callback_data: 'share_clear:all' },
  ]);

  await api.sendMessage({
    chat_id: chatId,
    text: '📤 Select an active widget to post in this chat or share with friends:',
    reply_markup: { inline_keyboard: keyboard },
  });
}
