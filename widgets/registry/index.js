export {
  getWidgetDefinition,
  getWidgetByCommand,
  listWidgetDefinitions,
} from './catalog.js';

export async function resolveAndDispatchWidgetQuery(widgetQuery, options) {
  const { resolveAndDispatchWidgetQuery: dispatch } = await import('./dispatcher.js');
  return await dispatch(widgetQuery, options);
}
