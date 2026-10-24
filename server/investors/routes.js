// HTTP routes for the investor pages and their admin, ported from the Nuren
// investor site. Public endpoints keep that site's names and response shape
// ({ data: { data, totalDocs }, success }) so the pages port unchanged. The
// admin endpoints sit behind this site's admin login instead of the investor
// site's forgeable `nurengroup_admin=true` cookie.
import express from 'express';
import { ATTACHMENT_TYPES, safeFilename } from '../leads/attachment.js';
import { COLLECTIONS, validateRecord } from './validate.js';

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

// Documents only, as on the investor site. PDFs open in the inline viewer;
// Word files can't render in a browser, so they download.
const UPLOAD_TYPES = ['pdf', 'doc', 'docx'];
const INLINE_TYPES = new Set(['application/pdf']);

// The site-wide CSP says frame-ancestors 'none'. A PDF the viewer page shows
// in an iframe must allow this site to frame it, or the browser blanks it.
const PDF_FRAME_HEADERS = {
  'Content-Security-Policy': "frame-ancestors 'self'",
  'X-Frame-Options': 'SAMEORIGIN',
};

const PUBLIC_LISTS = {
  '/api/getAnnouncements': 'announcements',
  '/api/getFinancialReport': 'financial-reports',
};

/** For express.static's setHeaders: frameable headers on self-hosted investor PDFs. */
export function setInvestorStaticHeaders(res, filePath) {
  const norm = String(filePath).replace(/\\/g, '/');
  if (!/\/announcements-pdfs\/[^/]+\.pdf$/i.test(norm)) return;
  for (const [key, value] of Object.entries(PDF_FRAME_HEADERS)) res.setHeader(key, value);
}

/**
 * Admin changes arrive with the password in an Authorization header set by
 * the admin page's own script, which another site can't do. A browser that
 * cached the password from a login prompt would still send it on a forged
 * cross-site request, so refuse anything the browser marks as cross-site.
 */
export function rejectCrossSite(req, res, next) {
  const site = req.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') {
    return res.status(403).json({ error: 'Cross-site request refused.' });
  }
  const origin = req.get('origin');
  if (origin) {
    let host = '';
    try {
      host = new URL(origin).host;
    } catch {
      // Unparseable Origin: treat as foreign.
    }
    if (host !== req.get('host')) return res.status(403).json({ error: 'Cross-site request refused.' });
  }
  return next();
}

const rawBody = express.raw({ type: () => true, limit: MAX_UPLOAD_BYTES });

// express.raw, but answering size and read errors here as JSON.
function readUploadBody(req, res, next) {
  rawBody(req, res, (err) => {
    if (!err) return next();
    if (err.status === 413) return res.status(413).json({ error: 'The file is too large. The limit is 25 MB.' });
    return res.status(400).json({ error: 'The file could not be read.' });
  });
}

function checkUpload(req) {
  let name = '';
  try {
    name = decodeURIComponent(req.get('x-filename') || '');
  } catch {
    return { error: 'The file name could not be read.' };
  }
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (!UPLOAD_TYPES.includes(ext)) return { error: 'Upload a PDF, DOC or DOCX file.' };
  const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  if (buffer.length === 0) return { error: 'The file is empty.' };
  const type = ATTACHMENT_TYPES[ext];
  if (!type.magic.every((byte, i) => buffer[i] === byte)) {
    return { error: `That file doesn't look like a real .${ext} file.` };
  }
  return { file: { buffer, filename: safeFilename(name, ext), mime: type.mime } };
}

export function registerInvestorRoutes(app, { store, adminAuth, onError = () => {} }) {
  for (const [route, collection] of Object.entries(PUBLIC_LISTS)) {
    app.get(route, (_req, res) => {
      const data = store.list(collection);
      res.set('Cache-Control', 'no-cache');
      res.json({ data: { data, totalDocs: data.length }, success: true });
    });
  }

  app.get('/api/files/:id', (req, res) => {
    const file = store.readUpload(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found.' });
    const inline = INLINE_TYPES.has(file.mime);
    res.set({
      'Content-Type': file.mime,
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${file.filename}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=31536000, immutable',
      ...(inline ? PDF_FRAME_HEADERS : {}),
    });
    return res.send(file.buffer);
  });

  for (const collection of Object.keys(COLLECTIONS)) {
    const base = `/admin/api/${collection}`;

    app.get(base, adminAuth, (_req, res) => {
      res.json({ records: store.list(collection, { includeInactive: true }) });
    });

    app.post(base, rejectCrossSite, adminAuth, (req, res) => {
      const { value, errors } = validateRecord(collection, req.body);
      if (Object.keys(errors).length) return res.status(400).json({ error: 'Please fix the highlighted fields.', errors });
      return res.status(201).json({ record: store.create(collection, value) });
    });

    app.put(`${base}/:id`, rejectCrossSite, adminAuth, (req, res) => {
      const { value, errors } = validateRecord(collection, req.body);
      if (Object.keys(errors).length) return res.status(400).json({ error: 'Please fix the highlighted fields.', errors });
      const record = store.update(collection, req.params.id, value);
      if (!record) return res.status(404).json({ error: 'That record no longer exists.' });
      return res.json({ record });
    });

    app.delete(`${base}/:id`, rejectCrossSite, adminAuth, (req, res) => {
      if (!store.remove(collection, req.params.id)) return res.status(404).json({ error: 'That record no longer exists.' });
      return res.status(204).end();
    });
  }

  // The password is checked before the body is read, so an anonymous caller
  // can't make the server buffer 25 MB.
  app.post('/admin/api/files', rejectCrossSite, adminAuth, readUploadBody, (req, res) => {
    const { file, error } = checkUpload(req);
    if (error) return res.status(400).json({ error });
    try {
      return res.status(201).json({ success: true, ...store.saveUpload(file) });
    } catch (err) {
      onError('investors:upload', err?.message || err);
      return res.status(500).json({ error: 'Could not save the file.' });
    }
  });

  app.delete('/admin/api/files/:id', rejectCrossSite, adminAuth, (req, res) => {
    if (!store.removeUpload(req.params.id)) return res.status(404).json({ error: 'File not found.' });
    return res.status(204).end();
  });
}
