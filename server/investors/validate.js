// The investor records the admin manages (announcements and financial reports),
// shared by the admin form in the browser and the server, so the two cannot
// drift. The server is the authority: everything arriving at the admin API is
// re-validated here. Field names match the Nuren investor site these records
// were ported from, so its data loads unchanged.

// `folder` is where the investor site keeps each collection's PDFs in its S3
// bucket (see S3_PUBLIC_BASE).
export const COLLECTIONS = {
  announcements: { titleField: 'headline', codeRequired: true, hasType: false, folder: 'announcement' },
  'financial-reports': { titleField: 'title', codeRequired: false, hasType: true, folder: 'finance-report' },
};

// The investor site's documents live in the S3 bucket `nurengroup.com`
// (ap-southeast-1), one folder per kind: announcement/, finance-report/ and
// corporate-governance/, each with the PDFs under pdf/<slug>.pdf.
export const S3_PUBLIC_BASE = 'https://s3.ap-southeast-1.amazonaws.com/nurengroup.com';
export const S3_FOLDERS = ['announcement', 'finance-report', 'corporate-governance'];

// The investor site's slugs are capped at this length.
export const SLUG_MAX = 120;

export const REPORT_TYPES = ['file', 'link'];

// Admin uploads: documents only, as on the investor site.
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const UPLOAD_EXTENSIONS = ['pdf', 'doc', 'docx'];

export const FIELD_LIMITS = {
  code: 20,
  category: 120,
  headline: 400,
  title: 400,
  description: 2000,
  url: 500,
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const S3_PDF_RE = new RegExp(`^${escapeRe(S3_PUBLIC_BASE)}/(?:${S3_FOLDERS.join('|')})/pdf/[a-z0-9][a-z0-9-]*\\.pdf$`);
const UPLOAD_PATH_RE = /^\/api\/files\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const HTTPS_RE = /^https:\/\/[^\s<>"'`\\]+$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

const oneLine = (value, max) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);

/** A PDF in one of the investor folders of the investor site's S3 bucket. */
export function isS3Pdf(url) {
  return typeof url === 'string' && S3_PDF_RE.test(url);
}

/** The public URL of `<folder>/pdf/<slug>.pdf` in the bucket. */
export function s3PdfUrl(folder, slug) {
  return `${S3_PUBLIC_BASE}/${folder}/pdf/${slug}.pdf`;
}

/**
 * The investor site's slug rule, used for page URLs and S3 file names:
 * lowercase, keep letters, digits, spaces and hyphens, spaces become
 * hyphens, at most 120 characters.
 */
export function slugify(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, SLUG_MAX)
    .replace(/^-+|-+$/g, '');
}

/**
 * Display order for the public tables and the admin: newest first; rows
 * released in the same second keep the order the NSX listed them in.
 */
export function byReleaseDate(a, b) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER);
}

/**
 * Where a record's link may point: a PDF in the investor S3 bucket, a file
 * uploaded to this server, or another https page (e.g. a Drive link).
 * Anything else, including `javascript:` and relative paths elsewhere on the
 * site, is refused because the public tables render it as a link.
 */
export function isAllowedRecordUrl(url) {
  if (typeof url !== 'string' || !url || url.length > FIELD_LIMITS.url) return false;
  if (UPLOAD_PATH_RE.test(url)) return true;
  if (!HTTPS_RE.test(url)) return false;
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Release dates are wall-clock times as published (no timezone), exactly as
 * the investor site stored them. Returns `YYYY-MM-DDTHH:mm:ss`, or '' if the
 * value is not a real date in that shape.
 */
export function normalizeReleaseDate(value) {
  const m = DATE_RE.exec(String(value ?? '').trim());
  if (!m) return '';
  const [, y, mo, d, h, mi, s = '00'] = m;
  const [year, month, day, hour, minute, second] = [y, mo, d, h, mi, s].map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth) return '';
  if (hour > 23 || minute > 59 || second > 59) return '';
  return `${y}-${mo}-${d}T${h}:${mi}:${s}`;
}

/**
 * @param {keyof typeof COLLECTIONS} collection
 * @param {unknown} raw  the request body (or a seed row)
 * @returns {{ value: Record<string, unknown>, errors: Record<string, string> }}
 */
export function validateRecord(collection, raw) {
  const spec = COLLECTIONS[collection];
  if (!spec) throw new Error(`Unknown investor collection: ${collection}`);
  const body = raw && typeof raw === 'object' ? raw : {};
  const titleField = spec.titleField;

  const value = {
    code: oneLine(body.code, FIELD_LIMITS.code),
    category: oneLine(body.category, FIELD_LIMITS.category),
    [titleField]: oneLine(body[titleField], FIELD_LIMITS[titleField]),
    description: String(body.description ?? '').trim().slice(0, FIELD_LIMITS.description),
    date: normalizeReleaseDate(body.date),
    priceSensitive: body.priceSensitive === true,
    url: String(body.url ?? '').trim(),
    active: body.active !== false,
  };
  if (spec.hasType) value.type = REPORT_TYPES.includes(body.type) ? body.type : 'file';
  if (typeof body.sortOrder === 'number' && Number.isFinite(body.sortOrder)) value.sortOrder = body.sortOrder;

  const errors = {};
  if (spec.codeRequired && !value.code) errors.code = 'Please enter the code.';
  if (!value[titleField]) {
    errors[titleField] = titleField === 'title' ? 'Please enter the title.' : 'Please enter the headline.';
  }
  if (!value.date) errors.date = 'Please enter a valid release date and time.';
  if (!value.url) errors.url = 'Please add a PDF link or upload a file.';
  else if (!isAllowedRecordUrl(value.url)) {
    errors.url = 'Upload a file, or paste an https:// link (e.g. the PDF in the S3 bucket).';
  }

  return { value, errors };
}
