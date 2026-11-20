/**
 * Widget Query Router & Update Bridge
 *
 * NOTE: While @tgcloud/cli 0.2.0 only supports the 26 Bot API 10.3 handler
 * filenames, message.js and callback_query.js call tryInterceptWidgetUpdate(ctx).
 * Once @tgcloud/cli adds widget_query and shared_widget_query to handlers/,
 * tgcloud/handlers/widget_query.js and tgcloud/handlers/shared_widget_query.js
 * can directly export routeWidgetQueryUpdate.
 */

import { resolveAndDispatchWidgetQuery } from '../widgets/registry/index.js';

/**
 * Routes a widget query or shared widget query payload to the appropriate widget handler.
 *
 * @param {object} query - The widget_query or shared_widget_query object
 * @param {object} [options]
 * @param {boolean} [options.isSharedCopy=false] - Whether this query is on a shared copy
 * @returns {Promise<*>} Result from widget handler dispatch
 */
export async function routeWidgetQueryUpdate(query, { isSharedCopy = false } = {}) {
  return await resolveAndDispatchWidgetQuery(query, { isSharedCopy });
}

/**
 * Intercepts incoming updates for widget_query or shared_widget_query payloads.
 *
 * @param {object} ctx - Update context containing update object
 * @returns {Promise<{ intercepted: boolean, result?: * }>}
 */
export async function tryInterceptWidgetUpdate(ctx) {
  if (ctx?.update?.widget_query) {
    const result = await routeWidgetQueryUpdate(ctx.update.widget_query, { isSharedCopy: false });
    return { intercepted: true, result };
  }

  if (ctx?.update?.shared_widget_query) {
    const result = await routeWidgetQueryUpdate(ctx.update.shared_widget_query, { isSharedCopy: true });
    return { intercepted: true, result };
  }

  return { intercepted: false };
}
