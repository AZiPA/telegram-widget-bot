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
  title: 'Live Shared Stopwatch',
  description: 'Real-time shared stopwatch with Start, Stop, Resume, Reset, and Split Laps',
  isShared: true,
  allowQueries: true,
  cacheTime: 10,
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
