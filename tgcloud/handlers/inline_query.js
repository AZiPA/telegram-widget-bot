import { routeInlineQueryUpdate } from '../lib/router/inline-router.js';

export default async function (inlineQuery, ctx) {
  return await routeInlineQueryUpdate(inlineQuery, ctx);
}
