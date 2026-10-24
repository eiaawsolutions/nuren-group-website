// JSON files the admin edits (investor records, job positions) on the Railway
// volume. Writes go to a temp file and are renamed into place, so a crash
// mid-write never leaves a half-written file; an unreadable file is moved
// aside for recovery instead of being overwritten.
import fs from 'node:fs';

/** Writes `data` to `target` atomically. Throws if the disk refuses. */
export function writeJsonAtomic(target, data) {
  const tmp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`);
  fs.renameSync(tmp, target);
}

/**
 * Reads `target`. `fresh` is true when there was nothing usable to read
 * (missing, or corrupt and now renamed to `<file>.corrupt-<time>`), in which
 * case `data` is the fallback.
 */
export function readJsonFile(target, fallback, onCorrupt = () => {}) {
  if (!fs.existsSync(target)) return { data: fallback, fresh: true };
  try {
    return { data: JSON.parse(fs.readFileSync(target, 'utf8')), fresh: false };
  } catch (err) {
    onCorrupt(err?.message || String(err));
    fs.renameSync(target, `${target}.corrupt-${Date.now()}`);
    return { data: fallback, fresh: true };
  }
}
