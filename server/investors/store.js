// Where the investor announcements, financial reports and admin-uploaded files
// live. The Nuren investor site kept these in MongoDB + GridFS; this site has
// no database, so each collection is one JSON file and each upload one file
// beside it, under INVESTOR_DATA_DIR. Point that at the Railway volume (the
// same one the leads use) so admin edits survive deploys.
//
// On first boot each collection is seeded from the repo's seed JSON. Writes go
// to a temp file and are renamed into place, so a crash mid-write never leaves
// a half-written file. Writes are synchronous, which also keeps two admin saves
// from interleaving. If the disk is not writable the store keeps working in
// memory (lost on restart), and `writable` says so for the admin warning.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { COLLECTIONS } from './validate.js';

export const UPLOAD_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const UPLOADS_DIR = 'uploads';
const UPLOADS_INDEX = 'uploads.json';

const fileFor = (collection) => `${collection}.json`;

/** Newest first; rows released in the same second keep the order the NSX listed them. */
function byReleaseDate(a, b) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER);
}

export function createInvestorStore({ dir, seeds, onError = () => {} }) {
  const uploadsPath = path.join(dir, UPLOADS_DIR);
  let writable = true;

  /** @type {Record<string, object[]>} */
  const records = {};
  /** @type {Record<string, { filename: string, mime: string, size: number, uploadedAt: string }>} */
  let uploads = {};

  function writeJson(name, data) {
    if (!writable) return;
    const target = path.join(dir, name);
    const tmp = `${target}.${process.pid}.tmp`;
    try {
      fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`);
      fs.renameSync(tmp, target);
    } catch (err) {
      onError('investors:write', err?.message || err);
    }
  }

  function readJson(name, fallback) {
    const target = path.join(dir, name);
    if (!fs.existsSync(target)) return { data: fallback, fresh: true };
    try {
      return { data: JSON.parse(fs.readFileSync(target, 'utf8')), fresh: false };
    } catch (err) {
      // Keep the unreadable file for recovery instead of overwriting it.
      onError('investors:corrupt', `${name}: ${err?.message || err}`);
      fs.renameSync(target, `${target}.corrupt-${Date.now()}`);
      return { data: fallback, fresh: true };
    }
  }

  try {
    fs.mkdirSync(uploadsPath, { recursive: true });
  } catch (err) {
    writable = false;
    onError('investors:init', err?.message || err);
  }

  for (const collection of Object.keys(COLLECTIONS)) {
    const seed = (seeds?.[collection] ?? []).map((row) => ({ ...row }));
    if (!writable) {
      records[collection] = seed;
      continue;
    }
    const { data, fresh } = readJson(fileFor(collection), seed);
    records[collection] = Array.isArray(data) ? data : seed;
    if (fresh) writeJson(fileFor(collection), records[collection]);
  }
  if (writable) uploads = readJson(UPLOADS_INDEX, {}).data ?? {};

  const rows = (collection) => {
    if (!records[collection]) throw new Error(`Unknown investor collection: ${collection}`);
    return records[collection];
  };
  const save = (collection) => writeJson(fileFor(collection), records[collection]);

  return {
    get writable() {
      return writable;
    },

    /** Visible rows newest first; the admin passes includeInactive to see hidden ones too. */
    list(collection, { includeInactive = false } = {}) {
      return rows(collection)
        .filter((r) => includeInactive || r.active !== false)
        .slice()
        .sort(byReleaseDate);
    },

    get(collection, id) {
      return rows(collection).find((r) => r.id === id) ?? null;
    },

    /** `value` must already be validated (see validate.js). */
    create(collection, value) {
      const record = { id: crypto.randomUUID(), ...value };
      rows(collection).push(record);
      save(collection);
      return record;
    },

    update(collection, id, value) {
      const list = rows(collection);
      const index = list.findIndex((r) => r.id === id);
      if (index === -1) return null;
      list[index] = { ...value, id };
      save(collection);
      return list[index];
    },

    remove(collection, id) {
      const list = rows(collection);
      const index = list.findIndex((r) => r.id === id);
      if (index === -1) return false;
      list.splice(index, 1);
      save(collection);
      return true;
    },

    /** Stores an already-checked file and returns the URL records link to. */
    saveUpload({ buffer, filename, mime }) {
      const id = crypto.randomUUID();
      const meta = { filename, mime, size: buffer.length, uploadedAt: new Date().toISOString() };
      // Unlike records, a file can't live in memory only: refuse instead.
      if (!writable) throw new Error('Could not save the file.');
      try {
        fs.writeFileSync(path.join(uploadsPath, id), buffer);
      } catch (err) {
        onError('investors:upload', err?.message || err);
        throw new Error('Could not save the file.');
      }
      uploads[id] = meta;
      writeJson(UPLOADS_INDEX, uploads);
      return { id, url: `/api/files/${id}`, filename, contentType: mime };
    },

    readUpload(id) {
      if (!UPLOAD_ID_RE.test(String(id)) || !uploads[id]) return null;
      try {
        return { ...uploads[id], buffer: fs.readFileSync(path.join(uploadsPath, id)) };
      } catch {
        return null;
      }
    },

    removeUpload(id) {
      if (!UPLOAD_ID_RE.test(String(id)) || !uploads[id]) return false;
      delete uploads[id];
      writeJson(UPLOADS_INDEX, uploads);
      try {
        fs.rmSync(path.join(uploadsPath, id), { force: true });
      } catch (err) {
        onError('investors:upload-remove', err?.message || err);
      }
      return true;
    },
  };
}
