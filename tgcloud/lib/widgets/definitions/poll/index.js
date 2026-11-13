import {
  parsePollParams,
  defaultCaption,
  createInitialPublicData,
  createInitialChatData,
} from './state.js';
import { renderHtml } from './template.js';

export async function applyPollVote(params) {
  const { applyPollVote: fn } = await import('./actions.js');
  return await fn(params);
}

export async function onWidgetQuery(params) {
  const { onWidgetQuery: fn } = await import('./actions.js');
  return await fn(params);
}

export async function onSharedWidgetQuery(params) {
  const { onSharedWidgetQuery: fn } = await import('./actions.js');
  return await fn(params);
}

const pollWidget = {
  type: 'poll',
  command: '/poll',
  title: 'Live Shared Poll',
  icon: '📊',
  launchLabel: 'Launch Poll',
  order: 20,
  description: 'Create a real-time shared poll widget',
  isShared: true,
  allowQueries: true,
  cacheTime: 15,
  width: 0,
  height: 0,
  parseParams: parsePollParams,
  defaultCaption,
  createInitialPublicData,
  createInitialChatData,
  renderHtml,
  onWidgetQuery,
  onSharedWidgetQuery,
};

export {
  parsePollParams,
  defaultCaption,
  createInitialPublicData,
  createInitialChatData,
  renderHtml,
};

export default pollWidget;
