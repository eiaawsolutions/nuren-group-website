import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { validateEnquiry, ENQUIRY_TYPES, BUDGET_RANGES } from './enquiry.js';
import { sanitizeAttachment, MAX_ATTACHMENT_BYTES } from './attachment.js';
import { createLeadStore } from './store.js';
import { renderLeadEmail, leadsToCsv } from './format.js';

const valid = {
  type: 'advertising',
  name: 'Mei Lin',
  email: 'mei@brand.com',
  phone: '+60 12-345 6789',
  company: 'Drypers',
  audience: 'First-time mums, 25 to 35',
  period: 'Mar to May 2027',
  budget: 'RM30,000 to RM100,000',
  message: 'We want a launch campaign.',
};

describe('validateEnquiry', () => {
  it('accepts a complete campaign enquiry', () => {
    const { value, errors } = validateEnquiry(valid);
    expect(errors).toEqual({});
    expect(value).toMatchObject({ typeLabel: ENQUIRY_TYPES.advertising, company: 'Drypers', budget: BUDGET_RANGES[2] });
  });

  it('reports each missing required field', () => {
    const { errors } = validateEnquiry({});
    expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'name', 'phone', 'type']);
  });

  it('rejects an unknown enquiry type, a bad email and a bad phone number', () => {
    const { errors } = validateEnquiry({ ...valid, type: 'hack', email: 'nope', phone: 'abc' });
    expect(errors).toHaveProperty('type');
    expect(errors).toHaveProperty('email');
    expect(errors).toHaveProperty('phone');
  });

  it('drops campaign details for enquiry types that do not run campaigns', () => {
    const { value } = validateEnquiry({ ...valid, type: 'press' });
    expect(value).toMatchObject({ audience: '', period: '', budget: '' });
  });

  it('ignores a budget that is not one of the offered ranges', () => {
    expect(validateEnquiry({ ...valid, budget: 'RM1 billion' }).value.budget).toBe('');
  });

  it('keeps single-line fields on one line (they end up in an email subject)', () => {
    const { value } = validateEnquiry({ ...valid, company: 'Acme\r\nBcc: x@y.z' });
    expect(value.company).not.toMatch(/[\r\n]/);
  });

  it('caps long text', () => {
    expect(validateEnquiry({ ...valid, message: 'a'.repeat(9000) }).value.message).toHaveLength(4000);
  });
});

const b64 = (bytes, size = 64) => Buffer.concat([Buffer.from(bytes), Buffer.alloc(size)]).toString('base64');
const PDF = [0x25, 0x50, 0x44, 0x46];

describe('sanitizeAttachment', () => {
  it('passes when there is no attachment', () => {
    expect(sanitizeAttachment(undefined)).toEqual({ attachment: null });
  });

  it('accepts a real PDF and returns its bytes and mime type', () => {
    const { attachment } = sanitizeAttachment({ filename: 'Brief 2027.pdf', data: b64(PDF) });
    expect(attachment).toMatchObject({ filename: 'Brief 2027.pdf', mime: 'application/pdf' });
    expect(attachment.buffer.subarray(0, 4)).toEqual(Buffer.from(PDF));
  });

  it('refuses extensions that are not on the allow-list', () => {
    expect(sanitizeAttachment({ filename: 'run.exe', data: b64([0x4d, 0x5a]) })).toHaveProperty('error');
    expect(sanitizeAttachment({ filename: 'page.html', data: b64([0x3c]) })).toHaveProperty('error');
  });

  it('refuses a file whose bytes do not match its extension', () => {
    expect(sanitizeAttachment({ filename: 'brief.pdf', data: b64([0x4d, 0x5a, 0x90]) })).toHaveProperty('error');
  });

  it('refuses files over the size limit', () => {
    const big = Buffer.concat([Buffer.from(PDF), Buffer.alloc(MAX_ATTACHMENT_BYTES)]).toString('base64');
    expect(sanitizeAttachment({ filename: 'brief.pdf', data: big }).error).toMatch(/4 MB/);
  });

  it('refuses malformed base64 and malformed shapes', () => {
    expect(sanitizeAttachment({ filename: 'a.pdf', data: 'not base64!!' })).toHaveProperty('error');
    expect(sanitizeAttachment({ filename: 'a.pdf' })).toHaveProperty('error');
    expect(sanitizeAttachment('x')).toHaveProperty('error');
  });

  it('reduces the file name to safe characters', () => {
    const { attachment } = sanitizeAttachment({ filename: '..\\..\\etc/<script>"brief".pdf', data: b64(PDF) });
    expect(attachment.filename).toMatch(/^[\w .()-]+\.pdf$/);
    expect(attachment.filename).not.toMatch(/[\\/<>"]/);
  });
});

const lead = (over = {}) => ({
  id: 'lead-1',
  ts: '2026-10-06T08:00:00.000Z',
  ...validateEnquiry(valid).value,
  attachment: null,
  transcript: [],
  delivery: 'sent',
  ...over,
});

describe('createLeadStore', () => {
  const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'leads-'));

  it('keeps leads across a restart, newest first, with their attached brief', () => {
    const dir = tmp();
    const first = createLeadStore({ dir });
    const buffer = Buffer.from('%PDF-brief');
    first.add(lead({ id: 'a', attachment: { filename: 'brief.pdf', mime: 'application/pdf', size: buffer.length } }), { buffer });
    first.add(lead({ id: 'b' }));

    const second = createLeadStore({ dir });
    expect(second.list().map((l) => l.id)).toEqual(['b', 'a']);
    expect(second.readAttachment('a').buffer.toString()).toBe('%PDF-brief');
    expect(second.readAttachment('b')).toBeNull();
  });

  it('still holds leads in memory when the disk is unusable', () => {
    const blocker = path.join(tmp(), 'file');
    fs.writeFileSync(blocker, 'x');
    const errors = [];
    const store = createLeadStore({ dir: path.join(blocker, 'nested'), onError: (scope) => errors.push(scope) });
    store.add(lead());
    expect(store.writable).toBe(false);
    expect(store.list()).toHaveLength(1);
    expect(errors).toContain('leads:init');
  });

  it('skips a corrupt line instead of failing to start', () => {
    const dir = tmp();
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'leads.jsonl'), `${JSON.stringify(lead({ id: 'ok' }))}\n{broken\n`);
    expect(createLeadStore({ dir }).list().map((l) => l.id)).toEqual(['ok']);
  });
});

describe('renderLeadEmail', () => {
  const meta = { ip: '1.2.3.4', userAgent: 'test' };

  it('puts the brand and enquiry type in the subject, on one line', () => {
    const { subject } = renderLeadEmail(lead(), meta);
    expect(subject).toBe('Nuren Group Website Enquiry: Advertising or campaign (Drypers)');
  });

  it('lists the campaign details and the attached brief', () => {
    const { text } = renderLeadEmail(lead({ attachment: { filename: 'brief.pdf', mime: 'x', size: 2048 } }), meta);
    expect(text).toContain('Target audience:');
    expect(text).toContain('Mar to May 2027');
    expect(text).toContain('brief.pdf (2 KB)');
  });

  it('escapes what the visitor typed in the HTML body', () => {
    const { html } = renderLeadEmail(lead({ message: '<img src=x onerror=alert(1)>', company: '<b>x</b>' }), meta);
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img');
  });
});

describe('leadsToCsv', () => {
  it('has a header row and quotes cells containing commas, quotes and newlines', () => {
    const csv = leadsToCsv([lead({ message: 'Hi, "team"\nthanks' })]);
    expect(csv.startsWith('﻿Received,Enquiry type')).toBe(true);
    expect(csv).toContain('"Hi, ""team""\nthanks"');
  });

  it('defuses spreadsheet formulas', () => {
    const csv = leadsToCsv([lead({ name: '=HYPERLINK("http://evil","x")', company: '+cmd' })]);
    expect(csv).toContain(`"'=HYPERLINK(""http://evil"",""x"")"`);
    expect(csv).toContain(`'+cmd`);
  });
});
