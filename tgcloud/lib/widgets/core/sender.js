import { api, BotApiError } from 'sdk';
import { WIDGET_CONFIG } from '../config.js';
import { assertValidWidgetHtml, serializeStateData } from './validators.js';
import {
  upsertSharedWidget,
  insertWidgetInstance,
  pruneExpiredWidgetInstances,
} from './repository.js';

export async function sendWidgetMessage(def, {
  chatId,
  chatType = 'private',
  params = {},
  caption,
  showCaptionAboveMedia,
  replyMarkup,
  createdBy = null,
}) {
  if (!WIDGET_CONFIG.ALLOW_GROUP_WIDGETS && chatType && chatType !== 'private') {
    throw new Error('WIDGET_PRIVATE_CHAT_ONLY: Widgets can currently only be sent in a private chat with the bot');
  }

  const html = def.renderHtml(params);
  assertValidWidgetHtml(html);

  const revision = 1;
  const chatDataObj = typeof def.createInitialChatData === 'function'
    ? def.createInitialChatData(params, { revision })
    : null;
  if (chatDataObj && typeof chatDataObj === 'object') {
    chatDataObj.r = revision;
  }

  const publicDataObj = typeof def.createInitialPublicData === 'function'
    ? def.createInitialPublicData(params, { revision })
    : null;
  if (publicDataObj && typeof publicDataObj === 'object') {
    publicDataObj.r = revision;
  }

  const effectiveIsShared = Boolean(WIDGET_CONFIG.ALLOW_SHARED_WIDGETS && def.isShared);

  const sendPayload = {
    chat_id: chatId,
    html,
    width: def.width ?? 0,
    height: def.height ?? 0,
    caption: caption ?? (typeof def.defaultCaption === 'function' ? def.defaultCaption(params) : (def.defaultCaption || '')),
    allow_queries: Boolean(def.allowQueries),
    is_shared: effectiveIsShared,
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
  if (replyMarkup) {
    sendPayload.reply_markup = replyMarkup;
  }

  const message = await api.sendWidget(sendPayload);
  const rawWid = message?.widget?.id;
  const widgetId = rawWid !== undefined && rawWid !== null ? String(rawWid) : null;

  if (effectiveIsShared && widgetId) {
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

  // Skip DB Bloat for Offline Personal Widgets
  if (!def.allowQueries && !effectiveIsShared) {
    return { message, instance: null };
  }

  await pruneExpiredWidgetInstances(WIDGET_CONFIG.INSTANCE_TTL_SECONDS);

  const instance = await insertWidgetInstance({
    type: def.type,
    chatId: message?.chat?.id ?? chatId,
    messageId: message.message_id,
    widgetId: effectiveIsShared ? widgetId : null,
    isShared: effectiveIsShared,
    allowQueries: Boolean(def.allowQueries),
    chatData: chatDataObj,
    publicData: publicDataObj,
    revision,
  });

  const result = { message, instance };
  if (effectiveIsShared && widgetId) {
    result.widgetId = widgetId;
  }
  return result;
}

export async function sendSharedWidgetMessage(def, {
  chatId,
  chatType = 'private',
  widgetId,
  params = {},
  caption,
  showCaptionAboveMedia,
  replyMarkup,
}) {
  if (!WIDGET_CONFIG.ALLOW_GROUP_WIDGETS && chatType && chatType !== 'private') {
    throw new Error('WIDGET_PRIVATE_CHAT_ONLY: Widgets can currently only be sent in a private chat with the bot');
  }

  const revision = 1;
  const chatDataObj = typeof def.createInitialChatData === 'function'
    ? def.createInitialChatData(params, { revision })
    : null;
  if (chatDataObj && typeof chatDataObj === 'object') chatDataObj.r = revision;

  const sendPayload = {
    chat_id: chatId,
    widget_id: String(widgetId),
    caption: caption ?? (typeof def.defaultCaption === 'function' ? def.defaultCaption(params) : (def.defaultCaption || '')),
  };

  if (showCaptionAboveMedia !== undefined) {
    sendPayload.show_caption_above_media = Boolean(showCaptionAboveMedia);
  }
  if (chatDataObj !== null && chatDataObj !== undefined) {
    sendPayload.chat_data = serializeStateData(chatDataObj);
  }
  if (replyMarkup) {
    sendPayload.reply_markup = replyMarkup;
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
