import { api, BotApiError } from 'sdk';
import { WIDGET_CONFIG } from '../widgets/config.js';
import { inspectCustomWidgetHtml } from '../widgets/core/html-inspector.js';
import { serializeStateData } from '../widgets/core/validators.js';
import { escapeHtmlText } from '../widgets/template-utils.js';

/**
 * Handles incoming custom .html document uploads from users in private chats,
 * validates against Telegram Widget Profile 1 rules and size budgets, minifies,
 * and launches it live via api.sendWidget (with is_shared: false).
 *
 * @param {object} message - Telegram message object
 * @returns {Promise<object>} Handled result
 */
export async function handleHtmlDocumentUpload(message) {
  if (!WIDGET_CONFIG.ALLOW_CUSTOM_HTML_UPLOAD) {
    return { handled: false };
  }

  const doc = message?.document;
  if (!doc) {
    return { handled: false };
  }

  const fileName = (doc.file_name || '').toLowerCase();
  const mimeType = (doc.mime_type || '').toLowerCase();
  const isHtml = fileName.endsWith('.html') || fileName.endsWith('.htm') || mimeType.includes('text/html');
  if (!isHtml) {
    return { handled: false };
  }

  // Verify private chat
  if (message?.chat?.type !== 'private') {
    await api.sendMessage({
      chat_id: message.chat.id,
      text: '⚠️ Custom widget HTML uploads are only supported in private chats with the bot. Please send your .html file directly here in a private chat!',
      reply_to_message_id: message.message_id,
    });
    return { handled: true, chatRestricted: true };
  }

  // Admin access control if configured
  if (Array.isArray(WIDGET_CONFIG.CUSTOM_UPLOAD_ADMIN_IDS) && WIDGET_CONFIG.CUSTOM_UPLOAD_ADMIN_IDS.length > 0) {
    const senderId = message.from?.id;
    if (!WIDGET_CONFIG.CUSTOM_UPLOAD_ADMIN_IDS.includes(senderId)) {
      await api.sendMessage({
        chat_id: message.chat.id,
        text: '⛔ Custom HTML upload is restricted to authorized bot administrators.',
        reply_to_message_id: message.message_id,
      });
      return { handled: true, unauthorized: true };
    }
  }

  // File size pre-download cap
  if (typeof doc.file_size === 'number' && doc.file_size > WIDGET_CONFIG.MAX_UPLOAD_FILE_BYTES) {
    await api.sendMessage({
      chat_id: message.chat.id,
      text: `❌ File is too large (${doc.file_size.toLocaleString()} bytes > ${WIDGET_CONFIG.MAX_UPLOAD_FILE_BYTES.toLocaleString()} bytes / 64 KB max limit).`,
      reply_to_message_id: message.message_id,
    });
    return { handled: true, error: 'FILE_TOO_LARGE' };
  }

  // Download file content bytes
  let bytes;
  try {
    bytes = await api.getFileContent(doc.file_id);
  } catch (err) {
    console.error('[UploadWidget] Error downloading file:', err);
    await api.sendMessage({
      chat_id: message.chat.id,
      text: `❌ Failed to download uploaded document: ${err?.description || err?.message || 'Download error'}`,
      reply_to_message_id: message.message_id,
    });
    return { handled: true, error: 'DOWNLOAD_FAILED' };
  }

  // Strictly decode as UTF-8
  let rawText;
  try {
    rawText = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    await api.sendMessage({
      chat_id: message.chat.id,
      text: '❌ The uploaded file is not valid UTF-8 text. Please make sure the file is saved with standard UTF-8 encoding.',
      reply_to_message_id: message.message_id,
    });
    return { handled: true, error: 'INVALID_UTF8' };
  }

  // Inspect HTML against Profile 1
  const report = await inspectCustomWidgetHtml(rawText);

  // Parse caption directives (--strict, width=360, height=480, queries=off) and merge with report.meta
  const captionStr = (message.caption || '').trim();
  let strictMode = Boolean(report.meta.strict);
  let mergedWidth = report.meta.width !== undefined ? Number(report.meta.width) : 0;
  let mergedHeight = report.meta.height !== undefined ? Number(report.meta.height) : 0;
  let mergedAllowQueries = report.meta.allowQueries !== undefined ? Boolean(report.meta.allowQueries) : true;
  let mergedCaption = report.meta.caption || null;
  const mergedChatData = report.meta.chatData !== undefined ? report.meta.chatData : null;
  const mergedPublicData = report.meta.publicData !== undefined ? report.meta.publicData : null;

  if (captionStr) {
    if (/(?:^|\s)--strict\b/i.test(captionStr)) {
      strictMode = true;
    }
    const widthMatch = captionStr.match(/\bwidth=(\d+)\b/i);
    if (widthMatch) {
      mergedWidth = parseInt(widthMatch[1], 10);
    }
    const heightMatch = captionStr.match(/\bheight=(\d+)\b/i);
    if (heightMatch) {
      mergedHeight = parseInt(heightMatch[1], 10);
    }
    const queriesMatch = captionStr.match(/\bqueries=(off|false|0|on|true|1)\b/i);
    if (queriesMatch) {
      const qVal = queriesMatch[1].toLowerCase();
      mergedAllowQueries = !(qVal === 'off' || qVal === 'false' || qVal === '0');
    }
    const cleanUserCaption = captionStr
      .replace(/(?:^|\s)--strict\b/gi, '')
      .replace(/\bwidth=\d+\b/gi, '')
      .replace(/\bheight=\d+\b/gi, '')
      .replace(/\bqueries=(?:off|false|0|on|true|1)\b/gi, '')
      .trim();
    if (cleanUserCaption) {
      mergedCaption = cleanUserCaption;
    }
  }

  // Check validation status
  if (!report.valid || (strictMode && report.warnings.length > 0)) {
    const lines = [];
    lines.push('❌ <b>Widget Profile 1 Validation Failed</b>\n');
    lines.push(`📊 <b>Size:</b> ${escapeHtmlText(report.rawBytes.toLocaleString())} B raw (limit: 32,768 B)`);
    if (report.compressedEstimate.exact && report.compressedEstimate.bytes !== null) {
      lines.push(`📦 <b>Estimated Compressed Size:</b> ${escapeHtmlText(report.compressedEstimate.bytes.toLocaleString())} B (limit: 4,096 B)`);
    }

    if (report.errors.length > 0) {
      lines.push('\n🚫 <b>Blocking Errors:</b>');
      for (const e of report.errors) {
        lines.push(`• ${escapeHtmlText(e)}`);
      }
    }

    if (report.warnings.length > 0) {
      lines.push(`\n⚠️ <b>Profile 1 Warnings${strictMode ? ' (Strict Mode)' : ''}:</b>`);
      for (const w of report.warnings) {
        lines.push(`• ${escapeHtmlText(w)}`);
      }
    }

    await api.sendMessage({
      chat_id: message.chat.id,
      text: lines.join('\n'),
      parse_mode: 'HTML',
      reply_to_message_id: message.message_id,
    });

    return {
      handled: true,
      valid: false,
      errors: report.errors,
      warnings: report.warnings,
    };
  }

  const finalCaption = mergedCaption || `🧩 ${doc.file_name || 'Custom Widget'} (${report.rawBytes}B)`;

  const sendPayload = {
    chat_id: message.chat.id,
    html: report.minifiedHtml,
    width: Number(mergedWidth) || 0,
    height: Number(mergedHeight) || 0,
    allow_queries: mergedAllowQueries,
    is_shared: false, // STRICTLY false so no widget_id is ever created or exposed
    caption: finalCaption,
    reply_to_message_id: message.message_id,
  };

  if (mergedChatData !== null && mergedChatData !== undefined) {
    sendPayload.chat_data = serializeStateData(mergedChatData);
  }
  if (mergedPublicData !== null && mergedPublicData !== undefined) {
    sendPayload.public_data = serializeStateData(mergedPublicData);
  }

  let sentMsg;
  try {
    sentMsg = await api.sendWidget(sendPayload);
  } catch (err) {
    const isBotApiError = err instanceof BotApiError || err?.name === 'BotApiError' || err?.code !== undefined;
    const desc = err?.description || err?.message || 'Telegram Bot API error';
    const code = err?.code || 400;

    console.warn(`[UploadWidget] BotApiError ${code} sending custom widget: ${desc}`);

    let sizeStats = `Raw: ${report.rawBytes}B`;
    if (report.compressedEstimate.exact && report.compressedEstimate.bytes !== null) {
      sizeStats += `, Est. Compressed: ${report.compressedEstimate.bytes}B`;
    }

    await api.sendMessage({
      chat_id: message.chat.id,
      text: `❌ Telegram Bot API rejected the widget (${code}):\n${desc}\n\n📊 Size stats: ${sizeStats}`,
      reply_to_message_id: message.message_id,
    });

    return { handled: true, valid: false, error: desc };
  }

  // Follow-up warnings message if any non-blocking warnings exist in non-strict mode
  if (report.warnings.length > 0) {
    const warnLines = [
      '⚠️ <b>Widget Profile 1 Warnings</b>',
      'The following features are outside Telegram Widget Profile 1 and may be stripped or degraded on Telegram clients:',
      ...report.warnings.map((w) => `• ${escapeHtmlText(w)}`),
    ];
    try {
      await api.sendMessage({
        chat_id: message.chat.id,
        text: warnLines.join('\n'),
        parse_mode: 'HTML',
        reply_to_message_id: sentMsg?.message_id || message.message_id,
      });
    } catch (warnErr) {
      console.warn('[UploadWidget] Failed to send warnings follow-up:', warnErr?.message ?? warnErr);
    }
  }

  return { handled: true, valid: true, messageId: sentMsg?.message_id };
}
