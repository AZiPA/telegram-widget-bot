import { routeMessageUpdate } from '../lib/router/command-router.js';

export default async function (message, ctx) {
  return await routeMessageUpdate(message, ctx);
}
