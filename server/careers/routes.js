// HTTP routes for the careers page and its admin, ported from the Nuren
// investor site. The public list keeps that site's name and response shape
// ({ data: { data, totalDocs }, success }), but serves open positions only
// (the page never showed closed ones) and searches titles as plain text. The
// admin endpoints sit behind this site's admin login.
import { rejectCrossSite } from '../investors/routes.js';
import { sanitizeJobDescription } from './sanitize.js';
import { validateJob } from './validate.js';

const BASE = '/admin/api/job-positions';

export function registerCareerRoutes(app, { store, adminAuth }) {
  const validate = (body) => validateJob(body, { sanitize: sanitizeJobDescription });
  const invalid = (res, errors) => res.status(400).json({ error: 'Please fix the highlighted fields.', errors });

  app.get('/api/getJobPosition', (req, res) => {
    const search = String(req.query.search ?? '').trim().toLowerCase();
    const data = store.list({ openOnly: true }).filter((job) => job.position.toLowerCase().includes(search));
    res.set('Cache-Control', 'no-cache');
    res.json({ data: { data, totalDocs: data.length }, success: true });
  });

  app.get(BASE, adminAuth, (_req, res) => {
    res.json({ records: store.list() });
  });

  app.post(BASE, rejectCrossSite, adminAuth, (req, res) => {
    const { value, errors } = validate(req.body);
    if (Object.keys(errors).length) return invalid(res, errors);
    return res.status(201).json({ record: store.create(value) });
  });

  app.put(`${BASE}/:id`, rejectCrossSite, adminAuth, (req, res) => {
    const { value, errors } = validate(req.body);
    if (Object.keys(errors).length) return invalid(res, errors);
    const record = store.update(req.params.id, value);
    if (!record) return res.status(404).json({ error: 'That position no longer exists.' });
    return res.json({ record });
  });

  app.delete(`${BASE}/:id`, rejectCrossSite, adminAuth, (req, res) => {
    if (!store.remove(req.params.id)) return res.status(404).json({ error: 'That position no longer exists.' });
    return res.status(204).end();
  });
}
