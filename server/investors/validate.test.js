import { describe, it, expect } from 'vitest';
import {
  validateRecord, isAllowedRecordUrl, isS3Pdf, s3PdfUrl, slugify, FIELD_LIMITS, COLLECTIONS, SLUG_MAX,
} from './validate.js';

const S3 = 'https://s3.ap-southeast-1.amazonaws.com/nurengroup.com';

const announcement = {
  code: '40060',
  category: 'NSX Removal from Official List',
  headline: '40060 NSX Removal from Official List - Delisting from NSX on 30 Jun26',
  description: 'Delisting from NSX on 30 Jun26',
  date: '2026-06-25T14:30:43',
  priceSensitive: false,
  url: `${S3}/announcement/pdf/40060-nsx-removal-from-official-list-delisting-from-nsx-on-30-jun26.pdf`,
  active: true,
};

const report = {
  code: '40560',
  category: 'NSX Quarterly Report',
  title: '40560 NSX Quarterly Report - Quarterly Report to 31 December 2025',
  description: 'Quarterly Report to 31 December 2025',
  date: '2026-01-29T09:08:43',
  type: 'file',
  url: `${S3}/finance-report/pdf/40560-nsx-quarterly-report-quarterly-report-to-31-december-2025.pdf`,
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

  it('ignores fields the form does not have, including the server-managed slug', () => {
    const { value } = validateRecord('announcements', { ...announcement, title: 'x', type: 'link', id: 'evil', slug: '../x', extra: 1 });
    expect(value).not.toHaveProperty('title');
    expect(value).not.toHaveProperty('type');
    expect(value).not.toHaveProperty('id');
    expect(value).not.toHaveProperty('slug');
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
  it('allows the investor S3 bucket, uploaded files and https links', () => {
    expect(isAllowedRecordUrl(`${S3}/finance-report/pdf/40510-nsx-annual-report-2025-annual-report.pdf`)).toBe(true);
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
      // The PDFs now live on S3; there are no self-hosted copies to link to.
      '/announcements-pdfs/2025-annual-report.pdf',
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

describe('isS3Pdf / s3PdfUrl', () => {
  it('recognises PDFs in the investor folders of the bucket', () => {
    expect(isS3Pdf(`${S3}/announcement/pdf/agm-meeting-minutes-and-result-2026-agm.pdf`)).toBe(true);
    expect(isS3Pdf(`${S3}/finance-report/pdf/40510-annual-report-2026-annual-report.pdf`)).toBe(true);
    expect(isS3Pdf(`${S3}/corporate-governance/pdf/board-charter.pdf`)).toBe(true);
  });

  it('refuses other buckets, folders, file types and tricks', () => {
    for (const url of [
      'https://s3.ap-southeast-1.amazonaws.com/other-bucket/announcement/pdf/a.pdf',
      `${S3}/mediahub/pdf/a.pdf`,
      `${S3}/announcement/pdf/a.docx`,
      `${S3}/announcement/pdf/../../secret.pdf`,
      `${S3}/announcement/pdf/a.pdf?x=1`,
      `${S3}.evil.com/announcement/pdf/a.pdf`,
      'http://s3.ap-southeast-1.amazonaws.com/nurengroup.com/announcement/pdf/a.pdf',
    ]) {
      expect(isS3Pdf(url), url).toBe(false);
    }
  });

  it('builds the same URL shape the investor site used', () => {
    expect(s3PdfUrl('corporate-governance', 'board-charter')).toBe(`${S3}/corporate-governance/pdf/board-charter.pdf`);
  });
});

describe('slugify', () => {
  it('reproduces the investor site slugs', () => {
    expect(slugify('AGM Meeting Minutes and Result - 2026 AGM')).toBe('agm-meeting-minutes-and-result-2026-agm');
    expect(slugify('40810 NSX Director Appointment/Resignation - Appointment of Additional Directors'))
      .toBe('40810-nsx-director-appointmentresignation-appointment-of-additional-directors');
    expect(slugify("40024 NSX Nominated Adviser's Declaration - Nominated Adviser's Declaration"))
      .toBe('40024-nsx-nominated-advisers-declaration-nominated-advisers-declaration');
    expect(slugify('40530 NSX Preliminary/Final Statement - Preliminary final report - Mar26'))
      .toBe('40530-nsx-preliminaryfinal-statement-preliminary-final-report-mar26');
  });

  it('cuts at 120 characters like the investor site', () => {
    const long = '40050 NSX Suspension from Official Quotation - Suspension from Official Quotation - Non-payment of 2025-26 Annual Listing Fees';
    expect(slugify(long)).toBe('40050-nsx-suspension-from-official-quotation-suspension-from-official-quotation-non-payment-of-2025-26-annual-listing-fe');
    expect(SLUG_MAX).toBe(120);
  });

  it('never ends in a hyphen and falls back for empty input', () => {
    expect(slugify('Report -  ')).toBe('report');
    expect(slugify('!!!')).toBe('');
  });
});

describe('validateRecord: unknown collection', () => {
  it('throws, because that is a programming error', () => {
    expect(() => validateRecord('media', announcement)).toThrow();
  });
});
