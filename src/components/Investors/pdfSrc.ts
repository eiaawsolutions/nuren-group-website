// Which documents the inline PDF viewer may show, and where table links go.
// The viewer only embeds the investor site's S3 bucket PDFs and files
// uploaded to this server, so /pdf-viewer?src= can't frame someone else's page.
import { isAllowedRecordUrl, isS3Pdf } from '../../../server/investors/validate.js';
import type { InvestorCollection } from './useInvestorList';

const UPLOAD_PATH_RE = /^\/api\/files\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// The investor site's page URL for each list's documents.
export const RECORD_PATHS: Record<InvestorCollection, string> = {
  announcements: '/investors/announcements',
  'financial-reports': '/investors/reports',
};

export function isAllowedPdfSrc(src: string): boolean {
  return isS3Pdf(src || '') || UPLOAD_PATH_RE.test(src || '');
}

/** Viewable PDFs open in the toolbar-less viewer; other https links open as-is. */
export function viewerHref(url: string): string {
  if (isAllowedPdfSrc(url)) return `/pdf-viewer?src=${encodeURIComponent(url)}`;
  return isAllowedRecordUrl(url) ? url : '#';
}

/**
 * Where a table row links: the record's own page (/investors/announcements/<slug>),
 * as on the investor site, or the link itself when it isn't a PDF we can show.
 */
export function recordHref(collection: InvestorCollection, record: { slug?: string; url: string }) {
  if (!isAllowedPdfSrc(record.url)) return { href: viewerHref(record.url), external: true };
  if (!record.slug) return { href: viewerHref(record.url), external: false };
  return { href: `${RECORD_PATHS[collection]}/${record.slug}`, external: false };
}

/** The iframe src, with the browser viewer's download/print toolbar hidden. */
export function pdfEmbedSrc(src: string): string {
  return isAllowedPdfSrc(src) ? `${src}#toolbar=0&navpanes=0&scrollbar=1` : '';
}
