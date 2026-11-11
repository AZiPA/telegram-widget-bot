import { EndpointError } from 'sdk';
import { resolveAndDispatchWidgetQuery } from '../lib/widgets/registry/index.js';

export default async function (input, ctx) {
  const user = ctx?.initData?.user;
  if (!user) {
    throw new EndpointError('Unauthorized', { code: 'UNAUTHORIZED' });
  }

  if (!input?.query) {
    throw new EndpointError('Missing widget query payload', { code: 'INVALID_QUERY' });
  }

  const result = await resolveAndDispatchWidgetQuery(input.query, {
    isSharedCopy: Boolean(input.isSharedCopy),
  });

  return {
    result,
  };
}
