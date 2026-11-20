export { WIDGET_CONFIG } from './config.js';

export {
  utf8ByteLength,
  assertValidWidgetHtml,
  serializeStateData,
  serializeQueryResult,
  parseQueryData,
} from './core/validators.js';

export {
  extractWidgetMetaComment,
  stripOptionalDocumentShell,
  estimateCompressedSize,
  inspectCustomWidgetHtml,
} from './core/html-inspector.js';

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
  pruneExpiredWidgetInstances,
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

import { WIDGET_CONFIG } from './config.js';

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
  pruneExpiredWidgetInstances,
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
  WIDGET_CONFIG,
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
  pruneExpiredWidgetInstances,
  sendWidgetMessage,
  sendSharedWidgetMessage,
  updateMessageWidgetState,
  updateSharedWidgetState,
  safeAnswerWidgetQuery,
};
