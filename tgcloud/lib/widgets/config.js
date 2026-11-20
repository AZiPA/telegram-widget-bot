export const WIDGET_CONFIG = Object.freeze({
  // In Bot API 10.4 production, widgets only work in private chats with the bot
  // and cannot be forwarded or sent inline. Flip these flags when Telegram unlocks them.
  ALLOW_SHARED_WIDGETS: false,
  ALLOW_GROUP_WIDGETS: false,
  ALLOW_INLINE_WIDGETS: false,
  INSTANCE_TTL_SECONDS: 7 * 24 * 60 * 60, // 7 days TTL for SQLite page recycling
  ALLOW_CUSTOM_HTML_UPLOAD: true,
  MAX_UPLOAD_FILE_BYTES: 65536, // 64 KB pre-download cap to protect V8 isolate 3s CPU timer
  CUSTOM_UPLOAD_ADMIN_IDS: [],  // Empty array = allowed for all users in private chat; if populated, only listed Telegram user IDs can upload .html files
});
