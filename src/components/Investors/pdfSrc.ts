// Which documents the inline PDF viewer may show, and where table links go.
// The viewer only embeds this site's own files (self-hosted PDFs and admin
// uploads), so /pdf-viewer?src= can't be used to frame someone else's page.
import { isAllowedRecordUrl } from '../../../server/investors/validate.js';

const PDF_PATH_RE = /^\/announcements-pdfs\/[a-z0-9][a-z0-9-]*\.pdf$/;
const UPLOAD_PATH_RE = /^\/api\/files\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isAllowedPdfSrc(src: string): boolean {
  return PDF_PATH_RE.test(src || '') || UPLOAD_PATH_RE.test(src || '');
}

/** Own PDFs open in the toolbar-less viewer; external https links open as-is. */
export function viewerHref(url: string): string {
  if (isAllowedPdfSrc(url)) return `/pdf-viewer?src=${encodeURIComponent(url)}`;
  return isAllowedRecordUrl(url) ? url : '#';
}

/** The iframe src, with the browser viewer's download/print toolbar hidden. */
export function pdfEmbedSrc(src: string): string {
  return isAllowedPdfSrc(src) ? `${src}#toolbar=0&navpanes=0&scrollbar=1` : '';
}
