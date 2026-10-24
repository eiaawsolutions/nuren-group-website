import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createInvestorStore } from './store.js';
import { registerInvestorRoutes, MAX_UPLOAD_BYTES } from './routes.js';

const AUTH = `Basic ${Buffer.from('admin:pw').toString('base64')}`;
const PDF = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(64)]);
const DOCX = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(64)]);
const EXE = Buffer.concat([Buffer.from([0x4d, 0x5a, 0x90, 0x00]), Buffer.alloc(64)]);
const S3 = 'https://s3.ap-southeast-1.amazonaws.com/nurengroup.com';

const seeds = {
  announcements: [
    { id: 'ann-1', code: '40060', category: 'C', headline: 'Visible', description: 'd', date: '2026-06-25T14:30:43', priceSensitive: false, url: `${S3}/announcement/pdf/a.pdf`, active: true, slug: 'visible' },
    { id: 'ann-2', code: '40060', category: 'C', headline: 'Hidden', description: 'd', date: '2026-06-30T09:10:12', priceSensitive: false, url: `${S3}/announcement/pdf/b.pdf`, active: false, slug: 'hidden' },
  ],
  'financial-reports': [
    { id: 'rpt-1', code: '40510', category: 'R', title: 'Annual', description: '', date: '2025-06-18T09:13:41', priceSensitive: false, type: 'file', url: `${S3}/finance-report/pdf/c.pdf`, active: true, slug: 'annual' },
  ],
};

const newAnnouncement = {
  code: '40810', category: 'NSX Director Appointment', headline: 'Appointment of Additional Directors', description: '',
  date: '2026-08-01T10:00', url: `${S3}/announcement/pdf/d.pdf`, active: true,
};

let server;
let base;
let dir;

function adminAuth(req, res, next) {
  if (req.headers.authorization === AUTH) return next();
  return res.status(401).json({ error: 'Authentication required.' });
}

async function start({ uploader = null } = {}) {
  if (server) await new Promise((resolve) => server.close(resolve));
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nuren-investor-routes-'));
  const store = createInvestorStore({ dir, seeds });
  const app = express();
  app.use(express.json({ limit: '64kb' }));
  registerInvestorRoutes(app, { store, adminAuth, uploader, onError: () => {} });
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
}

beforeEach(() => start());

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
  server = null;
});

const admin = (p, init = {}) =>
  fetch(`${base}${p}`, { ...init, headers: { Authorization: AUTH, ...(init.headers || {}) } });
const sendJson = (p, method, body, headers = {}) =>
  admin(p, { method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', ...headers } });
const upload = (bytes, filename, headers = {}) =>
  admin('/admin/api/files', {
    method: 'POST',
    body: bytes,
    headers: { 'Content-Type': 'application/octet-stream', 'X-Filename': encodeURIComponent(filename), ...headers },
  });

describe('public lists', () => {
  it('serve visible announcements in the investor site response shape', async () => {
    const res = await fetch(`${base}/api/getAnnouncements`);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-cache');
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.totalDocs).toBe(1);
    expect(json.data.data.map((r) => r.headline)).toEqual(['Visible']);
  });

  it('serve visible financial reports', async () => {
    const json = await (await fetch(`${base}/api/getFinancialReport`)).json();
    expect(json).toMatchObject({ success: true, data: { totalDocs: 1 } });
    expect(json.data.data[0].title).toBe('Annual');
  });
});

describe('admin records', () => {
  it('need the admin password', async () => {
    expect((await fetch(`${base}/admin/api/announcements`)).status).toBe(401);
    const res = await fetch(`${base}/admin/api/announcements`, {
      method: 'POST', body: JSON.stringify(newAnnouncement), headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status).toBe(401);
  });

  it('list hidden rows too', async () => {
    const json = await (await admin('/admin/api/announcements')).json();
    expect(json.records.map((r) => r.id)).toEqual(['ann-2', 'ann-1']);
  });

  it('create a record that then shows publicly', async () => {
    const res = await sendJson('/admin/api/announcements', 'POST', newAnnouncement);
    expect(res.status).toBe(201);
    const { record } = await res.json();
    expect(record).toMatchObject({ headline: newAnnouncement.headline, date: '2026-08-01T10:00:00' });
    const pub = await (await fetch(`${base}/api/getAnnouncements`)).json();
    expect(pub.data.data[0].id).toBe(record.id);
  });

  it('refuse an invalid record with field errors', async () => {
    const res = await sendJson('/admin/api/announcements', 'POST', { ...newAnnouncement, url: 'javascript:alert(1)', headline: '' });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(Object.keys(json.errors).sort()).toEqual(['headline', 'url']);
  });

  it('hide a record with an update', async () => {
    const res = await sendJson('/admin/api/announcements/ann-1', 'PUT', { ...seeds.announcements[0], active: false });
    expect(res.status).toBe(200);
    const pub = await (await fetch(`${base}/api/getAnnouncements`)).json();
    expect(pub.data.totalDocs).toBe(0);
  });

  it('update and delete only records that exist', async () => {
    expect((await sendJson('/admin/api/financial-reports/nope', 'PUT', seeds['financial-reports'][0])).status).toBe(404);
    expect((await admin('/admin/api/financial-reports/rpt-1', { method: 'DELETE' })).status).toBe(204);
    expect((await admin('/admin/api/financial-reports/rpt-1', { method: 'DELETE' })).status).toBe(404);
  });

  it('refuse cross-site changes', async () => {
    const evil = await sendJson('/admin/api/announcements', 'POST', newAnnouncement, { Origin: 'https://evil.example' });
    expect(evil.status).toBe(403);
    const fetchMeta = await sendJson('/admin/api/announcements', 'POST', newAnnouncement, { 'Sec-Fetch-Site': 'cross-site' });
    expect(fetchMeta.status).toBe(403);
    const same = await sendJson('/admin/api/announcements', 'POST', newAnnouncement, { Origin: base, 'Sec-Fetch-Site': 'same-origin' });
    expect(same.status).toBe(201);
  });
});

describe('uploads', () => {
  it('store a PDF and serve it inline, embeddable by this site only', async () => {
    const res = await upload(PDF, 'Q3 Report.pdf');
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toMatchObject({ success: true, filename: 'Q3 Report.pdf', contentType: 'application/pdf' });
    expect(json.url).toBe(`/api/files/${json.id}`);

    const file = await fetch(`${base}${json.url}`);
    expect(file.status).toBe(200);
    expect(file.headers.get('content-type')).toBe('application/pdf');
    expect(file.headers.get('content-disposition')).toBe('inline; filename="Q3 Report.pdf"');
    expect(file.headers.get('content-security-policy')).toBe("frame-ancestors 'self'");
    expect(file.headers.get('x-content-type-options')).toBe('nosniff');
    expect(Buffer.from(await file.arrayBuffer()).equals(PDF)).toBe(true);
  });

  it('serve Word documents as a download', async () => {
    const json = await (await upload(DOCX, 'notes.docx')).json();
    const file = await fetch(`${base}${json.url}`);
    expect(file.headers.get('content-disposition')).toBe('attachment; filename="notes.docx"');
  });

  it('refuse other file types and files whose bytes do not match', async () => {
    expect((await upload(EXE, 'setup.exe')).status).toBe(400);
    expect((await upload(EXE, 'renamed.pdf')).status).toBe(400);
    expect((await upload(Buffer.alloc(0), 'empty.pdf')).status).toBe(400);
  });

  it('refuse files over the size limit', async () => {
    const big = Buffer.concat([PDF, Buffer.alloc(MAX_UPLOAD_BYTES)]);
    expect((await upload(big, 'big.pdf')).status).toBe(413);
  });

  it('need the admin password and a same-site request', async () => {
    const anon = await fetch(`${base}/admin/api/files`, { method: 'POST', body: PDF, headers: { 'X-Filename': 'a.pdf' } });
    expect(anon.status).toBe(401);
    expect((await upload(PDF, 'a.pdf', { Origin: 'https://evil.example' })).status).toBe(403);
  });

  it('delete an uploaded file', async () => {
    const json = await (await upload(PDF, 'a.pdf')).json();
    expect((await admin(`/admin/api/files/${json.id}`, { method: 'DELETE' })).status).toBe(204);
    expect((await fetch(`${base}${json.url}`)).status).toBe(404);
  });

  it('answer 404 for ids that are not uploads', async () => {
    expect((await fetch(`${base}/api/files/not-a-uuid`)).status).toBe(404);
    expect((await fetch(`${base}/api/files/3f2b8c1e-9d4a-4b7e-8f21-0c6a5e9d1b23`)).status).toBe(404);
  });
});

describe('uploads to the investor S3 bucket, when configured', () => {
  let calls;
  const fakeUploader = (behaviour = async (args) => ({ url: `${S3}/${args.folder}/pdf/${args.slug}.${args.ext}` })) => ({
    bucket: 'nurengroup.com',
    region: 'ap-southeast-1',
    upload: async (args) => {
      calls.push(args);
      return behaviour(args);
    },
  });

  beforeEach(async () => {
    calls = [];
    await start({ uploader: fakeUploader() });
  });

  it('names the file from the record title, in that collection’s folder', async () => {
    const res = await upload(PDF, 'scan 001.pdf', {
      'X-Collection': 'financial-reports',
      'X-Title': encodeURIComponent('40510 Annual Report - 2026 Annual Report'),
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({
      success: true,
      storage: 's3',
      filename: 'scan 001.pdf',
      url: `${S3}/finance-report/pdf/40510-annual-report-2026-annual-report.pdf`,
    });
    expect(calls[0]).toMatchObject({ folder: 'finance-report', slug: '40510-annual-report-2026-annual-report', mime: 'application/pdf', ext: 'pdf' });
  });

  it('falls back to the file name when there is no title yet', async () => {
    await upload(PDF, 'Q3 Report.pdf', { 'X-Collection': 'announcements' });
    expect(calls[0]).toMatchObject({ folder: 'announcement', slug: 'q3-report' });
  });

  it('needs to know which collection the file is for', async () => {
    expect((await upload(PDF, 'a.pdf')).status).toBe(400);
    expect((await upload(PDF, 'a.pdf', { 'X-Collection': 'mediahub' })).status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it('checks the file before sending it to S3', async () => {
    expect((await upload(EXE, 'renamed.pdf', { 'X-Collection': 'announcements' })).status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it('passes on S3 problems as a clear error', async () => {
    await start({ uploader: fakeUploader(async () => { throw new Error('S3 refused the upload (403).'); }) });
    const res = await upload(PDF, 'a.pdf', { 'X-Collection': 'announcements' });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe('S3 refused the upload (403).');
  });
});
