// Fails if any image under public/ is not a real image (bad magic bytes).
// Guards against the corruption that once broke datoeng.png: a text-mode
// copy replaced the 0x89 PNG header byte with U+FFFD (EF BF BD).
// Runs before every build via `prebuild`, and standalone: npm run check:assets
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico']);

const startsWith = (buf, bytes, offset = 0) => bytes.every((b, i) => buf[offset + i] === b);
const isImage = (b) =>
  startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) || // PNG
  startsWith(b, [0xff, 0xd8, 0xff]) || // JPEG
  startsWith(b, [0x47, 0x49, 0x46, 0x38]) || // GIF
  (startsWith(b, [0x52, 0x49, 0x46, 0x46]) && startsWith(b, [0x57, 0x45, 0x42, 0x50], 8)) || // WEBP
  startsWith(b, [0x00, 0x00, 0x01, 0x00]); // ICO

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

const bad = [];
for (const file of walk(PUBLIC_DIR)) {
  if (!IMAGE_EXT.has(path.extname(file).toLowerCase())) continue;
  const buf = readFileSync(file);
  if (buf.length === 0 || !isImage(buf)) bad.push(path.relative(PUBLIC_DIR, file));
}

if (bad.length) {
  console.error(`Corrupted or invalid image files in public/:\n${bad.map((f) => `  - ${f}`).join('\n')}`);
  console.error('Restore the originals from the source images folder (binary copy, not text).');
  process.exit(1);
}
console.log('check-assets: all images in public/ have valid headers.');
