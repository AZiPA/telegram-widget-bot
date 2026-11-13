import { EndpointError } from 'sdk';
import { WIDGET_CONFIG } from '../lib/widgets/config.js';
import { resolveAndDispatchWidgetQuery } from '../lib/widgets/registry/index.js';

export default async function (input, ctx) {
  const user = ctx?.initData?.user;
  if (!user) {
    throw new EndpointError('Unauthorized', { code: 'UNAUTHORIZED' });
  }

  if (!input?.query || typeof input.query !== 'object') {
    throw new EndpointError('Missing widget query payload', { code: 'INVALID_QUERY' });
  }

  const sanitizedQuery = {
    ...input.query,
    from: user,
  };

  if (!WIDGET_CONFIG.ALLOW_SHARED_WIDGETS) {
    delete sanitizedQuery.widget_id;
    if (sanitizedQuery.message && typeof sanitizedQuery.message === 'object') {
      sanitizedQuery.message = { ...sanitizedQuery.message, widget: null };
    }
  }

  const isSharedCopy = WIDGET_CONFIG.ALLOW_SHARED_WIDGETS ? Boolean(input.isSharedCopy) : false;

  const result = await resolveAndDispatchWidgetQuery(sanitizedQuery, {
    isSharedCopy,
  });

  return {
    result,
  };
}
