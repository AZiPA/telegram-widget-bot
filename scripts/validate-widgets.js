import zlib from 'node:zlib';
import { listWidgetDefinitions } from '../tgcloud/lib/widgets/registry/index.js';

const RAW_LIMIT = 32768; // 32 KB
const ZLIB_LIMIT = 3800; // 3800 B

const defs = listWidgetDefinitions();
if (!defs.length) {
  throw new Error('No widget definitions registered');
}

for (const def of defs) {
  const html = def.renderHtml({});
  if (typeof html !== 'string' || !html.length) {
    throw new Error(`${def.type}: empty HTML`);
  }
  if (html.includes('\0')) {
    throw new Error(`${def.type}: HTML contains forbidden NUL byte`);
  }

  const rawBytes = Buffer.byteLength(html, 'utf8');
  const compressedBytes = zlib.deflateSync(Buffer.from(html, 'utf8'), { level: 9 }).byteLength;

  console.log(`[Widget Size] ${def.type} -> raw: ${rawBytes}B, zlib-9: ${compressedBytes}B`);

  if (rawBytes > RAW_LIMIT) {
    throw new Error(`${def.type} exceeds raw limit: ${rawBytes}B > ${RAW_LIMIT}B`);
  }
  if (compressedBytes > ZLIB_LIMIT) {
    throw new Error(`${def.type} exceeds safe zlib-9 limit: ${compressedBytes}B > ${ZLIB_LIMIT}B`);
  }
}
