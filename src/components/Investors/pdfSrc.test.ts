import { describe, it, expect } from 'vitest';
import { isAllowedPdfSrc, viewerHref, pdfEmbedSrc, recordHref } from './pdfSrc';

const S3 = 'https://s3.ap-southeast-1.amazonaws.com/nurengroup.com';
const UPLOAD = '/api/files/3f2b8c1e-9d4a-4b7e-8f21-0c6a5e9d1b23';

describe('isAllowedPdfSrc', () => {
  it('allows the investor S3 bucket PDFs and this server’s uploads', () => {
    expect(isAllowedPdfSrc(`${S3}/corporate-governance/pdf/board-charter.pdf`)).toBe(true);
    expect(isAllowedPdfSrc(`${S3}/announcement/pdf/agm-meeting-minutes-and-result-2026-agm.pdf`)).toBe(true);
    expect(isAllowedPdfSrc(UPLOAD)).toBe(true);
  });

  it('refuses anything that would turn the viewer into an open embed', () => {
    for (const src of [
      'https://evil.example/a.pdf',
      'https://s3.ap-southeast-1.amazonaws.com/other-bucket/announcement/pdf/a.pdf',
      '//evil.example/a.pdf',
      'javascript:alert(1)',
      '/announcements-pdfs/board-charter.pdf',
      '/api/files/abc',
      '/admin',
      '',
    ]) {
      expect(isAllowedPdfSrc(src), src).toBe(false);
    }
  });
});

describe('viewerHref', () => {
  it('routes viewable PDFs through the inline viewer', () => {
    const src = `${S3}/finance-report/pdf/40510-annual-report-2026-annual-report.pdf`;
    expect(viewerHref(src)).toBe(`/pdf-viewer?src=${encodeURIComponent(src)}`);
    expect(viewerHref(UPLOAD)).toBe(`/pdf-viewer?src=${encodeURIComponent(UPLOAD)}`);
  });

  it('opens other https links as they are', () => {
    expect(viewerHref('https://drive.google.com/file/d/abc/view')).toBe('https://drive.google.com/file/d/abc/view');
  });

  it('neutralises links that should never have been stored', () => {
    expect(viewerHref('javascript:alert(1)')).toBe('#');
    expect(viewerHref('')).toBe('#');
  });
});

describe('recordHref', () => {
  it('opens a record’s own page, like the investor site', () => {
    expect(recordHref('announcements', { slug: 'agm-2026', url: `${S3}/announcement/pdf/agm-2026.pdf` }))
      .toEqual({ href: '/investors/announcements/agm-2026', external: false });
    expect(recordHref('financial-reports', { slug: 'q3', url: UPLOAD }))
      .toEqual({ href: '/investors/reports/q3', external: false });
  });

  it('sends links that are not viewable PDFs straight to their page, in a new tab', () => {
    expect(recordHref('announcements', { slug: 'x', url: 'https://drive.google.com/file/d/abc/view' }))
      .toEqual({ href: 'https://drive.google.com/file/d/abc/view', external: true });
  });

  it('falls back to the viewer when a record has no slug', () => {
    const url = `${S3}/announcement/pdf/a.pdf`;
    expect(recordHref('announcements', { url })).toEqual({ href: `/pdf-viewer?src=${encodeURIComponent(url)}`, external: false });
  });
});

describe('pdfEmbedSrc', () => {
  it('hides the browser viewer toolbar', () => {
    expect(pdfEmbedSrc(`${S3}/corporate-governance/pdf/board-charter.pdf`)).toBe(
      `${S3}/corporate-governance/pdf/board-charter.pdf#toolbar=0&navpanes=0&scrollbar=1`,
    );
  });

  it('embeds nothing for a source that is not allowed', () => {
    expect(pdfEmbedSrc('https://evil.example/a.pdf')).toBe('');
  });
});
