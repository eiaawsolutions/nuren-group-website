import { describe, it, expect } from 'vitest';
import { validateRecord, isAllowedRecordUrl, FIELD_LIMITS, COLLECTIONS } from './validate.js';

const announcement = {
  code: '40060',
  category: 'NSX Removal from Official List',
  headline: '40060 NSX Removal from Official List - Delisting from NSX on 30 Jun26',
  description: 'Delisting from NSX on 30 Jun26',
  date: '2026-06-25T14:30:43',
  priceSensitive: false,
  url: '/announcements-pdfs/delisting-from-nsx-on-30-jun26.pdf',
  active: true,
};

const report = {
  code: '40560',
  category: 'NSX Quarterly Report',
  title: '40560 NSX Quarterly Report - Quarterly Report to 31 December 2025',
  description: 'Quarterly Report to 31 December 2025',
  date: '2026-01-29T09:08:43',
  type: 'file',
  url: '/announcements-pdfs/quarterly-report-to-31-december-2025.pdf',
};

describe('COLLECTIONS', () => {
  it('names the two record collections the admin manages', () => {
    expect(Object.keys(COLLECTIONS).sort()).toEqual(['announcements', 'financial-reports']);
  });
});

describe('validateRecord: announcements', () => {
  it('accepts a complete announcement', () => {
    const { value, errors } = validateRecord('announcements', announcement);
    expect(errors).toEqual({});
    expect(value).toMatchObject({ ...announcement });
  });

  it('reports each missing required field', () => {
    const { errors } = validateRecord('announcements', {});
    expect(Object.keys(errors).sort()).toEqual(['code', 'date', 'headline', 'url']);
  });

  it('defaults active to true and priceSensitive to false', () => {
    const { value } = validateRecord('announcements', { ...announcement, active: undefined, priceSensitive: undefined });
    expect(value.active).toBe(true);
    expect(value.priceSensitive).toBe(false);
  });

  it('keeps hidden rows hidden', () => {
    expect(validateRecord('announcements', { ...announcement, active: false }).value.active).toBe(false);
  });

  it('keeps single-line fields on one line', () => {
    const { value } = validateRecord('announcements', { ...announcement, headline: 'Line one\r\nLine two' });
    expect(value.headline).toBe('Line one Line two');
  });

  it('caps long text', () => {
    const { value } = validateRecord('announcements', { ...announcement, description: 'a'.repeat(9000) });
    expect(value.description).toHaveLength(FIELD_LIMITS.description);
  });

  it('keeps a numeric sortOrder and drops anything else', () => {
    expect(validateRecord('announcements', { ...announcement, sortOrder: 3 }).value.sortOrder).toBe(3);
    expect(validateRecord('announcements', { ...announcement, sortOrder: '3' }).value).not.toHaveProperty('sortOrder');
  });

  it('ignores fields the form does not have', () => {
    const { value } = validateRecord('announcements', { ...announcement, title: 'x', type: 'link', id: 'evil', extra: 1 });
    expect(value).not.toHaveProperty('title');
    expect(value).not.toHaveProperty('type');
    expect(value).not.toHaveProperty('id');
    expect(value).not.toHaveProperty('extra');
  });
});

describe('validateRecord: financial reports', () => {
  it('accepts a complete report and allows an empty code', () => {
    const { value, errors } = validateRecord('financial-reports', { ...report, code: '' });
    expect(errors).toEqual({});
    expect(value).toMatchObject({ title: report.title, type: 'file', code: '' });
  });

  it('reports each missing required field', () => {
    const { errors } = validateRecord('financial-reports', {});
    expect(Object.keys(errors).sort()).toEqual(['date', 'title', 'url']);
  });

  it('defaults an unknown type to file', () => {
    expect(validateRecord('financial-reports', { ...report, type: 'video' }).value.type).toBe('file');
    expect(validateRecord('financial-reports', { ...report, type: 'link' }).value.type).toBe('link');
  });
});

describe('validateRecord: dates', () => {
  it('adds seconds to a date without them', () => {
    expect(validateRecord('announcements', { ...announcement, date: '2026-06-25T14:30' }).value.date).toBe('2026-06-25T14:30:00');
  });

  it('rejects timezones, date-only strings and impossible dates', () => {
    for (const date of ['2026-06-25T14:30:43Z', '2026-06-25', '2026-13-01T10:00:00', '2026-02-30T10:00:00', '2026-06-25T24:00:00', 'yesterday']) {
      expect(validateRecord('announcements', { ...announcement, date }).errors, date).toHaveProperty('date');
    }
  });
});

describe('isAllowedRecordUrl', () => {
  it('allows self-hosted PDFs, uploaded files and https links', () => {
    expect(isAllowedRecordUrl('/announcements-pdfs/2025-annual-report.pdf')).toBe(true);
    expect(isAllowedRecordUrl('/api/files/3f2b8c1e-9d4a-4b7e-8f21-0c6a5e9d1b23')).toBe(true);
    expect(isAllowedRecordUrl('https://drive.google.com/file/d/abc/view')).toBe(true);
  });

  it('refuses scripts, plain http, other paths and traversal', () => {
    for (const url of [
      'javascript:alert(1)',
      'JAVASCRIPT:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'http://example.com/a.pdf',
      '//evil.com/a.pdf',
      '/\\evil.com',
      '/announcements-pdfs/../server.js',
      '/announcements-pdfs/report.PDF.exe',
      '/announcements-pdfs/Report Final.pdf',
      '/api/files/not-a-uuid',
      '/api/files/../../etc/passwd',
      'https://exa mple.com',
      `https://example.com/${'a'.repeat(600)}`,
      '',
    ]) {
      expect(isAllowedRecordUrl(url), url).toBe(false);
    }
  });

  it('is enforced by validateRecord', () => {
    const { errors } = validateRecord('announcements', { ...announcement, url: 'javascript:alert(1)' });
    expect(errors).toHaveProperty('url');
  });
});

describe('validateRecord: unknown collection', () => {
  it('throws, because that is a programming error', () => {
    expect(() => validateRecord('media', announcement)).toThrow();
  });
});
