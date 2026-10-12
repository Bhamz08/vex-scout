// Generates the PWA PNG icons with no image dependencies: rasterises a simple
// "V" chevron with signed-distance maths and writes PNGs with node:zlib.
// Run with `npm run icons`; output is committed under public/icons.
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const BG = [29, 78, 216]; // #1d4ed8
const FG = [255, 255, 255];

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** @param {number} size @param {{ maskable: boolean }} opts */
function render(size, { maskable }) {
  const px = Buffer.alloc(size * size * 4);
  const scale = maskable ? 0.62 : 0.78; // maskable icons keep the glyph inside the safe zone
  const radius = maskable ? 0 : size * 0.22;
  const stroke = size * 0.085 * scale;
  const c = size / 2;
  const top = c - size * 0.28 * scale;
  const bottom = c + size * 0.3 * scale;
  const half = size * 0.3 * scale;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // Rounded-square background (alpha via simple coverage at corners).
      const qx = Math.max(Math.abs(x + 0.5 - c) - (c - radius), 0);
      const qy = Math.max(Math.abs(y + 0.5 - c) - (c - radius), 0);
      const outside = Math.hypot(qx, qy) - radius;
      const bgAlpha = Math.max(0, Math.min(1, 0.5 - outside));
      const d = Math.min(
        distToSegment(x + 0.5, y + 0.5, c - half, top, c, bottom),
        distToSegment(x + 0.5, y + 0.5, c + half, top, c, bottom),
      );
      const fg = Math.max(0, Math.min(1, stroke - d + 0.5));
      for (let k = 0; k < 3; k++) px[i + k] = Math.round(BG[k] * (1 - fg) + FG[k] * fg);
      px[i + 3] = Math.round(255 * bgAlpha);
    }
  }
  return encodePng(size, px);
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', render(192, { maskable: false }));
writeFileSync('public/icons/icon-512.png', render(512, { maskable: false }));
writeFileSync('public/icons/icon-maskable-512.png', render(512, { maskable: true }));
writeFileSync('public/icons/apple-touch-icon.png', render(180, { maskable: true }));
console.log('Icons written to public/icons');
