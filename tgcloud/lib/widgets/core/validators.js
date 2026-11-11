const textEncoder = new TextEncoder();

/**
 * Returns the UTF-8 byte length of a string using TextEncoder.
 * @param {string} str
 * @returns {number}
 */
export function utf8ByteLength(str) {
  if (typeof str !== 'string') {
    str = String(str ?? '');
  }
  return textEncoder.encode(str).byteLength;
}

/**
 * Validates widget HTML: non-empty string, no NUL character (U+0000), <= 32768 UTF-8 bytes.
 * @param {string} html
 * @returns {boolean}
 */
export function assertValidWidgetHtml(html) {
  if (typeof html !== 'string' || html.length === 0) {
    throw new Error('INPUT_MEDIA_WIDGET_HTML_INVALID: HTML must be a non-empty string');
  }
  if (html.includes('\0')) {
    throw new Error('INPUT_MEDIA_WIDGET_HTML_INVALID: HTML contains NUL character (U+0000)');
  }
  const byteLength = utf8ByteLength(html);
  if (byteLength > 32768) {
    throw new Error(`INPUT_MEDIA_WIDGET_TOO_LARGE: HTML byte length (${byteLength}) exceeds 32768 bytes`);
  }
  return true;
}

/**
 * Serializes state data object (chat_data or public_data) to JSON.
 * Verifies no NUL character and byte length <= 1024 bytes.
 * Returns undefined for undefined (or null without allowClear).
 * Returns "" when clearing state (explicit null with allowClear, or empty string).
 * @param {*} dataObj
 * @param {boolean} [allowClear=false]
 * @returns {string|undefined}
 */
export function serializeStateData(dataObj, allowClear = false) {
  if (dataObj === undefined) {
    return undefined;
  }
  if (dataObj === null) {
    return allowClear ? '' : undefined;
  }
  if (dataObj === '') {
    return '';
  }
  const jsonStr = typeof dataObj === 'string' ? dataObj : JSON.stringify(dataObj);
  if (jsonStr === undefined) {
    return undefined;
  }
  if (jsonStr.includes('\0') || jsonStr.includes('\\u0000')) {
    throw new Error('INPUT_MEDIA_WIDGET_DATA_INVALID: State data contains NUL character (U+0000)');
  }
  const byteLength = utf8ByteLength(jsonStr);
  if (byteLength > 1024) {
    throw new Error(`INPUT_MEDIA_WIDGET_DATA_TOO_LARGE: State data byte length (${byteLength}) exceeds 1024 bytes (WIDGET_DATA_TOO_LARGE)`);
  }
  return jsonStr;
}

/**
 * Serializes query result data to a string or JSON string.
 * Verifies no NUL character and byte length <= 1024 bytes.
 * @param {*} resultData
 * @returns {string|undefined}
 */
export function serializeQueryResult(resultData) {
  if (resultData === null || resultData === undefined) {
    return undefined;
  }
  const str = typeof resultData === 'string'
    ? resultData
    : typeof resultData === 'object'
      ? JSON.stringify(resultData)
      : String(resultData);

  if (str.includes('\0') || str.includes('\\u0000')) {
    throw new Error('WIDGET_RESULT_INVALID: Query result contains NUL character (U+0000)');
  }
  const byteLength = utf8ByteLength(str);
  if (byteLength > 1024) {
    throw new Error(`WIDGET_RESULT_TOO_LARGE: Query result byte length (${byteLength}) exceeds 1024 bytes`);
  }
  return str;
}

/**
 * Parses compact query wire format: <type>:<action>:<payload> or <type>:<action>.
 * If only one colon is present (e.g. "timer:start"), returns { type: part0, action: part1, payload: null, raw: rawData }.
 * Validates that rawData is a non-empty string without NUL and 1 <= utf8ByteLength <= 64.
 * @param {string} rawData
 * @returns {{ type: string|null, action: string|null, payload: string|null, raw: string }}
 */
export function parseQueryData(rawData) {
  if (typeof rawData !== 'string' || rawData.length === 0 || rawData.includes('\0')) {
    throw new Error('WIDGET_QUERY_DATA_INVALID: Query data must be a non-empty string without NUL bytes');
  }
  const byteLen = utf8ByteLength(rawData);
  if (byteLen < 1 || byteLen > 64) {
    throw new Error(`WIDGET_QUERY_DATA_INVALID: Query byte length (${byteLen}) must be between 1 and 64`);
  }

  const firstColon = rawData.indexOf(':');
  if (firstColon === -1) {
    return { type: null, action: rawData, payload: null, raw: rawData };
  }

  const secondColon = rawData.indexOf(':', firstColon + 1);
  if (secondColon === -1) {
    // Format: "<type>:<action>" (e.g. "timer:start", "timer:stop", "timer:lap")
    return {
      type: rawData.slice(0, firstColon) || null,
      action: rawData.slice(firstColon + 1) || null,
      payload: null,
      raw: rawData,
    };
  }

  // Format: "<type>:<action>:<payload>" (e.g. "poll:vote:0", "timer:start:1")
  return {
    type: rawData.slice(0, firstColon) || null,
    action: rawData.slice(firstColon + 1, secondColon) || null,
    payload: rawData.slice(secondColon + 1),
    raw: rawData,
  };
}
