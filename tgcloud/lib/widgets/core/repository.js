import { db } from 'sdk';
import { eq, and, desc, sql, lt } from 'sdk/db';
import { sharedWidgets, widgetInstances } from '../../../schema.js';

/**
 * Inserts or updates a shared widget record in sharedWidgets.
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function upsertSharedWidget({
  widgetId,
  type,
  publicData,
  revision = 1,
  cacheTime = 30,
  allowQueries = false,
  createdBy = null,
}) {
  const values = {
    widgetId,
    type,
    publicData,
    revision,
    cacheTime,
    allowQueries: Boolean(allowQueries),
    createdBy: createdBy ?? null,
  };

  const res = await db.insert(sharedWidgets).values(values).onConflictDoUpdate({
    target: sharedWidgets.widgetId,
    set: {
      type,
      publicData,
      revision,
      cacheTime,
      allowQueries: Boolean(allowQueries),
      updatedAt: sql`(unixepoch())`,
    },
  }).returning().run();

  return (Array.isArray(res) ? res[0] : (res?.rows?.[0] ?? res)) || values;
}

/**
 * Retrieves a shared widget by its widget ID.
 * @param {string} widgetId
 * @returns {Promise<object|null>}
 */
export async function getSharedWidgetById(widgetId) {
  return await db.select().from(sharedWidgets).where(eq(sharedWidgets.widgetId, widgetId)).get();
}

/**
 * Retrieves the most recently updated shared widget by type.
 * @param {string} type
 * @returns {Promise<object|null>}
 */
export async function getLatestSharedWidgetByType(type) {
  return await db.select()
    .from(sharedWidgets)
    .where(eq(sharedWidgets.type, type))
    .orderBy(desc(sharedWidgets.updatedAt))
    .limit(1)
    .get();
}

/**
 * Deletes shared widgets, optionally filtered by type.
 * @param {string|null} [type=null]
 * @returns {Promise<object>}
 */
export async function clearSharedWidgets(type = null) {
  if (type) {
    return await db.delete(sharedWidgets).where(eq(sharedWidgets.type, type)).run();
  }
  return await db.delete(sharedWidgets).run();
}

/**
 * Alias for clearSharedWidgets(type).
 * @param {string} type
 * @returns {Promise<object>}
 */
export async function deleteSharedWidgetsByType(type) {
  return await clearSharedWidgets(type);
}

/**
 * Lists recent shared widgets, optionally filtered by type.
 * @param {object} [options]
 * @returns {Promise<Array<object>>}
 */
export async function listRecentSharedWidgets({ type, limit = 20 } = {}) {
  let query = db.select().from(sharedWidgets);
  if (type) {
    query = query.where(eq(sharedWidgets.type, type));
  }
  return await query.orderBy(desc(sharedWidgets.createdAt)).limit(limit).all();
}

/**
 * Updates mutable fields of an existing shared widget.
 * @param {string} widgetId
 * @param {object} updates
 * @returns {Promise<object|null>}
 */
export async function updateSharedWidgetRecord(widgetId, { publicData, revision, cacheTime }) {
  const set = {
    updatedAt: sql`(unixepoch())`,
  };
  if (publicData !== undefined) set.publicData = publicData;
  if (revision !== undefined) set.revision = revision;
  if (cacheTime !== undefined) set.cacheTime = cacheTime;

  const res = await db.update(sharedWidgets)
    .set(set)
    .where(eq(sharedWidgets.widgetId, widgetId))
    .returning()
    .run();

  return Array.isArray(res) ? res[0] : (res?.rows?.[0] ?? res);
}

/**
 * Inserts a new widget instance record.
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function insertWidgetInstance({
  type,
  chatId = null,
  messageId = null,
  inlineMessageId = null,
  widgetId = null,
  isShared = false,
  allowQueries = true,
  chatData = null,
  publicData = null,
  revision = 1,
}) {
  const values = {
    type,
    chatId,
    messageId,
    inlineMessageId,
    widgetId,
    isShared: Boolean(isShared),
    allowQueries: Boolean(allowQueries),
    chatData,
    publicData,
    revision,
  };

  const res = await db.insert(widgetInstances).values(values).returning().run();
  return (Array.isArray(res) ? res[0] : (res?.rows?.[0] ?? res)) || values;
}

/**
 * Retrieves a widget instance by message coordinates or inline message ID.
 * @param {object} coords
 * @returns {Promise<object|null>}
 */
export async function getWidgetInstanceByMessage({ chatId, messageId, inlineMessageId }) {
  if (inlineMessageId) {
    return await db.select().from(widgetInstances)
      .where(eq(widgetInstances.inlineMessageId, inlineMessageId))
      .get();
  }
  if (chatId != null && messageId != null) {
    return await db.select().from(widgetInstances)
      .where(and(eq(widgetInstances.chatId, chatId), eq(widgetInstances.messageId, messageId)))
      .get();
  }
  return null;
}

/**
 * Updates mutable state fields of a widget instance by its database row ID.
 * @param {number} id
 * @param {object} updates
 * @returns {Promise<object|null>}
 */
export async function updateWidgetInstanceRecord(id, { chatData, publicData, revision }) {
  const set = {
    updatedAt: sql`(unixepoch())`,
  };
  if (chatData !== undefined) set.chatData = chatData;
  if (publicData !== undefined) set.publicData = publicData;
  if (revision !== undefined) set.revision = revision;

  const res = await db.update(widgetInstances)
    .set(set)
    .where(eq(widgetInstances.id, id))
    .returning()
    .run();

  return Array.isArray(res) ? res[0] : (res?.rows?.[0] ?? res);
}

/**
 * Prunes expired widget instances to keep SQLite lean and recycle freelist pages.
 * @param {number} [ttlSeconds=604800]
 * @returns {Promise<object|null>}
 */
export async function pruneExpiredWidgetInstances(ttlSeconds = 604800) {
  try {
    const cutoff = new Date(Date.now() - ttlSeconds * 1000);
    return await db.delete(widgetInstances).where(lt(widgetInstances.updatedAt, cutoff)).run();
  } catch (err) {
    console.warn('[Repository] pruneExpiredWidgetInstances warning:', err);
    return null;
  }
}
