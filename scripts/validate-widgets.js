import zlib from 'node:zlib';
import { readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const RAW_LIMIT = 32768; // 32 KB
const ZLIB_LIMIT = 3800; // 3800 B

const baseDir = resolve(process.cwd(), 'tgcloud/lib/widgets/definitions');
if (!existsSync(baseDir)) {
  throw new Error(`Directory not found: ${baseDir}`);
}

const widgetDirs = readdirSync(baseDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

if (!widgetDirs.length) {
  throw new Error('No widget definitions found');
}

for (const name of widgetDirs) {
  const templatePath = join(baseDir, name, 'template.js');
  if (!existsSync(templatePath)) continue;

  const { renderHtml } = await import(`file://${templatePath}`);
  if (typeof renderHtml !== 'function') {
    throw new Error(`${name}: renderHtml is not exported`);
  }

  const html = renderHtml({});
  if (typeof html !== 'string' || !html.length) {
    throw new Error(`${name}: empty HTML`);
  }
  if (html.includes('\0')) {
    throw new Error(`${name}: HTML contains forbidden NUL byte`);
  }

  const rawBytes = Buffer.byteLength(html, 'utf8');
  const compressedBytes = zlib.deflateSync(Buffer.from(html, 'utf8'), { level: 9 }).byteLength;

  console.log(`[Widget Size] ${name} -> raw: ${rawBytes}B, zlib-9: ${compressedBytes}B`);

  if (rawBytes > RAW_LIMIT) {
    throw new Error(`${name} exceeds raw limit: ${rawBytes}B > ${RAW_LIMIT}B`);
  }
  if (compressedBytes > ZLIB_LIMIT) {
    throw new Error(`${name} exceeds safe zlib-9 limit: ${compressedBytes}B > ${ZLIB_LIMIT}B`);
  }
}
