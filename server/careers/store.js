// Where the careers page's job positions live. The investor site kept them in
// MongoDB; here they are one JSON file beside the investor records (in
// INVESTOR_DATA_DIR, on the Railway volume), seeded from the repo's seed JSON
// on first boot. Positions keep the order they were added in, as the careers
// database returned them. If the disk is not writable the store keeps working
// in memory (lost on restart), and `writable` says so.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { readJsonFile, writeJsonAtomic } from '../json-file.js';

export const JOBS_FILE = 'job-positions.json';

export function createJobStore({ dir, seed = [], onError = () => {} }) {
  const file = path.join(dir, JOBS_FILE);
  let writable = true;
  let jobs = seed.map((job) => ({ ...job, tags: [...(job.tags ?? [])] }));

  const save = () => {
    if (!writable) return;
    try {
      writeJsonAtomic(file, jobs);
    } catch (err) {
      onError('careers:write', err?.message || err);
    }
  };

  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    writable = false;
    onError('careers:init', err?.message || err);
  }

  if (writable) {
    const { data, fresh } = readJsonFile(file, jobs, (detail) => onError('careers:corrupt', detail));
    if (Array.isArray(data)) jobs = data;
    if (fresh) save();
  }

  const indexOf = (id) => jobs.findIndex((job) => job.id === id);

  return {
    get writable() {
      return writable;
    },

    /** Every position; the careers page asks for the open ones only. */
    list({ openOnly = false } = {}) {
      return jobs.filter((job) => !openOnly || job.open);
    },

    get(id) {
      return jobs.find((job) => job.id === id) ?? null;
    },

    /** `value` must already be validated (see validate.js). */
    create(value) {
      const job = { id: crypto.randomUUID(), ...value };
      jobs.push(job);
      save();
      return job;
    },

    update(id, value) {
      const index = indexOf(id);
      if (index === -1) return null;
      jobs[index] = { ...value, id };
      save();
      return jobs[index];
    },

    remove(id) {
      const index = indexOf(id);
      if (index === -1) return false;
      jobs.splice(index, 1);
      save();
      return true;
    },
  };
}
