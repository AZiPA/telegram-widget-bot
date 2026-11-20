export function utf8ByteLength(str) {
  return new TextEncoder().encode(String(str ?? '')).byteLength;
}

export function assertValidWidgetHtml(html) {
  if (typeof html !== 'string' || html.length === 0) {
    throw new Error('INPUT_MEDIA_WIDGET_HTML_INVALID: Widget HTML must be a non-empty string');
  }
  if (html.includes('\0')) {
    throw new Error('INPUT_MEDIA_WIDGET_HTML_INVALID: Widget HTML must not contain NUL bytes');
  }
  const bytes = utf8ByteLength(html);
  if (bytes > 32768) {
    throw new Error(`INPUT_MEDIA_WIDGET_TOO_LARGE: HTML size (${bytes}B) exceeds 32768B limit`);
  }
}

export function serializeStateData(dataObj) {
  if (dataObj === undefined) return undefined;
  if (dataObj === null || dataObj === '') return '';
  const str = typeof dataObj === 'string' ? dataObj : JSON.stringify(dataObj);
  if (str.includes('\0')) {
    throw new Error('WIDGET_DATA_INVALID: State data must not contain NUL bytes');
  }
  const bytes = utf8ByteLength(str);
  if (bytes > 1024) {
    throw new Error(`WIDGET_DATA_TOO_LARGE: State size (${bytes}B) exceeds 1024B limit`);
  }
  return str;
}

export function serializeQueryResult(resultData) {
  if (resultData === undefined || resultData === null || resultData === '') return undefined;
  const str = typeof resultData === 'string' ? resultData : JSON.stringify(resultData);
  if (!str || str.includes('\0')) return undefined;
  const bytes = utf8ByteLength(str);
  if (bytes > 1024) {
    throw new Error(`WIDGET_RESULT_TOO_LARGE: Query result (${bytes}B) exceeds 1024B limit`);
  }
  return str;
}

export function parseQueryData(rawData) {
  if (typeof rawData !== 'string' || rawData.length === 0 || rawData.includes('\0')) {
    return { type: null, action: null, payload: null, raw: '' };
  }
  const trimmed = rawData.trim();
  const byteLen = utf8ByteLength(trimmed);
  if (byteLen < 1 || byteLen > 64) {
    return { type: null, action: null, payload: null, raw: trimmed };
  }

  const firstColon = trimmed.indexOf(':');
  if (firstColon === -1) {
    return { type: null, action: trimmed, payload: null, raw: trimmed };
  }

  const secondColon = trimmed.indexOf(':', firstColon + 1);
  if (secondColon === -1) {
    return {
      type: trimmed.slice(0, firstColon) || null,
      action: trimmed.slice(firstColon + 1) || null,
      payload: null,
      raw: trimmed,
    };
  }

  return {
    type: trimmed.slice(0, firstColon) || null,
    action: trimmed.slice(firstColon + 1, secondColon) || null,
    payload: trimmed.slice(secondColon + 1),
    raw: trimmed,
  };
}
