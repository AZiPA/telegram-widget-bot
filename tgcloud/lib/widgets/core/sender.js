import { api } from 'sdk';
import { assertValidWidgetHtml, serializeStateData } from './validators.js';
import { upsertSharedWidget, insertWidgetInstance } from './repository.js';

/**
 * Orchestrates sending a new widget message and persisting records.
 * @param {object} def
 * @param {object} options
 * @returns {Promise<{ message: object, widgetId: string|null, instance: object }>}
 */
export async function sendWidgetMessage(def, {
  chatId,
  params = {},
  caption,
  showCaptionAboveMedia,
  replyMarkup,
  createdBy = null,
}) {
  const html = def.renderHtml(params);
  assertValidWidgetHtml(html);

  const revision = 1;
  let chatDataObj = def.createInitialChatData ? def.createInitialChatData(params, { revision }) : null;
  if (chatDataObj && typeof chatDataObj === 'object') {
    chatDataObj.r = revision;
  }

  let publicDataObj = def.createInitialPublicData ? def.createInitialPublicData(params, { revision }) : null;
  if (publicDataObj && typeof publicDataObj === 'object') {
    publicDataObj.r = revision;
  }

  const initialCaption = caption ?? (typeof def.defaultCaption === 'function' ? def.defaultCaption(params) : (def.defaultCaption || ''));
  const defaultReplyMarkup = def.isShared
    ? { inline_keyboard: [[{ text: '📤 Share to Chat', switch_inline_query: '' }]] }
    : undefined;

  const sendParams = {
    chat_id: chatId,
    html,
    width: def.width ?? 0,
    height: def.height ?? 0,
    caption: initialCaption,
    ...(showCaptionAboveMedia !== undefined ? { show_caption_above_media: showCaptionAboveMedia } : {}),
    allow_queries: Boolean(def.allowQueries),
    is_shared: Boolean(def.isShared),
    ...(chatDataObj !== null && chatDataObj !== undefined ? { chat_data: serializeStateData(chatDataObj) } : {}),
    ...(publicDataObj !== null && publicDataObj !== undefined ? { public_data: serializeStateData(publicDataObj) } : {}),
    ...(replyMarkup || defaultReplyMarkup ? { reply_markup: replyMarkup ?? defaultReplyMarkup } : {}),
  };

  const message = await api.sendWidget(sendParams);
  const widgetId = message?.widget?.id ? String(message.widget.id) : null;

  if (def.isShared && widgetId) {
    await upsertSharedWidget({
      widgetId,
      type: def.type,
      publicData: publicDataObj,
      revision,
      cacheTime: def.cacheTime ?? 30,
      allowQueries: Boolean(def.allowQueries),
      createdBy,
    });
  }

  const instance = await insertWidgetInstance({
    type: def.type,
    chatId: message.chat?.id ?? chatId,
    messageId: message.message_id,
    widgetId,
    isShared: Boolean(def.isShared),
    allowQueries: Boolean(def.allowQueries),
    chatData: chatDataObj,
    publicData: publicDataObj,
    revision,
  });

  return { message, widgetId, instance };
}

/**
 * Orchestrates sending an existing shared widget message and recording the carrier instance.
 * @param {object} def
 * @param {object} options
 * @returns {Promise<{ message: object, widgetId: string, instance: object }>}
 */
export async function sendSharedWidgetMessage(def, {
  chatId,
  widgetId,
  params = {},
  caption,
  showCaptionAboveMedia,
  replyMarkup,
}) {
  const revision = 1;
  let chatDataObj = def.createInitialChatData ? def.createInitialChatData(params, { revision }) : null;
  if (chatDataObj && typeof chatDataObj === 'object') {
    chatDataObj.r = revision;
  }

  const resolvedCaption = caption ?? (typeof def.defaultCaption === 'function' ? def.defaultCaption(params) : (def.defaultCaption || ''));
  const defaultReplyMarkup = {
    inline_keyboard: [[{ text: '📤 Share to Chat', switch_inline_query: '' }]],
  };

  const sendParams = {
    chat_id: chatId,
    widget_id: String(widgetId),
    ...(chatDataObj !== null && chatDataObj !== undefined ? { chat_data: serializeStateData(chatDataObj) } : {}),
    caption: resolvedCaption,
    ...(showCaptionAboveMedia !== undefined ? { show_caption_above_media: showCaptionAboveMedia } : {}),
    ...(replyMarkup || defaultReplyMarkup ? { reply_markup: replyMarkup ?? defaultReplyMarkup } : {}),
  };

  const message = await api.sendSharedWidget(sendParams);

  const instance = await insertWidgetInstance({
    type: def.type,
    chatId: message.chat?.id ?? chatId,
    messageId: message.message_id,
    widgetId: String(widgetId),
    isShared: true,
    allowQueries: Boolean(def.allowQueries),
    chatData: chatDataObj,
    publicData: null,
    revision,
  });

  return { message, widgetId: String(widgetId), instance };
}
