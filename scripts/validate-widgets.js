import zlib from 'node:zlib';
import { readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAW_LIMIT = 32768; // 32 KB raw UTF-8
const ZLIB_LIMIT = 4096; // 4096 B (4 KB) RFC 1950 zlib level 9 (Profile 1 limit)
const MAX_HEAVY_PAINT_BOXES = 16;
const MAX_BACKDROP_FILTERS = 2;
const MAX_COMPLEX_SCRIPT_UNITS = 8192;
const MAX_DOCUMENT_TEXT_UNITS = 48000;
const MAX_INITIAL_STATE_BYTES = 1024;

const FORBIDDEN_HTML_ELEMENTS = [
  // Form elements out in Profile 1
  { pattern: /<form\b/i, name: '<form>' },
  { pattern: /<input\b/i, name: '<input>' },
  { pattern: /<select\b/i, name: '<select>' },
  { pattern: /<option\b/i, name: '<option>' },
  { pattern: /<optgroup\b/i, name: '<optgroup>' },
  { pattern: /<textarea\b/i, name: '<textarea>' },
  { pattern: /<label\b/i, name: '<label>' },
  { pattern: /<fieldset\b/i, name: '<fieldset>' },
  { pattern: /<legend\b/i, name: '<legend>' },
  { pattern: /<datalist\b/i, name: '<datalist>' },
  { pattern: /<output\b/i, name: '<output>' },
  { pattern: /<progress\b/i, name: '<progress>' },
  { pattern: /<meter\b/i, name: '<meter>' },
  // Media elements out in Profile 1
  { pattern: /<audio\b/i, name: '<audio>' },
  { pattern: /<video\b/i, name: '<video>' },
  { pattern: /<source\b/i, name: '<source>' },
  { pattern: /<track\b/i, name: '<track>' },
  // Embedding elements out in Profile 1
  { pattern: /<iframe\b/i, name: '<iframe>' },
  { pattern: /<frame\b/i, name: '<frame>' },
  { pattern: /<frameset\b/i, name: '<frameset>' },
  { pattern: /<object\b/i, name: '<object>' },
  { pattern: /<embed\b/i, name: '<embed>' },
  { pattern: /<script[^>]+src\s*=/i, name: '<script src=...>' },
  { pattern: /<link\b/i, name: '<link>' },
  // SVG <image> element out in Profile 1
  { pattern: /<image\b/i, name: 'SVG <image>' },
];

const FORBIDDEN_CSS_PATTERNS = [
  { pattern: /\d+(?:\.\d+)?(?:vh|dvh|svh)\b/i, name: 'CSS height units (vh, dvh, svh)' },
  { pattern: /@font-face\b/i, name: '@font-face' },
  { pattern: /@import\b/i, name: '@import' },
  { pattern: /\boverflow(?:-[xy])?\s*:\s*[^;}]*\b(auto|scroll|overlay)\b/i, name: 'overflow: auto/scroll' },
  { pattern: /\bposition\s*:\s*[^;}]*\b(?:-webkit-)?sticky\b/i, name: 'position: sticky' },
  { pattern: /\b(matrix3d|translate3d|translatez|scale3d|scalez|rotate3d|rotatex|rotatey|rotatez|perspective)\s*\(/i, name: '3D CSS transform function' },
  { pattern: /\b(perspective|transform-style|backface-visibility)\s*:/i, name: '3D CSS transform property' },
];

const FORBIDDEN_JS_PATTERNS = [
  { pattern: /\bfetch\s*\(/i, name: 'fetch()' },
  { pattern: /\bXMLHttpRequest\b/i, name: 'XMLHttpRequest' },
  { pattern: /\bWebSocket\b/i, name: 'WebSocket' },
  { pattern: /TelegramWidget\.sendMessage\b/i, name: 'TelegramWidget.sendMessage' },
];

/**
 * Validates a single HTML rendering against all Profile 1 constraints.
 *
 * @param {string} html
 * @param {string} widgetName
 * @param {string} contextLabel
 * @returns {{ rawBytes: number, compressedBytes: number, totalHeavyBoxes: number }}
 */
function validateHtmlOutput(html, widgetName, contextLabel) {
  if (typeof html !== 'string' || !html.length) {
    throw new Error(`Widget "${widgetName}" (${contextLabel}): renderHtml returned empty or non-string output`);
  }

  if (html.includes('\0')) {
    throw new Error(`Widget "${widgetName}" (${contextLabel}): HTML contains forbidden NUL byte (\\0)`);
  }

  const rawBytes = Buffer.byteLength(html, 'utf8');
  const compressedBytes = zlib.deflateSync(Buffer.from(html, 'utf8'), { level: 9 }).byteLength;

  if (rawBytes > RAW_LIMIT) {
    throw new Error(`Widget "${widgetName}" (${contextLabel}): raw UTF-8 size (${rawBytes} B) exceeds limit of ${RAW_LIMIT} B`);
  }

  if (compressedBytes > ZLIB_LIMIT) {
    throw new Error(`Widget "${widgetName}" (${contextLabel}): compressed zlib level 9 size (${compressedBytes} B) exceeds Profile 1 limit of ${ZLIB_LIMIT} B`);
  }

  // Profile 1: Forbidden HTML Elements
  for (const check of FORBIDDEN_HTML_ELEMENTS) {
    if (check.pattern.test(html)) {
      throw new Error(`Widget "${widgetName}" (${contextLabel}): contains forbidden Profile 1 HTML element ${check.name}`);
    }
  }

  // Profile 1: Image MIME / URL checks in <img>
  const imgRegex = /<img\b[^>]*\bsrc\s*=\s*(["']?)([^"'\s>]+)\1/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const src = imgMatch[2];
    if (!/^data:image\/(?:png|jpeg|jpg|gif|webp)(?:;[a-z0-9\-]+=[a-z0-9\-]+)*(?:;base64)?,/i.test(src)) {
      throw new Error(`Widget "${widgetName}" (${contextLabel}): <img> contains invalid src "${src.slice(0, 50)}". Only data: image/png, image/jpeg, image/jpg, image/gif, image/webp allowed in Profile 1`);
    }
  }

  // Profile 1: CSS url() check
  const cssUrlRegex = /\burl\s*\(\s*(["']?)([^"')]+)\1\s*\)/gi;
  let urlMatch;
  while ((urlMatch = cssUrlRegex.exec(html)) !== null) {
    const urlVal = urlMatch[2].trim();
    if (!urlVal.startsWith('#') && !/^data:image\/(?:png|jpeg|jpg|gif|webp)(?:;[a-z0-9\-]+=[a-z0-9\-]+)*(?:;base64)?,/i.test(urlVal)) {
      throw new Error(`Widget "${widgetName}" (${contextLabel}): CSS url() contains invalid URL "${urlVal.slice(0, 50)}". Only data: image/png, image/jpeg, image/jpg, image/gif, image/webp or #fragment allowed in Profile 1`);
    }
  }

  // Profile 1: Forbidden CSS Patterns
  for (const check of FORBIDDEN_CSS_PATTERNS) {
    if (check.pattern.test(html)) {
      throw new Error(`Widget "${widgetName}" (${contextLabel}): contains forbidden Profile 1 CSS pattern ${check.name}`);
    }
  }

  // Profile 1: Forbidden JS Patterns
  for (const check of FORBIDDEN_JS_PATTERNS) {
    if (check.pattern.test(html)) {
      throw new Error(`Widget "${widgetName}" (${contextLabel}): contains forbidden Profile 1 JavaScript call ${check.name}`);
    }
  }

  // Profile 1: Heavy Paint Box Count (<= 16 total, <= 2 backdrop-filter)
  const backdropMatches = html.match(/(?:-webkit-)?backdrop-filter\s*:[^;}]*?(?:blur|brightness)\s*\(/gi);
  const backdropCount = backdropMatches ? backdropMatches.length : 0;
  if (backdropCount > MAX_BACKDROP_FILTERS) {
    throw new Error(`Widget "${widgetName}" (${contextLabel}): backdrop-filter count (${backdropCount}) exceeds Profile 1 limit of ${MAX_BACKDROP_FILTERS}`);
  }

  const filterMatches = html.match(/\bfilter\s*:[^;}]*?(?:blur|brightness|drop-shadow)\s*\(/gi);
  const filterCount = filterMatches ? filterMatches.length : 0;

  const opacityMatches = html.match(/\bopacity\s*:\s*(?:0(?:\.\d+)?|\.\d+)\b/gi);
  const opacityCount = opacityMatches ? opacityMatches.length : 0;

  const shadowMatches = html.match(/\bbox-shadow\s*:\s*([^;}]+)/gi);
  let blurredShadowCount = 0;
  if (shadowMatches) {
    for (const sh of shadowMatches) {
      if (/\b(?:[1-9]\d*(?:\.\d+)?|0\.\d+)(?:px|em|rem)\b/.test(sh)) {
        blurredShadowCount++;
      }
    }
  }

  const totalHeavyBoxes = backdropCount + filterCount + opacityCount + blurredShadowCount;
  if (totalHeavyBoxes > MAX_HEAVY_PAINT_BOXES) {
    throw new Error(`Widget "${widgetName}" (${contextLabel}): heavy paint box count (${totalHeavyBoxes}) exceeds Profile 1 limit of ${MAX_HEAVY_PAINT_BOXES}`);
  }

  // Profile 1: Complex-Script (Arabic/Persian) UTF-16 Budget <= 8192
  const complexMatches = html.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g);
  const complexUnits = complexMatches ? complexMatches.length : 0;
  if (complexUnits > MAX_COMPLEX_SCRIPT_UNITS) {
    throw new Error(`Widget "${widgetName}" (${contextLabel}): complex-script UTF-16 units (${complexUnits}) exceeds Profile 1 budget limit of ${MAX_COMPLEX_SCRIPT_UNITS}`);
  }

  // Profile 1: Total Document Text Budget <= 48000
  const textContent = html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '');
  if (textContent.length > MAX_DOCUMENT_TEXT_UNITS) {
    throw new Error(`Widget "${widgetName}" (${contextLabel}): document text length (${textContent.length} UTF-16 units) exceeds Profile 1 budget limit of ${MAX_DOCUMENT_TEXT_UNITS}`);
  }

  return { rawBytes, compressedBytes, totalHeavyBoxes };
}

/**
 * Converts a widget name into a safe JavaScript variable identifier.
 *
 * @param {string} name
 * @returns {string}
 */
function toVariableName(name) {
  const camel = name
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
  return camel + 'Widget';
}

/**
 * Generates the source code for tgcloud/lib/widgets/registry/catalog.js.
 *
 * @param {Array<{ name: string, varName: string, def: object }>} widgets
 * @returns {string}
 */
function generateCatalogModule(widgets) {
  const importStatements = widgets
    .map((w) => `import ${w.varName} from '../definitions/${w.name}/index.js';`)
    .join('\n');

  const registerStatements = widgets
    .map((w) => `register(${w.varName});`)
    .join('\n');

  return `// Auto-generated by scripts/validate-widgets.js. Do not edit directly.
${importStatements}

const byType = new Map();
const byCommand = new Map();

function register(def) {
  if (!def || !def.type) return;
  byType.set(def.type, def);
  if (def.command) {
    const cmd = def.command.toLowerCase();
    byCommand.set(cmd, def);
    if (cmd.startsWith('/')) {
      byCommand.set(cmd.slice(1), def);
    } else {
      byCommand.set('/' + cmd, def);
    }
  }
}

${registerStatements}

/**
 * Retrieves a widget definition by its type name ('poll', 'duel', etc.).
 *
 * @param {string} type
 * @returns {object|null}
 */
export function getWidgetDefinition(type) {
  if (!type || typeof type !== 'string') return null;
  return byType.get(type) ?? null;
}

/**
 * Retrieves a widget definition by its bot command ('/poll', 'poll', '/duel', etc.).
 *
 * @param {string} command
 * @returns {object|null}
 */
export function getWidgetByCommand(command) {
  if (!command || typeof command !== 'string') return null;
  const firstWord = command.trim().split(/\\s+/)[0].toLowerCase();
  return byCommand.get(firstWord) ?? null;
}

/**
 * Returns a list of all registered widget definitions.
 *
 * @returns {Array<object>}
 */
export function listWidgetDefinitions() {
  return [...byType.values()];
}
`;
}

async function main() {
  const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const baseDir = join(rootDir, 'tgcloud/lib/widgets/definitions');
  const catalogPath = join(rootDir, 'tgcloud/lib/widgets/registry/catalog.js');

  console.log(`[Widget Validator] Scanning widget definitions in ${baseDir}...`);

  if (!existsSync(baseDir)) {
    throw new Error(`Directory not found: ${baseDir}`);
  }

  const widgetDirs = readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  if (!widgetDirs.length) {
    throw new Error('No widget definitions found');
  }

  const validatedWidgets = [];

  for (const name of widgetDirs) {
    const dirPath = join(baseDir, name);
    const indexPath = join(dirPath, 'index.js');
    const templatePath = join(dirPath, 'template.js');

    if (!existsSync(indexPath)) {
      throw new Error(`Widget "${name}" is missing required "index.js"`);
    }
    if (!existsSync(templatePath)) {
      throw new Error(`Widget "${name}" is missing required "template.js"`);
    }

    const mod = await import(pathToFileURL(indexPath).href);
    const def = mod.default;

    if (!def || typeof def !== 'object') {
      throw new Error(`Widget "${name}": index.js must provide a default export object`);
    }

    // Validate metadata fields
    if (typeof def.type !== 'string' || !def.type.trim() || def.type !== name) {
      throw new Error(`Widget "${name}": "type" must be a non-empty string matching the directory name ("${name}")`);
    }

    if (typeof def.command !== 'string' || !def.command.startsWith('/')) {
      throw new Error(`Widget "${name}": "command" must be a string starting with "/" (e.g. "/${name}")`);
    }

    if (typeof def.title !== 'string' || !def.title.trim()) {
      throw new Error(`Widget "${name}": "title" must be a non-empty string`);
    }

    if (typeof def.icon !== 'string' || !def.icon.trim()) {
      throw new Error(`Widget "${name}": "icon" must be a non-empty string`);
    }

    if (typeof def.defaultCaption !== 'function' && typeof def.defaultCaption !== 'string') {
      throw new Error(`Widget "${name}": "defaultCaption" must be a function or a string`);
    }

    if (typeof def.renderHtml !== 'function') {
      throw new Error(`Widget "${name}": "renderHtml" must be a function`);
    }

    // Width / Height bounds validation: width is 0 or [200, 600]; height is 0 or [50, 600]
    if (typeof def.width !== 'number' || (def.width !== 0 && (!Number.isInteger(def.width) || def.width < 200 || def.width > 600))) {
      throw new Error(`Widget "${name}": "width" (${def.width}) must be 0 (auto) or an integer between 200 and 600`);
    }
    if (typeof def.height !== 'number' || (def.height !== 0 && (!Number.isInteger(def.height) || def.height < 50 || def.height > 600))) {
      throw new Error(`Widget "${name}": "height" (${def.height}) must be 0 (auto) or an integer between 50 and 600`);
    }

    // 1024-byte initial state limits
    if (typeof def.createInitialChatData === 'function') {
      const cd = def.createInitialChatData({});
      if (cd !== null && cd !== undefined) {
        const ser = typeof cd === 'string' ? cd : JSON.stringify(cd);
        const bytes = Buffer.byteLength(ser, 'utf8');
        if (bytes > MAX_INITIAL_STATE_BYTES) {
          throw new Error(`Widget "${name}": initial chat_data size (${bytes} B) exceeds limit of ${MAX_INITIAL_STATE_BYTES} B`);
        }
      }
    }

    if (typeof def.createInitialPublicData === 'function') {
      const pd = def.createInitialPublicData({});
      if (pd !== null && pd !== undefined) {
        const ser = typeof pd === 'string' ? pd : JSON.stringify(pd);
        const bytes = Buffer.byteLength(ser, 'utf8');
        if (bytes > MAX_INITIAL_STATE_BYTES) {
          throw new Error(`Widget "${name}": initial public_data size (${bytes} B) exceeds limit of ${MAX_INITIAL_STATE_BYTES} B`);
        }
      }
    }

    // Parameterized renderHtml size checks
    const paramVariations = [
      { label: 'default params', params: {} },
    ];

    if (typeof def.parseParams === 'function') {
      paramVariations.push({ label: 'parseParams("")', params: def.parseParams('') });
      paramVariations.push({
        label: 'parseParams(sample)',
        params: def.parseParams('Custom Test | Item 1 | Item 2 | Item 3 | Item 4 | Item 5'),
      });
    }

    if (name === 'poll') {
      paramVariations.push({
        label: 'boundary poll params',
        params: {
          q: 'Which feature should we ship next in widget profile 1? Extended question testing string.',
          o: ['Option 1 (Alpha)', 'Option 2 (Beta)', 'Option 3 (Gamma)', 'Option 4 (Delta)', 'Option 5 (Epsilon)'],
        },
      });
    } else if (name === 'duel') {
      paramVariations.push({
        label: 'boundary duel params',
        params: { target: 15 },
      });
    } else if (name === 'timer') {
      paramVariations.push({
        label: 'boundary timer params',
        params: { title: 'High Intensity Interval Training Session 40' },
      });
    }

    let defaultStats = null;
    for (const testCase of paramVariations) {
      const html = def.renderHtml(testCase.params);
      const stats = validateHtmlOutput(html, name, testCase.label);
      if (testCase.label === 'default params') {
        defaultStats = stats;
      }
    }

    console.log(`[Widget Validated] ${name}: "${def.title}" (${def.command}) -> raw: ${defaultStats.rawBytes}B, zlib-9: ${defaultStats.compressedBytes}B, heavy boxes: ${defaultStats.totalHeavyBoxes} (Profile 1 OK)`);

    validatedWidgets.push({
      name,
      varName: toVariableName(name),
      def,
    });
  }

  // Sort discovered widget definitions by (a.order ?? 999) - (b.order ?? 999) then alphabetically by type
  validatedWidgets.sort((a, b) => {
    const orderA = a.def.order ?? 999;
    const orderB = b.def.order ?? 999;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.def.type.localeCompare(b.def.type);
  });

  // Auto-Generate tgcloud/lib/widgets/registry/catalog.js
  const newCatalogCode = generateCatalogModule(validatedWidgets);

  let hasChanged = true;
  if (existsSync(catalogPath)) {
    const existingCode = readFileSync(catalogPath, 'utf8');
    if (existingCode === newCatalogCode) {
      hasChanged = false;
    }
  }

  if (hasChanged) {
    writeFileSync(catalogPath, newCatalogCode, 'utf8');
    console.log(`[Catalog Generator] Updated ${catalogPath} with ${validatedWidgets.length} registered widgets.`);
  } else {
    console.log(`[Catalog Generator] ${catalogPath} is already up to date.`);
  }

  console.log(`[Widget Validator] Successfully validated all ${validatedWidgets.length} widget(s).`);
}

main().catch((err) => {
  console.error(`[Widget Validator Error] ${err.message}`);
  process.exit(1);
});
