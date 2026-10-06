// The brief a visitor attaches to an enquiry. It arrives as base64 inside the
// JSON body, so it is untrusted: the extension must be on the allow-list, the
// file's first bytes must match that type (a renamed .exe is refused), and the
// name is reduced to safe characters before it reaches an email or a download.

export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;
// Base64 is 4 characters per 3 bytes; the JSON body also carries the form text.
export const MAX_ENQUIRY_BODY = '6mb';

const ZIP = [0x50, 0x4b, 0x03, 0x04];
const OLE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const JPEG = [0xff, 0xd8, 0xff];

export const ATTACHMENT_TYPES = {
  pdf: { mime: 'application/pdf', magic: [0x25, 0x50, 0x44, 0x46] },
  doc: { mime: 'application/msword', magic: OLE },
  docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', magic: ZIP },
  ppt: { mime: 'application/vnd.ms-powerpoint', magic: OLE },
  pptx: { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', magic: ZIP },
  xls: { mime: 'application/vnd.ms-excel', magic: OLE },
  xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', magic: ZIP },
  png: { mime: 'image/png', magic: [0x89, 0x50, 0x4e, 0x47] },
  jpg: { mime: 'image/jpeg', magic: JPEG },
  jpeg: { mime: 'image/jpeg', magic: JPEG },
};

export const ATTACHMENT_EXTENSIONS = Object.keys(ATTACHMENT_TYPES);

const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

export function safeFilename(name, ext) {
  const base = String(name ?? '')
    .split(/[\\/]/)
    .pop()
    .replace(/[^\w .()-]+/g, '_')
    .replace(/\.+$/, '')
    .trim()
    .slice(0, 100);
  const stem = base.replace(/\.[^.]*$/, '') || 'brief';
  return `${stem}.${ext}`;
}

/**
 * @param {unknown} raw  `{ filename, data }` where data is base64, or nothing
 * @returns {{ attachment: null | { filename: string, mime: string, buffer: Buffer } } | { error: string }}
 */
export function sanitizeAttachment(raw) {
  if (raw === undefined || raw === null) return { attachment: null };
  if (typeof raw !== 'object' || typeof raw.filename !== 'string' || typeof raw.data !== 'string') {
    return { error: 'The attached file could not be read.' };
  }

  const ext = (raw.filename.split('.').pop() || '').toLowerCase();
  const type = ATTACHMENT_TYPES[ext];
  if (!type) return { error: 'Attach a PDF, Word, PowerPoint, Excel, PNG or JPG file.' };

  const maxEncoded = Math.ceil((MAX_ATTACHMENT_BYTES * 4) / 3) + 4;
  if (raw.data.length > maxEncoded) return { error: 'The file is too large. The limit is 4 MB.' };
  if (!raw.data || !BASE64_RE.test(raw.data)) return { error: 'The attached file could not be read.' };

  const buffer = Buffer.from(raw.data, 'base64');
  if (buffer.length === 0) return { error: 'The attached file is empty.' };
  if (buffer.length > MAX_ATTACHMENT_BYTES) return { error: 'The file is too large. The limit is 4 MB.' };
  if (!type.magic.every((byte, i) => buffer[i] === byte)) {
    return { error: `That file doesn't look like a real .${ext} file.` };
  }

  return { attachment: { filename: safeFilename(raw.filename, ext), mime: type.mime, buffer } };
}
