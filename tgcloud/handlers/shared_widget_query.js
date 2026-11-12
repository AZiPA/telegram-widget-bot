import { resolveAndDispatchWidgetQuery } from '../lib/widgets/registry/index.js';

export default async function (sharedWidgetQuery) {
  return await resolveAndDispatchWidgetQuery(sharedWidgetQuery, { isSharedCopy: true });
}
