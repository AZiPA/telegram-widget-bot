import { utf8ByteLength } from './validators.js';
import { minifyWidgetHtml } from '../template-utils.js';

/**
 * Extracts an optional leading metadata JSON comment <!-- @tg-widget {...} --> from raw HTML.
 *
 * @param {string} rawHtml
 * @returns {{ meta: object, cleanHtml: string }}
 */
export function extractWidgetMetaComment(rawHtml) {
  if (typeof rawHtml !== 'string') {
    return { meta: {}, cleanHtml: '' };
  }

  const metaCommentRegex = /<!--\s*@tg-widget\s*(\{[\s\S]*?\})\s*-->/i;
  const match = rawHtml.match(metaCommentRegex);

  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const meta = {
          width: parsed.width !== undefined ? Number(parsed.width) : undefined,
          height: parsed.height !== undefined ? Number(parsed.height) : undefined,
          allowQueries: parsed.allowQueries !== undefined ? Boolean(parsed.allowQueries) : undefined,
          caption: parsed.caption !== undefined ? String(parsed.caption) : undefined,
          chatData: parsed.chatData !== undefined ? parsed.chatData : undefined,
          publicData: parsed.publicData !== undefined ? parsed.publicData : undefined,
          strict: parsed.strict !== undefined ? Boolean(parsed.strict) : undefined,
        };
        for (const key of Object.keys(meta)) {
          if (meta[key] === undefined) delete meta[key];
        }
        const cleanHtml = rawHtml.replace(match[0], '');
        return { meta, cleanHtml };
      }
    } catch {
      // JSON parse error, ignore meta comment
    }
    const cleanHtml = rawHtml.replace(match[0], '');
    return { meta: {}, cleanHtml };
  }

  return { meta: {}, cleanHtml: rawHtml };
}

/**
 * Safely strips optional document shell tags (DOCTYPE, meta charset, outer html, head,
 * and body if body has no style or class attributes) to optimize compressed size.
 *
 * @param {string} html
 * @returns {string}
 */
export function stripOptionalDocumentShell(html) {
  if (typeof html !== 'string') return '';
  let result = html;
  result = result.replace(/<!DOCTYPE[^>]*>/gi, '');
  result = result.replace(/<meta\s+charset=["']?utf-8["']?\s*\/?>/gi, '');
  result = result.replace(/<\/?html\b[^>]*>/gi, '');
  result = result.replace(/<\/?head\b[^>]*>/gi, '');

  const bodyMatch = result.match(/<body(\s+[^>]*)?>/i);
  if (bodyMatch) {
    const bodyAttrs = (bodyMatch[1] || '').trim();
    const hasStyleOrClass = /\b(style|class)\s*=/i.test(bodyAttrs);
    if (!hasStyleOrClass) {
      result = result.replace(/<body(\s+[^>]*)?>/i, '').replace(/<\/body>/i, '');
    }
  }
  return result.trim();
}

/**
 * Estimates the zlib compressed size (RFC 1950) using CompressionStream if available in V8/globalThis.
 *
 * @param {Uint8Array|string} utf8Bytes
 * @returns {Promise<{ bytes: number|null, exact: boolean }>}
 */
export async function estimateCompressedSize(utf8Bytes) {
  if (typeof CompressionStream === 'function') {
    try {
      const bytes = typeof utf8Bytes === 'string'
        ? new TextEncoder().encode(utf8Bytes)
        : utf8Bytes;

      if (typeof Response === 'function') {
        const stream = new Response(bytes).body.pipeThrough(new CompressionStream('deflate'));
        const buf = await new Response(stream).arrayBuffer();
        return { bytes: buf.byteLength, exact: true };
      }

      if (typeof ReadableStream === 'function') {
        const inputStream = new ReadableStream({
          start(controller) {
            controller.enqueue(bytes);
            controller.close();
          },
        });
        const stream = inputStream.pipeThrough(new CompressionStream('deflate'));
        const reader = stream.getReader();
        let total = 0;
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) total += value.byteLength;
        }
        return { bytes: total, exact: true };
      }
    } catch {
      return { bytes: null, exact: false };
    }
  }
  return { bytes: null, exact: false };
}

/**
 * Analyzes HTML DOM nesting depth and total element tag count.
 *
 * @param {string} html
 * @returns {{ totalTags: number, maxDepth: number }}
 */
function analyzeDomStructure(html) {
  let stripped = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '<script></script>');
  stripped = stripped.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '<style></style>');
  stripped = stripped.replace(/<!--[\s\S]*?-->/g, '');

  const VOID_ELEMENTS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
    'meta', 'param', 'source', 'track', 'wbr',
  ]);

  const tagRegex = /<\/?([a-zA-Z0-9:-]+)([^>]*?)(\/?)>/g;
  let match;
  let totalTags = 0;
  let maxDepth = 0;
  const stack = [];

  while ((match = tagRegex.exec(stripped)) !== null) {
    const isClosing = match[0].startsWith('</');
    const tagName = match[1].toLowerCase();
    const isSelfClosing = match[3] === '/' || VOID_ELEMENTS.has(tagName);

    if (isClosing) {
      if (stack.length > 0) {
        const lastIdx = stack.lastIndexOf(tagName);
        if (lastIdx !== -1) {
          stack.splice(lastIdx);
        } else {
          stack.pop();
        }
      }
    } else {
      totalTags++;
      if (!isSelfClosing) {
        stack.push(tagName);
        if (stack.length > maxDepth) {
          maxDepth = stack.length;
        }
      }
    }
  }

  return { totalTags, maxDepth };
}

/**
 * Validates raw widget HTML against Telegram Widget Profile 1 rules and size budgets.
 *
 * @param {string} rawHtml
 * @returns {Promise<{
 *   valid: boolean,
 *   minifiedHtml: string,
 *   rawBytes: number,
 *   compressedEstimate: { bytes: number|null, exact: boolean },
 *   errors: string[],
 *   warnings: string[],
 *   meta: object
 * }>}
 */
export async function inspectCustomWidgetHtml(rawHtml) {
  if (typeof rawHtml !== 'string') {
    return {
      valid: false,
      minifiedHtml: '',
      rawBytes: 0,
      compressedEstimate: { bytes: null, exact: false },
      errors: ['Widget HTML must be a non-empty string'],
      warnings: [],
      meta: {},
    };
  }

  const { meta, cleanHtml } = extractWidgetMetaComment(rawHtml);
  let minifiedHtml = minifyWidgetHtml(cleanHtml);
  let rawBytes = utf8ByteLength(minifiedHtml);

  if (rawBytes > 28000) {
    const strippedHtml = stripOptionalDocumentShell(minifiedHtml);
    minifiedHtml = minifyWidgetHtml(strippedHtml);
    rawBytes = utf8ByteLength(minifiedHtml);
  }

  const compressedEstimate = await estimateCompressedSize(new TextEncoder().encode(minifiedHtml));

  const errors = [];
  const warnings = [];

  // --- Blocking Errors ---

  // 1. Empty string after minification
  if (!minifiedHtml || minifiedHtml.trim().length === 0) {
    errors.push('Widget HTML is empty after minification');
  }

  // 2. Contains NUL character (U+0000)
  if (rawHtml.includes('\0') || minifiedHtml.includes('\0')) {
    errors.push('HTML contains forbidden NUL byte (U+0000)');
  }

  // 3. UTF-8 byte length > 32768
  if (rawBytes > 32768) {
    errors.push('Raw HTML size exceeds 32,768 bytes limit');
  }

  // 4. Compressed HTML size > 4096
  if (compressedEstimate.exact && compressedEstimate.bytes !== null && compressedEstimate.bytes > 4096) {
    errors.push('Compressed HTML size exceeds 4,096 bytes limit');
  }

  // 5. DOM nesting depth > 1024 levels or total HTML element tags > 2000
  const domStats = analyzeDomStructure(cleanHtml);
  if (domStats.maxDepth > 1024) {
    errors.push('DOM nesting depth exceeds 1,024 levels limit');
  }
  if (domStats.totalTags > 2000) {
    errors.push('Total HTML element tags exceed 2,000 nodes limit');
  }

  // 6. Any attribute value > 8192 chars
  const LONG_ATTR_REGEX = /=\s*(?:"([^"]{8193,})"|'([^']{8193,})')/;
  if (LONG_ATTR_REGEX.test(rawHtml) || LONG_ATTR_REGEX.test(minifiedHtml)) {
    errors.push('Attribute value exceeds 8,192 characters limit');
  }

  // 7. Forbidden JS network APIs that throw NetworkDisabledError
  const NETWORK_API_REGEX = /\b(fetch\s*\(|XMLHttpRequest\b|WebSocket\b|EventSource\b|new\s+Worker\s*\(|BroadcastChannel\b)/;
  if (NETWORK_API_REGEX.test(cleanHtml)) {
    errors.push('Forbidden network API detected (NetworkDisabledError): fetch/XMLHttpRequest/WebSocket/Worker');
  }

  // --- Profile 1 Warnings (silently stripped or degraded by Telegram clients) ---

  // 1. Forbidden HTML form/media/embed tags
  const FORBIDDEN_TAGS_REGEX = /<(input|select|textarea|option|optgroup|fieldset|datalist|output|progress|meter|dialog|audio|video|source|track|iframe|frame|object|embed|portal|template|slot|math|ruby|rt|rp|bdi|bdo|center|font|big|tt|strike|nobr)\b/i;
  if (FORBIDDEN_TAGS_REGEX.test(cleanHtml)) {
    warnings.push('Forbidden HTML form/media/embed/legacy tags detected: unsupported tags will be stripped by Telegram clients');
  }

  // 2. External scripts or stylesheets
  const EXTERNAL_RESOURCE_REGEX = /<script\b[^>]*\bsrc\s*=/i;
  const LINK_TAG_REGEX = /<link\b/i;
  if (EXTERNAL_RESOURCE_REGEX.test(cleanHtml) || LINK_TAG_REGEX.test(cleanHtml)) {
    warnings.push('External script or stylesheet (<script src=...>, <link>) detected: external resources are blocked in Profile 1');
  }

  // 3. Non-data: image URLs or unsupported data: MIME types
  const INVALID_IMG_REGEX = /<img\b[^>]*\bsrc\s*=\s*["'](?!data:image\/(?:png|jpeg|jpg|gif|webp)[;,])/i;
  if (INVALID_IMG_REGEX.test(cleanHtml)) {
    warnings.push('Non-data or unsupported image format in <img>: only data:image/(png|jpeg|gif|webp) is supported in Profile 1');
  }

  // 4. Out-of-profile SVG elements
  const OUT_OF_PROFILE_SVG_REGEX = /<(clipPath|mask|pattern|marker|filter|fe[A-Za-z]+|animate|animateTransform|animateMotion|foreignObject)\b/i;
  if (OUT_OF_PROFILE_SVG_REGEX.test(cleanHtml)) {
    warnings.push('Out-of-profile SVG elements (clipPath, mask, pattern, marker, filter, SMIL) detected: elements will be dropped');
  }

  // 5. Out-of-profile CSS features inside <style> or style=""
  let cssContent = '';
  const styleBlockRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = styleBlockRegex.exec(cleanHtml)) !== null) {
    cssContent += ' ' + match[1];
  }
  const inlineStyleRegex = /\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  while ((match = inlineStyleRegex.exec(cleanHtml)) !== null) {
    cssContent += ' ' + (match[1] || match[2] || '');
  }

  if (/\b\d+(?:\.\d+)?(?:vh|dvh|svh|lvh|vb)\b/i.test(cssContent)) {
    warnings.push('Out-of-profile CSS: Height-relative units (vh, dvh, svh, lvh, vb) are unsupported');
  }
  if (/overflow(?:-[xy])?\s*:\s*(?:auto|scroll)\b/i.test(cssContent) || /position\s*:\s*(?:-webkit-)?sticky\b/i.test(cssContent)) {
    warnings.push('Out-of-profile CSS: Inner scrolling (overflow: auto/scroll) and position: sticky are unsupported in Profile 1');
  }
  if (/\b(?:margin|padding|inset|border)-(?:inline|block)(?:-(?:start|end))?\s*:/i.test(cssContent)) {
    warnings.push('Out-of-profile CSS: Logical properties are unsupported in Profile 1');
  }
  if (/\b(?:oklch|oklab|lch|lab|hwb|color-mix)\s*\(/i.test(cssContent)) {
    warnings.push('Out-of-profile CSS: Modern color functions (oklch, oklab, color-mix, etc.) are unsupported in Profile 1');
  }
  if (/\b(?:rotate[XYZ3d]|translate[Z3d]|scale[Z3d]|matrix3d|perspective)\s*\(/i.test(cssContent)) {
    warnings.push('Out-of-profile CSS: 3D transform functions are unsupported in Profile 1');
  }
  if (/\b(?:grayscale|sepia|saturate|contrast|hue-rotate|invert)\s*\(/i.test(cssContent)) {
    warnings.push('Out-of-profile CSS: Unsupported filter functions are unsupported in Profile 1');
  }
  if (/@(?:font-face|import|container|layer|property|scope|starting-style)\b/i.test(cssContent)) {
    warnings.push('Out-of-profile CSS: At-rules (@import, @font-face, @container, etc.) are unsupported in Profile 1');
  }
  if (/:(?:has|focus|focus-visible|focus-within|checked|target)\b/i.test(cssContent) || /::(?:first-letter|first-line|marker)\b/i.test(cssContent)) {
    warnings.push('Out-of-profile CSS: Unsupported selectors (:focus, :has, etc.) are unsupported in Profile 1');
  }

  // 6. Out-of-profile JS / SDK calls
  const OUT_OF_PROFILE_JS_REGEX = /(TelegramWidget\.sendMessage\b|navigator\.clipboard\b|\b(?:alert|confirm|prompt)\s*\(|attachShadow\s*\(|requestFullscreen\s*\(|\b(?:ontouchstart|ontouchmove|ontouchend|onkeydown|onkeyup|onkeypress|onwheel)\b|addEventListener\s*\(\s*['"](?:touchstart|touchmove|touchend|keydown|keyup|keypress|wheel)['"])/i;
  if (OUT_OF_PROFILE_JS_REGEX.test(cleanHtml)) {
    warnings.push('Out-of-profile JS API detected: TelegramWidget.sendMessage, clipboard, alert/dialogs, attachShadow, or touch/keyboard events are unsupported');
  }

  return {
    valid: errors.length === 0,
    minifiedHtml,
    rawBytes,
    compressedEstimate,
    errors,
    warnings,
    meta,
  };
}
