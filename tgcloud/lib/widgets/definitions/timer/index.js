import {
  parseTimerParams,
  defaultCaption,
  createInitialPublicData,
  createInitialChatData,
} from './state.js';
import { renderHtml } from './template.js';

export default {
  type: 'timer',
  command: '/timer',
  icon: '⏱️',
  title: 'Stopwatch',
  launchLabel: 'Launch Stopwatch',
  order: 10,
  description: 'Personal hybrid analog & digital chronograph with split laps',
  isShared: false,
  allowQueries: false,
  width: 0,
  height: 550,
  parseParams: parseTimerParams,
  defaultCaption,
  createInitialPublicData,
  createInitialChatData,
  renderHtml,
};

export {
  parseTimerParams,
  defaultCaption,
  createInitialPublicData,
  createInitialChatData,
  renderHtml,
};
