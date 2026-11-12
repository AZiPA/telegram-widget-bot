import { api } from 'sdk';
import { assertValidWidgetHtml, serializeStateData } from './validators.js';
import { upsertSharedWidget, insertWidgetInstance } from './repository.js';

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
  const chatDataObj = def.createInitialChatData
    ? def.createInitialChatData(params, { revision })
    : null;
  if (chatDataObj && typeof chatDataObj === 'object') chatDataObj.r = revision;

  const publicDataObj = def.createInitialPublicData
    ? def.createInitialPublicData(params, { revision })
    : null;
  if (publicDataObj && typeof publicDataObj === 'object') publicDataObj.r = revision;

  const defaultMarkup = def.isShared
    ? { inline_keyboard: [[{ text: '📤 Share to Chat', switch_inline_query: '' }]] }
    : undefined;

  const sendPayload = {
    chat_id: chatId,
    html,
    width: def.width ?? 0,
    height: def.height ?? 0,
    caption: caption ?? (typeof def.defaultCaption === 'function' ? def.defaultCaption(params) : (def.defaultCaption || '')),
    allow_queries: Boolean(def.allowQueries),
    is_shared: Boolean(def.isShared),
  };

  if (showCaptionAboveMedia !== undefined) {
    sendPayload.show_caption_above_media = Boolean(showCaptionAboveMedia);
  }
  if (chatDataObj !== null && chatDataObj !== undefined) {
    sendPayload.chat_data = serializeStateData(chatDataObj);
  }
  if (publicDataObj !== null && publicDataObj !== undefined) {
    sendPayload.public_data = serializeStateData(publicDataObj);
  }
  const finalMarkup = replyMarkup ?? defaultMarkup;
  if (finalMarkup) {
    sendPayload.reply_markup = finalMarkup;
  }

  const message = await api.sendWidget(sendPayload);
  const rawWid = message?.widget?.id;
  const widgetId = rawWid !== undefined && rawWid !== null ? String(rawWid) : null;

  if (def.isShared && widgetId) {
    await upsertSharedWidget({
      widgetId,
      type: def.type,
      publicData: publicDataObj,
      revision,
      cacheTime: def.cacheTime ?? 10,
      allowQueries: Boolean(def.allowQueries),
      createdBy,
    });
  }

  const instance = await insertWidgetInstance({
    type: def.type,
    chatId: message?.chat?.id ?? chatId,
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

export async function sendSharedWidgetMessage(def, {
  chatId,
  widgetId,
  params = {},
  caption,
  showCaptionAboveMedia,
  replyMarkup,
}) {
  const revision = 1;
  const chatDataObj = def.createInitialChatData
    ? def.createInitialChatData(params, { revision })
    : null;
  if (chatDataObj && typeof chatDataObj === 'object') chatDataObj.r = revision;

  const defaultMarkup = {
    inline_keyboard: [[{ text: '📤 Share to Chat', switch_inline_query: '' }]],
  };

  const sendPayload = {
    chat_id: chatId,
    widget_id: String(widgetId),
    caption: caption ?? (typeof def.defaultCaption === 'function' ? def.defaultCaption(params) : (def.defaultCaption || '')),
    reply_markup: replyMarkup ?? defaultMarkup,
  };

  if (showCaptionAboveMedia !== undefined) {
    sendPayload.show_caption_above_media = Boolean(showCaptionAboveMedia);
  }
  if (chatDataObj !== null && chatDataObj !== undefined) {
    sendPayload.chat_data = serializeStateData(chatDataObj);
  }

  const message = await api.sendSharedWidget(sendPayload);
  const instance = await insertWidgetInstance({
    type: def.type,
    chatId: message?.chat?.id ?? chatId,
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
