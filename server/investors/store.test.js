import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { createInvestorStore, UPLOAD_ID_RE } from './store.js';

const PDF = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(32)]);

const seeds = {
  announcements: [
    { id: 'ann-a', code: '40060', category: 'C', headline: 'Older', description: '', date: '2026-06-25T14:30:43', priceSensitive: false, url: 'https://s3.ap-southeast-1.amazonaws.com/nurengroup.com/announcement/pdf/a.pdf', active: true, sortOrder: 1 },
    { id: 'ann-b', code: '40060', category: 'C', headline: 'Newest', description: '', date: '2026-06-30T09:10:12', priceSensitive: false, url: 'https://s3.ap-southeast-1.amazonaws.com/nurengroup.com/announcement/pdf/b.pdf', active: true, sortOrder: 0 },
    { id: 'ann-c', code: '40999', category: 'C', headline: 'Hidden', description: '', date: '2026-07-01T09:00:00', priceSensitive: false, url: 'https://s3.ap-southeast-1.amazonaws.com/nurengroup.com/announcement/pdf/c.pdf', active: false },
    { id: 'ann-d', code: '41999', category: 'C', headline: 'Same second, later sort', description: '', date: '2026-06-25T14:30:43', priceSensitive: false, url: 'https://s3.ap-southeast-1.amazonaws.com/nurengroup.com/announcement/pdf/d.pdf', active: true, sortOrder: 5 },
  ],
  'financial-reports': [
    { id: 'rpt-a', code: '40510', category: 'R', title: 'Annual', description: '', date: '2025-06-18T09:13:41', priceSensitive: false, type: 'file', url: 'https://s3.ap-southeast-1.amazonaws.com/nurengroup.com/announcement/pdf/e.pdf', active: true },
  ],
};

const newAnnouncement = {
  code: '40810', category: 'NSX Director Appointment', headline: 'New one', description: 'desc',
  date: '2026-08-01T10:00:00', priceSensitive: false, url: 'https://s3.ap-southeast-1.amazonaws.com/nurengroup.com/announcement/pdf/f.pdf', active: true,
};

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nuren-investors-'));
});

const open = (onError) => createInvestorStore({ dir, seeds, onError });

describe('createInvestorStore: seeding', () => {
  it('writes the seed files on first boot', () => {
    const store = open();
    expect(store.writable).toBe(true);
    expect(fs.existsSync(path.join(dir, 'announcements.json'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'financial-reports.json'))).toBe(true);
    expect(store.list('announcements', { includeInactive: true })).toHaveLength(4);
  });

  it('does not reseed over existing data', () => {
    const first = open();
    first.remove('announcements', 'ann-a');
    const second = open();
    expect(second.get('announcements', 'ann-a')).toBeNull();
    expect(second.list('announcements', { includeInactive: true })).toHaveLength(3);
  });

  it('sets a corrupt file aside, reseeds, and reports it', () => {
    fs.writeFileSync(path.join(dir, 'announcements.json'), '{not json');
    const errors = [];
    const store = open((scope) => errors.push(scope));
    expect(store.list('announcements', { includeInactive: true })).toHaveLength(4);
    expect(errors).toContain('investors:corrupt');
    expect(fs.readdirSync(dir).some((f) => f.startsWith('announcements.json.corrupt-'))).toBe(true);
  });
});

describe('createInvestorStore: listing', () => {
  it('lists only visible rows, newest first, ties broken by sortOrder', () => {
    const store = open();
    expect(store.list('announcements').map((r) => r.id)).toEqual(['ann-b', 'ann-a', 'ann-d']);
  });

  it('includes hidden rows for the admin', () => {
    const store = open();
    expect(store.list('announcements', { includeInactive: true }).map((r) => r.id)).toEqual(['ann-c', 'ann-b', 'ann-a', 'ann-d']);
  });
});

describe('createInvestorStore: changes persist across a restart', () => {
  it('creates a record with a fresh id', () => {
    const store = open();
    const created = store.create('announcements', newAnnouncement);
    expect(created.id).toMatch(UPLOAD_ID_RE);
    expect(open().get('announcements', created.id)).toMatchObject(newAnnouncement);
  });

  it('gives a new record a slug from its headline, unique within the collection', () => {
    const store = open();
    const first = store.create('announcements', newAnnouncement);
    const second = store.create('announcements', newAnnouncement);
    expect(first.slug).toBe('new-one');
    expect(second.slug).toBe('new-one-2');
    const report = store.create('financial-reports', { ...seeds['financial-reports'][0], title: '40510 Annual Report - 2026 Annual Report' });
    expect(report.slug).toBe('40510-annual-report-2026-annual-report');
  });

  it('keeps the slug when the headline is edited, so page links never break', () => {
    const store = open();
    const created = store.create('announcements', newAnnouncement);
    const updated = store.update('announcements', created.id, { ...newAnnouncement, headline: 'Renamed' });
    expect(updated.slug).toBe(created.slug);
  });

  it('finds a record by slug', () => {
    const store = open();
    const created = store.create('announcements', newAnnouncement);
    expect(store.getBySlug('announcements', created.slug)?.id).toBe(created.id);
    expect(store.getBySlug('announcements', 'nope')).toBeNull();
  });

  it('updates a record in place and keeps its id', () => {
    const store = open();
    const updated = store.update('announcements', 'ann-a', { ...seeds.announcements[0], headline: 'Edited', active: false });
    expect(updated).toMatchObject({ id: 'ann-a', headline: 'Edited', active: false });
    expect(open().get('announcements', 'ann-a').headline).toBe('Edited');
    expect(open().list('announcements').map((r) => r.id)).not.toContain('ann-a');
  });

  it('returns null when updating or deleting a record that does not exist', () => {
    const store = open();
    expect(store.update('announcements', 'nope', newAnnouncement)).toBeNull();
    expect(store.remove('announcements', 'nope')).toBe(false);
  });

  it('deletes a record', () => {
    const store = open();
    expect(store.remove('financial-reports', 'rpt-a')).toBe(true);
    expect(open().list('financial-reports', { includeInactive: true })).toHaveLength(0);
  });

  it('leaves no temp files behind', () => {
    const store = open();
    store.create('announcements', newAnnouncement);
    expect(fs.readdirSync(dir).filter((f) => f.endsWith('.tmp'))).toEqual([]);
  });
});

describe('createInvestorStore: uploads', () => {
  it('saves, reads and deletes an uploaded file', () => {
    const store = open();
    const saved = store.saveUpload({ buffer: PDF, filename: 'Q3 report.pdf', mime: 'application/pdf' });
    expect(saved).toMatchObject({ filename: 'Q3 report.pdf', contentType: 'application/pdf' });
    expect(saved.url).toBe(`/api/files/${saved.id}`);

    const read = open().readUpload(saved.id);
    expect(read).toMatchObject({ filename: 'Q3 report.pdf', mime: 'application/pdf' });
    expect(read.buffer.equals(PDF)).toBe(true);

    expect(store.removeUpload(saved.id)).toBe(true);
    expect(open().readUpload(saved.id)).toBeNull();
  });

  it('never touches the filesystem for an id that is not a uuid', () => {
    const store = open();
    expect(store.readUpload('../announcements')).toBeNull();
    expect(store.readUpload('..\\..\\server')).toBeNull();
    expect(store.removeUpload('../announcements.json')).toBe(false);
    expect(fs.existsSync(path.join(dir, 'announcements.json'))).toBe(true);
  });
});

describe('createInvestorStore: unwritable disk', () => {
  it('keeps working in memory and says it is not writable', () => {
    const file = path.join(dir, 'blocker');
    fs.writeFileSync(file, 'x');
    const errors = [];
    // A file where the data directory should be: mkdir fails.
    const store = createInvestorStore({ dir: path.join(file, 'nested'), seeds, onError: (s) => errors.push(s) });
    expect(store.writable).toBe(false);
    expect(errors).toContain('investors:init');
    const created = store.create('announcements', newAnnouncement);
    expect(store.get('announcements', created.id)).not.toBeNull();
  });
});
