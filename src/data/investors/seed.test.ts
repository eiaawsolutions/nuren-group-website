import { describe, it, expect } from 'vitest';
import { validateRecord, isS3Pdf, slugify } from '../../../server/investors/validate.js';
import { allGovernanceDocs } from './governanceDocs.js';
import announcements from './announcements.seed.json';
import reports from './financial-reports.seed.json';

const rows = [...announcements, ...reports];

describe('investor seed data', () => {
  it('has the rows published on the investor site', () => {
    expect(announcements).toHaveLength(35);
    expect(reports).toHaveLength(17);
  });

  it('gives every row a unique id and a unique slug per list', () => {
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    expect(new Set(announcements.map((r) => r.slug)).size).toBe(announcements.length);
    expect(new Set(reports.map((r) => r.slug)).size).toBe(reports.length);
  });

  it('passes the same validation the admin form uses', () => {
    for (const row of announcements) expect(validateRecord('announcements', row).errors, row.id).toEqual({});
    for (const row of reports) expect(validateRecord('financial-reports', row).errors, row.id).toEqual({});
  });

  it('links every row to its PDF in the investor S3 bucket, named after its slug', () => {
    for (const r of announcements) expect(r.url, r.id).toBe(`https://s3.ap-southeast-1.amazonaws.com/nurengroup.com/announcement/pdf/${r.slug}.pdf`);
    for (const r of reports) expect(r.url, r.id).toBe(`https://s3.ap-southeast-1.amazonaws.com/nurengroup.com/finance-report/pdf/${r.slug}.pdf`);
    for (const r of rows) expect(isS3Pdf(r.url), r.url).toBe(true);
  });

  it('uses slugs that follow the investor site rule', () => {
    for (const r of rows) expect(r.slug, r.id).toMatch(/^[a-z0-9][a-z0-9-]{0,119}$/);
    // Most slugs are the slug of the title; a few titles were edited later and kept their slug.
    const derived = rows.filter((r) => slugify('headline' in r ? r.headline : r.title) === r.slug);
    expect(derived.length).toBeGreaterThanOrEqual(rows.length - 2);
  });

  it('lists 13 governance documents in the bucket: 3 charters and 10 policies', () => {
    expect(allGovernanceDocs).toHaveLength(13);
    expect(new Set(allGovernanceDocs.map((d) => d.slug)).size).toBe(13);
    for (const d of allGovernanceDocs) {
      expect(d.pdflink).toBe(`https://s3.ap-southeast-1.amazonaws.com/nurengroup.com/corporate-governance/pdf/${d.slug}.pdf`);
    }
  });
});
