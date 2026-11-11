/**
 * Pure template helper functions for Telegram widgets (Profile 1).
 * Zero external, SDK, or DB dependencies.
 */

/**
 * Minifies raw HTML by stripping comments, removing NUL bytes,
 * collapsing redundant whitespace between tags and statements, and trimming.
 *
 * @param {string} rawHtml
 * @returns {string}
 */
export function minifyWidgetHtml(rawHtml) {
  if (typeof rawHtml !== 'string') {
    return '';
  }

  // 1. Remove NUL characters (U+0000)
  let str = rawHtml.replace(/\0/g, '');

  // 2. Strip HTML comments (<!-- ... -->)
  str = str.replace(/<!--[\s\S]*?-->/g, '');

  // 3. Strip CSS/JS multiline comments (/* ... */)
  str = str.replace(/\/\*[\s\S]*?\*\//g, '');

  // 4. Strip single-line JS comments (// ...) on their own lines or after semicolons/braces
  // Note: Avoid stripping URLs (e.g. data: or https://) by ensuring not preceded by colon
  str = str.replace(/(^|[^:])\/\/.*$/gm, '$1');

  // 5. Standardize newlines
  str = str.replace(/\r\n/g, '\n');

  // 6. Collapse redundant whitespace between HTML tags (> ... <)
  str = str.replace(/>\s+</g, '><');

  // 7. Collapse multiple spaces and tabs into a single space
  str = str.replace(/[ \t]+/g, ' ');

  // 8. Collapse newlines and surrounding spaces into a single space or remove where safe
  str = str.replace(/\s*\n\s*/g, ' ');

  // 9. Trim leading and trailing whitespace
  return str.trim();
}

/**
 * Escapes special HTML characters for safe interpolation.
 *
 * @param {string} str
 * @returns {string}
 */
export function escapeHtmlText(str) {
  if (typeof str !== 'string') {
    str = String(str ?? '');
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
