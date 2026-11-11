import { EndpointError } from 'sdk';
import { listWidgetDefinitions } from '../lib/widgets/registry/index.js';
import { listRecentSharedWidgets } from '../lib/widgets/index.js';

export default async function (input, ctx) {
  const user = ctx?.initData?.user;
  if (!user) {
    throw new EndpointError('Unauthorized', { code: 'UNAUTHORIZED' });
  }

  const definitions = listWidgetDefinitions().map((def) => ({
    type: def.type,
    command: def.command,
    title: def.title,
    description: def.description,
    isShared: Boolean(def.isShared),
    allowQueries: Boolean(def.allowQueries),
    cacheTime: def.cacheTime ?? null,
    width: def.width ?? 0,
    height: def.height ?? 0,
  }));

  const sharedWidgets = await listRecentSharedWidgets({ limit: 20 });

  return {
    definitions,
    sharedWidgets,
  };
}
