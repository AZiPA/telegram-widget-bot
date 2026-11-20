import {
  parseDuelParams,
  defaultCaption,
  createInitialChatData,
  createInitialPublicData,
  applyDuelMove,
} from './state.js';
import { renderHtml } from './template.js';

export async function onWidgetQuery(params) {
  const { onWidgetQuery: fn } = await import('./actions.js');
  return await fn(params);
}

const duelWidget = {
  type: 'duel',
  command: '/duel',
  title: 'Tap Duel',
  icon: '⚔️',
  launchLabel: 'Launch Tap Duel',
  order: 30,
  description: 'Play a real-time tap duel game',
  isShared: false,
  allowQueries: true,
  width: 0,
  height: 0,
  parseParams: parseDuelParams,
  defaultCaption,
  createInitialChatData,
  createInitialPublicData,
  renderHtml,
  onWidgetQuery,
};

export {
  parseDuelParams,
  defaultCaption,
  createInitialChatData,
  createInitialPublicData,
  applyDuelMove,
  renderHtml,
};

export default duelWidget;
