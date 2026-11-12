export {
  utf8ByteLength,
  assertValidWidgetHtml,
  serializeStateData,
  serializeQueryResult,
  parseQueryData,
} from './core/validators.js';

export {
  upsertSharedWidget,
  getSharedWidgetById,
  getLatestSharedWidgetByType,
  clearSharedWidgets,
  deleteSharedWidgetsByType,
  listRecentSharedWidgets,
  updateSharedWidgetRecord,
  insertWidgetInstance,
  getWidgetInstanceByMessage,
  updateWidgetInstanceRecord,
} from './core/repository.js';

export {
  sendWidgetMessage,
  sendSharedWidgetMessage,
} from './core/sender.js';

export {
  updateMessageWidgetState,
  updateSharedWidgetState,
} from './core/state-mutator.js';

export {
  safeAnswerWidgetQuery,
} from './core/query-responder.js';

import {
  utf8ByteLength,
  assertValidWidgetHtml,
  serializeStateData,
  serializeQueryResult,
  parseQueryData,
} from './core/validators.js';

import {
  upsertSharedWidget,
  getSharedWidgetById,
  getLatestSharedWidgetByType,
  clearSharedWidgets,
  deleteSharedWidgetsByType,
  listRecentSharedWidgets,
  updateSharedWidgetRecord,
  insertWidgetInstance,
  getWidgetInstanceByMessage,
  updateWidgetInstanceRecord,
} from './core/repository.js';

import {
  sendWidgetMessage,
  sendSharedWidgetMessage,
} from './core/sender.js';

import {
  updateMessageWidgetState,
  updateSharedWidgetState,
} from './core/state-mutator.js';

import {
  safeAnswerWidgetQuery,
} from './core/query-responder.js';

export default {
  utf8ByteLength,
  assertValidWidgetHtml,
  serializeStateData,
  serializeQueryResult,
  parseQueryData,
  upsertSharedWidget,
  getSharedWidgetById,
  getLatestSharedWidgetByType,
  clearSharedWidgets,
  deleteSharedWidgetsByType,
  listRecentSharedWidgets,
  updateSharedWidgetRecord,
  insertWidgetInstance,
  getWidgetInstanceByMessage,
  updateWidgetInstanceRecord,
  sendWidgetMessage,
  sendSharedWidgetMessage,
  updateMessageWidgetState,
  updateSharedWidgetState,
  safeAnswerWidgetQuery,
};
