import { resolveAndDispatchWidgetQuery } from '../lib/widgets/registry/index.js';

export default async function (widgetQuery) {
  return await resolveAndDispatchWidgetQuery(widgetQuery, { isSharedCopy: false });
}
