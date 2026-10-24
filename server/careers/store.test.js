import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { createJobStore, JOBS_FILE } from './store.js';

const seed = [
  { id: 'job-a', position: 'Backend Dev', description: '', tags: [], salary: 'MYR 5000', location: 'PJ', open: false },
  { id: 'job-b', position: 'Senior Digital Marketing Executive', description: '<p>x</p>', tags: ['social'], salary: 'MYR 3,000', location: 'Jaya One', open: true },
  { id: 'job-c', position: 'Marketing Intern', description: '', tags: [], salary: 'MYR 850', location: 'Jaya One', open: true },
];

const intern = { position: 'Video Editor', description: '<p>Edit</p>', tags: ['Video'], salary: 'MYR 3,000', location: 'Jaya One', open: true };

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nuren-jobs-'));
});

const open = (onError) => createJobStore({ dir, seed, onError });

describe('createJobStore', () => {
  it('writes the seed on first boot and lists every position in its order', () => {
    const store = open();
    expect(store.writable).toBe(true);
    expect(fs.existsSync(path.join(dir, JOBS_FILE))).toBe(true);
    expect(store.list().map((j) => j.id)).toEqual(['job-a', 'job-b', 'job-c']);
  });

  it('lists only open positions for the careers page', () => {
    expect(open().list({ openOnly: true }).map((j) => j.id)).toEqual(['job-b', 'job-c']);
  });

  it('adds new positions at the end, as the careers database did', () => {
    const store = open();
    const created = store.create(intern);
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(store.list().at(-1)).toEqual(created);
  });

  it('keeps edits, closes and deletes across a restart', () => {
    const store = open();
    const created = store.create(intern);
    store.update('job-b', { ...seed[1], open: false });
    expect(store.remove('job-c')).toBe(true);

    const reopened = open();
    expect(reopened.list().map((j) => j.id)).toEqual(['job-a', 'job-b', created.id]);
    expect(reopened.get('job-b').open).toBe(false);
    expect(reopened.list({ openOnly: true }).map((j) => j.id)).toEqual([created.id]);
  });

  it('keeps the id on update and reports unknown ids', () => {
    const store = open();
    expect(store.update('job-b', { ...intern, id: 'other' }).id).toBe('job-b');
    expect(store.update('nope', intern)).toBeNull();
    expect(store.remove('nope')).toBe(false);
    expect(store.get('nope')).toBeNull();
  });

  it('moves an unreadable file aside and starts again from the seed', () => {
    fs.writeFileSync(path.join(dir, JOBS_FILE), '{not json');
    const errors = [];
    const store = open((scope, detail) => errors.push([scope, detail]));
    expect(store.list()).toHaveLength(3);
    expect(errors[0][0]).toBe('careers:corrupt');
    expect(fs.readdirSync(dir).some((f) => f.startsWith(`${JOBS_FILE}.corrupt-`))).toBe(true);
  });

  it('does not change the seed it was given', () => {
    const store = open();
    store.update('job-b', { ...seed[1], position: 'Changed' });
    expect(seed[1].position).toBe('Senior Digital Marketing Executive');
  });
});
