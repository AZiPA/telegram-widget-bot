import { api, BotApiError } from 'sdk';
import { WIDGET_CONFIG } from '../widgets/config.js';
import { sendWidgetMessage } from '../widgets/index.js';
import {
  getWidgetByCommand,
  getWidgetDefinition,
  listWidgetDefinitions,
} from '../widgets/registry/index.js';
import { tryInterceptWidgetUpdate } from './widget-query-router.js';
import { handleShareCommand } from '../commands/share.js';
import { handleHtmlDocumentUpload } from '../commands/upload-widget.js';

/**
 * Routes message updates and parses bot commands or widget queries.
 *
 * @param {object} message - Telegram Message object (or undefined)
 * @param {object} ctx - Context object containing full update
 * @returns {Promise<object>} Handled status and metadata
 */
export async function routeMessageUpdate(message, ctx) {
  const intercepted = await tryInterceptWidgetUpdate(ctx);
  if (intercepted.intercepted) {
    return intercepted.result;
  }

  if (message?.document) {
    const uploadRes = await handleHtmlDocumentUpload(message);
    if (uploadRes?.handled) {
      return uploadRes;
    }
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
    const targetType = argText.replace(/^launch_/i, '').trim().toLowerCase();
    const def = getWidgetDefinition(targetType);
    if (def) {
      if (message.chat.type !== 'private' && !WIDGET_CONFIG.ALLOW_GROUP_WIDGETS) {
        await api.sendMessage({
          chat_id: message.chat.id,
          text: 'Interactive widgets can only be launched in private chats. Please open a private chat with the bot and send /start.',
        });
        return { handled: true, chatRestricted: true };
      }

      try {
        await sendWidgetMessage(def, {
          chatId: message.chat.id,
          chatType: message.chat.type,
          params: {},
          createdBy: message.from?.id ?? null,
        });
      } catch (err) {
        if (err instanceof BotApiError || err?.name === 'BotApiError') {
          console.warn(`[command-router] BotApiError ${err.code} sending deep-linked widget: ${err.description || err.message}`);
        } else {
          console.error('[command-router] Error sending deep-linked widget:', err);
        }
      }
      return { handled: true, command: '/start', deepLink: targetType };
    }
  }

  if (command === '/start' || command === '/help') {
    const commandLines = listWidgetDefinitions().map((def) => {
      const cmd = def.command.startsWith('/') ? def.command : `/${def.command}`;
      return `${cmd} - ${def.title}${def.description ? ' (' + def.description + ')' : ''}`;
    });
    commandLines.push('/share - Launch widgets menu');
    commandLines.push('/help - Show this help message');

    const text = [
      '⚡ Telegram Serverless Widget Engine',
      '',
      'Available commands:',
      ...commandLines,
      '',
      '📄 Send any .html file in this chat to validate & launch it as a live widget!',
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

  // Registered widget command (/timer, /poll, /duel, etc.)
  const def = getWidgetByCommand(command);
  if (def) {
    if (message.chat.type !== 'private' && !WIDGET_CONFIG.ALLOW_GROUP_WIDGETS) {
      await api.sendMessage({
        chat_id: message.chat.id,
        text: 'Interactive widgets can only be launched in private chats. Please open a private chat with the bot and send /start.',
      });
      return { handled: true, chatRestricted: true };
    }

    const params = typeof def.parseParams === 'function' ? def.parseParams(argText) : {};
    try {
      await sendWidgetMessage(def, {
        chatId: message.chat.id,
        chatType: message.chat.type,
        params,
        createdBy: message.from?.id ?? null,
      });
    } catch (err) {
      if (err instanceof BotApiError || err?.name === 'BotApiError') {
        console.warn(`[command-router] BotApiError ${err.code} sending widget: ${err.description || err.message}`);
      } else {
        console.error('[command-router] Error sending widget:', err);
      }
    }
    return { handled: true, type: def.type };
  }

  return { handled: false };
}
