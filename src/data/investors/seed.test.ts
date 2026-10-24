import { describe, it, expect } from 'vitest';
import { validateRecord } from '../../../server/investors/validate.js';
import { allGovernanceDocs } from './governanceDocs.js';
import announcements from './announcements.seed.json';
import reports from './financial-reports.seed.json';

describe('investor seed data', () => {
  it('has the rows ported from the investor site', () => {
    expect(announcements).toHaveLength(34);
    expect(reports).toHaveLength(16);
  });

  it('gives every row a unique id', () => {
    const ids = [...announcements, ...reports].map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('passes the same validation the admin form uses', () => {
    for (const row of announcements) expect(validateRecord('announcements', row).errors, row.id).toEqual({});
    for (const row of reports) expect(validateRecord('financial-reports', row).errors, row.id).toEqual({});
  });

  it('lists 13 governance documents: 3 charters and 10 policies', () => {
    expect(allGovernanceDocs).toHaveLength(13);
    expect(new Set(allGovernanceDocs.map((d) => d.slug)).size).toBe(13);
  });
});
