import { describe, it, expect } from 'vitest';
import { isAllowedPdfSrc, viewerHref, pdfEmbedSrc } from './pdfSrc';

const UPLOAD = '/api/files/3f2b8c1e-9d4a-4b7e-8f21-0c6a5e9d1b23';

describe('isAllowedPdfSrc', () => {
  it('allows only this site’s own PDFs and uploads', () => {
    expect(isAllowedPdfSrc('/announcements-pdfs/board-charter.pdf')).toBe(true);
    expect(isAllowedPdfSrc(UPLOAD)).toBe(true);
  });

  it('refuses anything that would turn the viewer into an open embed', () => {
    for (const src of [
      'https://evil.example/a.pdf',
      '//evil.example/a.pdf',
      'javascript:alert(1)',
      '/announcements-pdfs/../index.html',
      '/announcements-pdfs/board-charter.html',
      '/api/files/abc',
      '/admin',
      '',
    ]) {
      expect(isAllowedPdfSrc(src), src).toBe(false);
    }
  });
});

describe('viewerHref', () => {
  it('routes self-hosted PDFs and uploads through the inline viewer', () => {
    expect(viewerHref('/announcements-pdfs/2025-annual-report.pdf')).toBe(
      '/pdf-viewer?src=%2Fannouncements-pdfs%2F2025-annual-report.pdf',
    );
    expect(viewerHref(UPLOAD)).toBe(`/pdf-viewer?src=${encodeURIComponent(UPLOAD)}`);
  });

  it('opens external https links as they are', () => {
    expect(viewerHref('https://drive.google.com/file/d/abc/view')).toBe('https://drive.google.com/file/d/abc/view');
  });

  it('neutralises links that should never have been stored', () => {
    expect(viewerHref('javascript:alert(1)')).toBe('#');
    expect(viewerHref('')).toBe('#');
  });
});

describe('pdfEmbedSrc', () => {
  it('hides the browser viewer toolbar', () => {
    expect(pdfEmbedSrc('/announcements-pdfs/board-charter.pdf')).toBe(
      '/announcements-pdfs/board-charter.pdf#toolbar=0&navpanes=0&scrollbar=1',
    );
  });

  it('embeds nothing for a source that is not allowed', () => {
    expect(pdfEmbedSrc('https://evil.example/a.pdf')).toBe('');
  });
});
