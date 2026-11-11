import { api } from 'sdk';
import {
  sendWidgetMessage,
  sendSharedWidgetMessage,
  getSharedWidgetById,
} from '../widgets/index.js';
import {
  getWidgetByCommand,
  getWidgetDefinition,
  listWidgetDefinitions,
  resolveAndDispatchWidgetQuery,
} from '../widgets/registry/index.js';

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

  // /start or /help: dynamic help message
  if (command === '/start' || command === '/help') {
    const defs = listWidgetDefinitions();
    const widgetLines = defs
      .map((d) => `${d.command || d.type} - ${d.title}: ${d.description}`)
      .join('\n');

    const text = [
      'Telegram Serverless Widget Engine',
      '',
      'Available commands:',
      '/start or /help - Show this help message',
      '/share <widget_id> - Share an existing widget by its ID',
      '',
      'Widgets:',
      widgetLines,
    ].join('\n');

    await api.sendMessage({
      chat_id: message.chat.id,
      text,
    });
    return { handled: true, command };
  }

  // /share <widget_id>: send shared widget copy
  if (command === '/share') {
    const widgetId = argText ? argText.trim().split(/\s+/)[0] : '';
    if (!widgetId) {
      await api.sendMessage({
        chat_id: message.chat.id,
        text: 'Usage: /share <widget_id>',
      });
      return { handled: true, command: '/share', error: 'MISSING_WIDGET_ID' };
    }

    const row = await getSharedWidgetById(widgetId);
    if (!row) {
      await api.sendMessage({
        chat_id: message.chat.id,
        text: `Shared widget "${widgetId}" not found.`,
      });
      return { handled: true, command: '/share', error: 'NOT_FOUND' };
    }

    const def = getWidgetDefinition(row.type);
    if (!def) {
      await api.sendMessage({
        chat_id: message.chat.id,
        text: `Widget definition for "${row.type}" not found.`,
      });
      return { handled: true, command: '/share', error: 'UNKNOWN_TYPE' };
    }

    await sendSharedWidgetMessage(def, {
      chatId: message.chat.id,
      widgetId: row.widgetId,
    });
    return { handled: true, command: '/share', widgetId: row.widgetId, type: def.type };
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
