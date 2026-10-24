import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createJobStore } from './store.js';
import { registerCareerRoutes } from './routes.js';

const AUTH = `Basic ${Buffer.from('admin:pw').toString('base64')}`;

const seed = [
  { id: 'job-a', position: 'Backend Dev', description: 'test', tags: [], salary: 'MYR 5000', location: 'PJ', open: false },
  { id: 'job-b', position: 'Senior Digital Marketing Executive', description: '<p>x</p>', tags: ['social'], salary: 'MYR 3,000', location: 'Jaya One', open: true },
  { id: 'job-c', position: 'Marketing Intern', description: '', tags: [], salary: 'MYR 850', location: 'Jaya One', open: true },
];

const newJob = { position: 'Video Editor', description: '<p>Edit</p>', tags: ['Video'], salary: 'MYR 3,000', location: 'Jaya One', open: true };

let server;
let base;

function adminAuth(req, res, next) {
  if (req.headers.authorization === AUTH) return next();
  return res.status(401).json({ error: 'Authentication required.' });
}

beforeEach(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nuren-career-routes-'));
  const app = express();
  app.use(express.json({ limit: '64kb' }));
  registerCareerRoutes(app, { store: createJobStore({ dir, seed }), adminAuth });
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
});

const admin = (p, init = {}) => fetch(`${base}${p}`, { ...init, headers: { Authorization: AUTH, ...(init.headers || {}) } });
const sendJson = (p, method, body, headers = {}) =>
  admin(p, { method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', ...headers } });

describe('GET /api/getJobPosition', () => {
  it('serves the open positions in the investor site response shape', async () => {
    const res = await fetch(`${base}/api/getJobPosition`);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-cache');
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.totalDocs).toBe(2);
    expect(json.data.data.map((j) => j.position)).toEqual(['Senior Digital Marketing Executive', 'Marketing Intern']);
  });

  it('searches position titles as plain text, ignoring case', async () => {
    const json = await (await fetch(`${base}/api/getJobPosition?search=INTERN`)).json();
    expect(json.data.data.map((j) => j.id)).toEqual(['job-c']);
    // Regex characters are just text (the investor site built a RegExp from the query).
    const odd = await (await fetch(`${base}/api/getJobPosition?search=${encodeURIComponent('(.*')}`)).json();
    expect(odd.data.totalDocs).toBe(0);
  });
});

describe('admin job positions', () => {
  it('need the admin login', async () => {
    expect((await fetch(`${base}/admin/api/job-positions`)).status).toBe(401);
    const res = await fetch(`${base}/admin/api/job-positions`, {
      method: 'POST',
      body: JSON.stringify(newJob),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status).toBe(401);
  });

  it('list every position, closed ones included', async () => {
    const json = await (await admin('/admin/api/job-positions')).json();
    expect(json.records.map((j) => j.id)).toEqual(['job-a', 'job-b', 'job-c']);
  });

  it('add a position, sanitising its description, and show it on the careers page', async () => {
    const res = await sendJson('/admin/api/job-positions', 'POST', { ...newJob, description: '<p onmouseover="x()">Edit</p><script>alert(1)</script>' });
    expect(res.status).toBe(201);
    const { record } = await res.json();
    expect(record.description).toBe('<p>Edit</p>');
    const list = await (await fetch(`${base}/api/getJobPosition`)).json();
    expect(list.data.data.at(-1).position).toBe('Video Editor');
  });

  it('refuse an invalid position with field errors', async () => {
    const res = await sendJson('/admin/api/job-positions', 'POST', { ...newJob, salary: '' });
    expect(res.status).toBe(400);
    expect((await res.json()).errors.salary).toBeTruthy();
  });

  it('close a position, which takes it off the careers page', async () => {
    const res = await sendJson('/admin/api/job-positions/job-c', 'PUT', { ...seed[2], open: false });
    expect(res.status).toBe(200);
    const list = await (await fetch(`${base}/api/getJobPosition`)).json();
    expect(list.data.data.map((j) => j.id)).toEqual(['job-b']);
  });

  it('delete a position', async () => {
    expect((await admin('/admin/api/job-positions/job-b', { method: 'DELETE' })).status).toBe(204);
    expect((await admin('/admin/api/job-positions/job-b', { method: 'DELETE' })).status).toBe(404);
    expect((await sendJson('/admin/api/job-positions/nope', 'PUT', newJob)).status).toBe(404);
  });

  it('refuse cross-site changes', async () => {
    const res = await sendJson('/admin/api/job-positions', 'POST', newJob, { Origin: 'https://evil.example' });
    expect(res.status).toBe(403);
  });
});
