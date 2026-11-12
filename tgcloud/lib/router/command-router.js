import { api } from 'sdk';
import { sendWidgetMessage } from '../widgets/index.js';
import {
  getWidgetByCommand,
  getWidgetDefinition,
  resolveAndDispatchWidgetQuery,
} from '../widgets/registry/index.js';
import { handleShareCommand } from '../commands/share.js';

/**
 * Routes message updates and parses bot commands or widget queries.
 *
 * @param {object} message - Telegram Message object (or undefined)
 * @param {object} ctx - Context object containing full update
 * @returns {Promise<object>} Handled status and metadata
 */
export async function routeMessageUpdate(message, ctx) {
  // Check for direct widget queries passed on the update
  if (ctx?.update?.widget_query) {
    return await resolveAndDispatchWidgetQuery(ctx.update.widget_query, { isSharedCopy: false });
  }

  if (ctx?.update?.shared_widget_query) {
    return await resolveAndDispatchWidgetQuery(ctx.update.shared_widget_query, { isSharedCopy: true });
  }

  if (!message?.text || !message?.chat?.id) {
    return { handled: false };
  }

  const trimmed = message.text.trim();
  const spaceIdx = trimmed.search(/\s/);
  const firstToken = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
  const argText = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx).trim();

  // Strip @botusername suffix from command
  const [cmdPart] = firstToken.split('@');
  const command = cmdPart.toLowerCase();

  // /start deep link
  if (command === '/start' && argText) {
    const timerDef = getWidgetDefinition('timer');
    if (timerDef) {
      await sendWidgetMessage(timerDef, {
        chatId: message.chat.id,
        params: {},
        createdBy: message.from?.id ?? null,
      });
      return { handled: true, command: '/start', deepLink: argText };
    }
  }

  if (command === '/start' || command === '/help') {
    const text = [
      '⚡ Telegram Serverless Widget Engine',
      '',
      'Available commands:',
      '/timer - Stopwatch (Hybrid analog & digital chronograph with split laps)',
      '/duel - Tap Duel (Real-time 2-player tapping battle)',
      '/poll - Interactive Poll (Live multi-option voting with progress bars)',
      '/share - Launch widgets menu',
      '/help - Show this help message',
    ].join('\n');

    await api.sendMessage({
      chat_id: message.chat.id,
      text,
    });
    return { handled: true, command };
  }

  // /share or /share_<index>
  if (command === '/share' || command.startsWith('/share_')) {
    return await handleShareCommand(message, argText);
  }

  // /timer always sends a fresh, responsive Stopwatch widget
  if (command === '/timer') {
    const timerDef = getWidgetDefinition('timer');
    if (timerDef) {
      const params = typeof timerDef.parseParams === 'function'
        ? timerDef.parseParams(argText)
        : { title: argText };
      await sendWidgetMessage(timerDef, {
        chatId: message.chat.id,
        params,
        createdBy: message.from?.id ?? null,
      });
      return { handled: true, type: 'timer' };
    }
  }

  // Registered widget command (/poll, /duel, etc.)
  const def = getWidgetByCommand(command);
  if (def) {
    const params = typeof def.parseParams === 'function' ? def.parseParams(argText) : {};
    await sendWidgetMessage(def, {
      chatId: message.chat.id,
      params,
      createdBy: message.from?.id ?? null,
    });
    return { handled: true, type: def.type };
  }

  return { handled: false };
}
