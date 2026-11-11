import { routeCallbackQueryUpdate } from '../lib/router/callback-router.js';

export default async function (callbackQuery, ctx) {
  return await routeCallbackQueryUpdate(callbackQuery, ctx);
}
