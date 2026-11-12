import {
  parseTimerParams,
  defaultCaption,
  createInitialPublicData,
  createInitialChatData,
} from './state.js';
import { renderHtml } from './template.js';
import { onWidgetQuery, onSharedWidgetQuery } from './actions.js';

export default {
  type: 'timer',
  command: '/timer',
  title: 'Stopwatch',
  description: 'Hybrid analog & digital chronograph with split laps',
  isShared: false,
  allowQueries: false,
  cacheTime: 30,
  width: 0,
  height: 0,
  parseParams: parseTimerParams,
  defaultCaption,
  createInitialPublicData,
  createInitialChatData,
  renderHtml,
  onWidgetQuery,
  onSharedWidgetQuery,
};

export {
  parseTimerParams,
  defaultCaption,
  createInitialPublicData,
  createInitialChatData,
  renderHtml,
  onWidgetQuery,
  onSharedWidgetQuery,
};
