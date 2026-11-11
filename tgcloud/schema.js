import { table, integer, text, boolean, json, index, uniqueIndex, sql } from 'sdk/db';

export const sharedWidgets = table('shared_widgets', {
  widgetId: text('widget_id').primaryKey(),
  type: text('type').notNull(),
  publicData: json('public_data'),
  revision: integer('revision').notNull().default(1),
  cacheTime: integer('cache_time').notNull().default(30),
  allowQueries: boolean('allow_queries').notNull().default(false),
  createdBy: integer('created_by'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  typeIdx: index('idx_shared_widgets_type').on(t.type),
}));

export const widgetInstances = table('widget_instances', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(),
  chatId: integer('chat_id'),
  messageId: integer('message_id'),
  inlineMessageId: text('inline_message_id'),
  widgetId: text('widget_id'),
  isShared: boolean('is_shared').notNull().default(false),
  allowQueries: boolean('allow_queries').notNull().default(true),
  chatData: json('chat_data'),
  publicData: json('public_data'),
  revision: integer('revision').notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  chatMsgIdx: uniqueIndex('uidx_widget_chat_msg').on(t.chatId, t.messageId),
  inlineMsgIdx: uniqueIndex('uidx_widget_inline_msg').on(t.inlineMessageId),
  widgetIdIdx: index('idx_widget_instances_wid').on(t.widgetId),
}));
