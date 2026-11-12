import { api } from 'sdk';

export async function handleShareCommand(message) {
  const chatId = message?.chat?.id;
  if (!chatId) return;

  await api.sendMessage({
    chat_id: chatId,
    text: '🧩 Choose an interactive widget to launch in this chat:',
    reply_markup: {
      inline_keyboard: [
        [{ text: '⏱️ Launch Stopwatch', callback_data: 'share_new:timer' }],
        [{ text: '📊 Launch Poll', callback_data: 'share_new:poll' }],
        [{ text: '⚔️ Launch Tap Duel', callback_data: 'share_new:duel' }],
      ],
    },
  });
}
