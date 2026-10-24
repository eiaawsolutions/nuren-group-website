import { describe, it, expect } from 'vitest';
import { createS3Uploader, s3UploaderFromEnv } from './s3.js';

const PDF = Buffer.from('%PDF-1.7 test');
const BASE = 'https://s3.ap-southeast-1.amazonaws.com/nurengroup.com';

// A fake S3: `existing` keys answer 412 to a conditional PUT; `privateKeys`
// answer 403 to the anonymous check afterwards.
function fakeS3({ existing = [], privateKeys = [], putStatus } = {}) {
  const puts = [];
  const heads = [];
  const taken = new Set(existing);
  return {
    puts,
    heads,
    signedFetch: async (url, init) => {
      puts.push({ url, init });
      const key = url.slice(BASE.length + 1);
      if (putStatus) return new Response('nope', { status: putStatus });
      if (init.headers['If-None-Match'] === '*' && taken.has(key)) return new Response('', { status: 412 });
      taken.add(key);
      return new Response('', { status: 200 });
    },
    publicFetch: async (url, init) => {
      heads.push({ url, init });
      const key = url.slice(BASE.length + 1);
      return new Response('', { status: privateKeys.includes(key) ? 403 : 200 });
    },
  };
}

const uploaderWith = (s3) =>
  createS3Uploader({ bucket: 'nurengroup.com', region: 'ap-southeast-1', signedFetch: s3.signedFetch, publicFetch: s3.publicFetch });

describe('createS3Uploader', () => {
  it('puts the file at <folder>/pdf/<slug>.pdf, like the investor site', async () => {
    const s3 = fakeS3();
    const result = await uploaderWith(s3).upload({ folder: 'announcement', slug: 'agm-2027', buffer: PDF, mime: 'application/pdf', ext: 'pdf' });
    expect(result.url).toBe(`${BASE}/announcement/pdf/agm-2027.pdf`);
    expect(s3.puts).toHaveLength(1);
    expect(s3.puts[0].init).toMatchObject({ method: 'PUT', headers: { 'Content-Type': 'application/pdf', 'If-None-Match': '*' } });
    expect(Buffer.from(s3.puts[0].init.body).equals(PDF)).toBe(true);
    expect(s3.heads[0]).toMatchObject({ url: result.url, init: { method: 'HEAD' } });
  });

  it('never overwrites an existing file: it moves on to -2, -3', async () => {
    const s3 = fakeS3({ existing: ['finance-report/pdf/q3.pdf', 'finance-report/pdf/q3-2.pdf'] });
    const result = await uploaderWith(s3).upload({ folder: 'finance-report', slug: 'q3', buffer: PDF, mime: 'application/pdf', ext: 'pdf' });
    expect(result.url).toBe(`${BASE}/finance-report/pdf/q3-3.pdf`);
  });

  it('names a file "document" when there is no headline yet', async () => {
    const s3 = fakeS3();
    const result = await uploaderWith(s3).upload({ folder: 'announcement', slug: '', buffer: PDF, mime: 'application/pdf', ext: 'pdf' });
    expect(result.url).toBe(`${BASE}/announcement/pdf/document.pdf`);
  });

  it('keeps Word files under their own extension', async () => {
    const s3 = fakeS3();
    const result = await uploaderWith(s3).upload({ folder: 'announcement', slug: 'notes', buffer: PDF, mime: 'application/msword', ext: 'doc' });
    expect(result.url).toBe(`${BASE}/announcement/pdf/notes.doc`);
  });

  it('reports a file the public cannot open', async () => {
    const s3 = fakeS3({ privateKeys: ['announcement/pdf/secret.pdf'] });
    await expect(uploaderWith(s3).upload({ folder: 'announcement', slug: 'secret', buffer: PDF, mime: 'application/pdf', ext: 'pdf' }))
      .rejects.toThrow(/not publicly readable/);
  });

  it('reports S3 refusing the upload', async () => {
    const s3 = fakeS3({ putStatus: 403 });
    await expect(uploaderWith(s3).upload({ folder: 'announcement', slug: 'x', buffer: PDF, mime: 'application/pdf', ext: 'pdf' }))
      .rejects.toThrow(/S3 refused the upload \(403\)/);
  });

  it('refuses folders outside the investor ones', async () => {
    const s3 = fakeS3();
    await expect(uploaderWith(s3).upload({ folder: 'mediahub', slug: 'x', buffer: PDF, mime: 'application/pdf', ext: 'pdf' }))
      .rejects.toThrow();
    expect(s3.puts).toHaveLength(0);
  });
});

describe('s3UploaderFromEnv', () => {
  it('is off until both AWS keys are set', () => {
    expect(s3UploaderFromEnv({})).toBeNull();
    expect(s3UploaderFromEnv({ AWS_ACCESS_KEY_ID: 'a' })).toBeNull();
  });

  it('defaults to the investor site bucket and region', () => {
    const uploader = s3UploaderFromEnv({ AWS_ACCESS_KEY_ID: 'a', AWS_SECRET_ACCESS_KEY: 'b' });
    expect(uploader).toMatchObject({ bucket: 'nurengroup.com', region: 'ap-southeast-1' });
  });

  it('takes the bucket and region from the environment when given', () => {
    const uploader = s3UploaderFromEnv({ AWS_ACCESS_KEY_ID: 'a', AWS_SECRET_ACCESS_KEY: 'b', S3_BUCKET: 'other', AWS_REGION: 'ap-southeast-5' });
    expect(uploader).toMatchObject({ bucket: 'other', region: 'ap-southeast-5' });
  });
});
