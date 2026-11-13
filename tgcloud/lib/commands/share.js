import { api } from 'sdk';
import { listWidgetDefinitions } from '../widgets/registry/index.js';

/**
 * Handles the /share command by providing a dynamic menu of widgets to launch.
 *
 * @param {object} message - Telegram Message object
 * @returns {Promise<object>} Status of command execution
 */
export async function handleShareCommand(message) {
  const chatId = message?.chat?.id;
  if (!chatId) return { handled: false };

  if (message?.chat?.type !== 'private') {
    await api.sendMessage({
      chat_id: chatId,
      text: 'Interactive widgets can only be launched in private chats. Please open a private chat with the bot and send /start.',
    });
    return { handled: true, chatRestricted: true };
  }

  const defs = listWidgetDefinitions();
  const inlineKeyboard = defs.map((def) => [
    {
      text: `${def.icon || '🧩'} ${def.launchLabel || ('Launch ' + def.title)}`,
      callback_data: `share_new:${def.type}`,
    },
  ]);

  await api.sendMessage({
    chat_id: chatId,
    text: '🧩 Choose an interactive widget to launch in this chat:',
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  });

  return { handled: true, command: '/share' };
}
