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

  // 2. Standardize newlines
  str = str.replace(/\r\n/g, '\n');

  // 3. Strip HTML comments (<!-- ... -->)
  str = str.replace(/<!--[\s\S]*?-->/g, '');

  // 4. Strip CSS/JS multiline comments (/* ... */)
  str = str.replace(/\/\*[\s\S]*?\*\//g, '');

  // 5. Separate <script> blocks to preserve JavaScript line boundaries and avoid newline/comment traps
  const parts = [];
  let lastIndex = 0;
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'html', content: str.slice(lastIndex, match.index) });
    }
    const openTagEnd = match[0].indexOf('>') + 1;
    parts.push({
      type: 'script',
      open: match[0].slice(0, openTagEnd),
      body: match[1],
      close: '</script>',
    });
    lastIndex = scriptRegex.lastIndex;
  }
  if (lastIndex < str.length) {
    parts.push({ type: 'html', content: str.slice(lastIndex) });
  }

  const result = parts.map((part) => {
    if (part.type === 'script') {
      let body = part.body;
      // Strip single-line JS comments safely on their own lines or after semicolon/braces/spaces
      body = body.replace(/(^|[;{} \t])\/\/[^\n]*$/gm, '$1');
      // Collapse spaces and tabs
      body = body.replace(/[ \t]+/g, ' ');
      // Collapse whitespace around newlines while preserving line breaks
      body = body.replace(/[ \t]*\n[ \t]*/g, '\n');
      body = body.replace(/\n+/g, '\n').trim();
      return part.open + body + part.close;
    } else {
      let h = part.content;
      // Collapse redundant whitespace between HTML tags (> ... <)
      h = h.replace(/>\s+</g, '><');
      // Collapse multiple spaces and tabs into a single space
      h = h.replace(/[ \t]+/g, ' ');
      // Collapse newlines and surrounding spaces into a single space
      h = h.replace(/\s*\n\s*/g, ' ');
      // Collapse redundant spaces around CSS braces and semicolons
      h = h.replace(/}\s+/g, '}').replace(/;\s+/g, ';').replace(/{\s+/g, '{');
      // Clean up any remaining space between tags
      h = h.replace(/>\s+</g, '><');
      return h;
    }
  }).join('');

  return result.trim();
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
