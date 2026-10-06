import express from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import helmet from 'helmet';
import { LRUCache } from 'lru-cache';
import { escapeHtml } from './server/html.js';
import { createRateLimiter } from './server/rate-limit.js';
import { NURA_SYSTEM_PROMPT, NURA_PROMPT_VERSION } from './server/nura/prompt.js';
import { detectReplyLanguage } from './server/nura/language.js';
import { replyCopy, finalizeReply } from './server/nura/replies.js';
import { resolveModelConfig } from './server/nura/model.js';
import { buildChatRequest } from './server/nura/request.js';
import { createUsageTracker } from './server/nura/usage.js';
import { buildBriefRequest, parseBrief } from './server/nura/brief.js';
import { sanitizeTranscript } from './server/nura/transcript.js';
import { validateEnquiry } from './server/leads/enquiry.js';
import { sanitizeAttachment, MAX_ENQUIRY_BODY } from './server/leads/attachment.js';
import { createLeadStore } from './server/leads/store.js';
import { renderLeadEmail, leadsToCsv } from './server/leads/format.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

const ENQUIRY_RECIPIENT = process.env.ENQUIRY_RECIPIENT || 'petrina.goh@nurengroup.com';
const ENQUIRY_FROM_EMAIL = process.env.ENQUIRY_FROM_EMAIL || 'Nuren Group Website <onboarding@resend.dev>';
// Optional comma-separated extra recipients (the sales team) on every lead email.
const ENQUIRY_CC = (process.env.ENQUIRY_CC || '').split(',').map((e) => e.trim()).filter(Boolean);
// Leads and attached briefs are written here. Point it at a Railway volume to
// keep them across deploys; otherwise they last until the next redeploy.
const LEADS_DIR = process.env.LEADS_DIR || path.join(__dirname, 'data');

// Nura's prompt, model registry, request building, language handling and
// usage tracking live in server/nura/. NURA_MODEL picks the model by key
// (haiku | sonnet); NURA_EFFORT tunes models that support effort.
const NURA_MODEL = resolveModelConfig();
if (NURA_MODEL.warning) console.warn(`[nura] ${NURA_MODEL.warning}`);
const nuraUsage = createUsageTracker();

const MAX_MESSAGE_LENGTH = 1000;
const CHAT_TIMEOUT_MS = 30_000;

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  // Ask proxies in front of the app not to buffer the stream.
  'X-Accel-Buffering': 'no',
};

const CHAT_RATE_WINDOW_MS = 60_000;
const CHAT_RATE_MAX = 20;
const ENQUIRY_RATE_WINDOW_MS = 60 * 60 * 1000;
const ENQUIRY_RATE_MAX = 5;
const ADMIN_RATE_WINDOW_MS = 60_000;
const ADMIN_RATE_MAX = 10;

const RING_BUFFER_SIZE = 50;
const RATE_LIMIT_MAX_KEYS = 10_000;
const ADMIN_LOCKOUT_FAILS = 5;
const ADMIN_LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

const allowChat = createRateLimiter({ windowMs: CHAT_RATE_WINDOW_MS, max: CHAT_RATE_MAX, maxKeys: RATE_LIMIT_MAX_KEYS });
const allowEnquiry = createRateLimiter({ windowMs: ENQUIRY_RATE_WINDOW_MS, max: ENQUIRY_RATE_MAX, maxKeys: RATE_LIMIT_MAX_KEYS });
const allowAdmin = createRateLimiter({ windowMs: ADMIN_RATE_WINDOW_MS, max: ADMIN_RATE_MAX, maxKeys: RATE_LIMIT_MAX_KEYS });
// Each failed login re-sets this entry and so extends the lockout; that's intended.
const adminFailures = new LRUCache({ max: 1000, ttl: ADMIN_LOCKOUT_WINDOW_MS });

const errorLog = [];

function pushRing(buffer, item) {
  buffer.unshift(item);
  if (buffer.length > RING_BUFFER_SIZE) buffer.length = RING_BUFFER_SIZE;
}

function logError(scope, detail) {
  pushRing(errorLog, { ts: new Date().toISOString(), scope, detail: String(detail).slice(0, 500) });
  console.error(`[${scope}]`, detail);
}

const leadStore = createLeadStore({ dir: LEADS_DIR, onError: logError });

// Trust Express's req.ip — with `app.set('trust proxy', true)`, it walks the
// X-Forwarded-For chain correctly. Reading XFF directly is spoofable: any
// client can send `X-Forwarded-For: 1.2.3.4` to bypass per-IP rate limits.
function clientIp(req) {
  return req.ip || 'unknown';
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPlaceholder(value) {
  if (!value) return true;
  return value === 'set-me-in-dashboard' || value === 'MY_GEMINI_API_KEY' || value === 'MY_ANTHROPIC_API_KEY';
}

function maskSecret(value) {
  if (!value) return '';
  if (isPlaceholder(value)) return value;
  if (value.length <= 8) return '*'.repeat(value.length);
  return `${'*'.repeat(value.length - 4)}${value.slice(-4)}`;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function adminAuth(req, res, next) {
  const ip = clientIp(req);

  // Lockout: 5 failures in 15 min → 429 until window expires.
  const fails = adminFailures.get(ip) || 0;
  if (fails >= ADMIN_LOCKOUT_FAILS) {
    return res.status(429).json({ error: 'Too many failed attempts. Try again later.' });
  }

  if (!allowAdmin(ip)) {
    return res.status(429).json({ error: 'Too many admin requests.' });
  }

  const expected = process.env.SUPERADMIN_PASSWORD;
  if (!expected || isPlaceholder(expected)) {
    // Don't name the env var — it gives an attacker the exact key to look for
    // in any future env-leak. Generic "service unavailable" is enough.
    return res.status(503).json({ error: 'Admin access unavailable.' });
  }

  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Nuren Admin", charset="UTF-8"');
    return res.status(401).json({ error: 'Authentication required.' });
  }

  let decoded = '';
  try {
    decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  } catch {
    res.set('WWW-Authenticate', 'Basic realm="Nuren Admin", charset="UTF-8"');
    return res.status(401).json({ error: 'Invalid authentication.' });
  }

  const sep = decoded.indexOf(':');
  const supplied = sep === -1 ? decoded : decoded.slice(sep + 1);

  if (!timingSafeEqual(supplied, expected)) {
    adminFailures.set(ip, fails + 1);
    res.set('WWW-Authenticate', 'Basic realm="Nuren Admin", charset="UTF-8"');
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  // Reset failure count on a successful auth.
  adminFailures.delete(ip);
  next();
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);

// Security headers — closes the "first finding any pentester would flag":
// CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
// Permissions-Policy. CSP allows inline styles (Tailwind injects them) and
// connections to api.anthropic.com isn't needed because the chat call goes
// server-side; the only outbound from the browser is to this same origin.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameSrc: [
        "'self'",
        'https://www.youtube.com',
        'https://www.youtube-nocookie.com',
        'https://www.instagram.com',
      ],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: false },
  crossOriginEmbedderPolicy: false,
  // YouTube embeds need Referer to validate the origin. Helmet's default
  // (no-referrer) strips it, causing Error 153.
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// An enquiry can carry an attached brief, so it gets a larger body limit than
// the rest of the API. The per-IP rate limit runs first, before the body is
// read, so an abuser can't make the server buffer megabytes on every request.
app.use(
  '/api/enquiry',
  (req, res, next) => {
    if (req.method === 'POST' && !allowEnquiry(clientIp(req))) {
      return res.status(429).json({ error: 'Too many submissions. Please try again later.' });
    }
    return next();
  },
  express.json({ limit: MAX_ENQUIRY_BODY }),
);

app.use(express.json({ limit: '64kb' }));

app.get('/healthz', (_req, res) => {
  res.json({ ok: true });
});

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (isPlaceholder(apiKey)) return null;
  return new Anthropic({ apiKey, timeout: CHAT_TIMEOUT_MS });
}

function sendEvent(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// One structured log line per model call (no message content), plus the
// running totals shown on the admin page.
function logUsage(call) {
  const record = nuraUsage.record({ ...call, model: NURA_MODEL, promptVersion: NURA_PROMPT_VERSION });
  console.log(JSON.stringify({ msg: 'nura.usage', ...record }));
  if (call.truncated) {
    logError('chat:truncated', `lang=${call.lang} output_tokens=${call.message.usage?.output_tokens}`);
  }
}

app.post('/api/chat', async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  const history = req.body?.history;
  // Decide the reply language first so error messages match the visitor too.
  const replyLang = detectReplyLanguage(message, history);
  // Diagnostic header so we can verify detection without leaking the prompt.
  res.set('X-Nura-Lang', replyLang);
  const fail = (status, copyKey) =>
    res.status(status).json({ error: replyCopy(copyKey, replyLang), lang: replyLang });

  const ip = clientIp(req);
  if (!allowChat(ip)) {
    return fail(429, 'rateLimited');
  }

  const client = getAnthropicClient();
  if (!client) return fail(500, 'unavailable');

  if (!message) return fail(400, 'required');
  if (message.length > MAX_MESSAGE_LENGTH) return fail(400, 'tooLong');

  // The chat window asks for Server-Sent Events: the connection lets us stop
  // the model call if the visitor leaves, and a single `done` event carries
  // the finished reply (the window paces it like a person typing rather than
  // showing tokens as they arrive). Other callers (the eval runner) get one
  // JSON response. Both use the same streaming call, so they share one path.
  const wantsStream = (req.get('accept') || '').includes('text/event-stream');
  const started = Date.now();
  const stream = client.messages.stream(
    buildChatRequest({ model: NURA_MODEL, lang: replyLang, history, message }),
  );

  let visitorLeft = false;
  if (wantsStream) {
    res.status(200).set(SSE_HEADERS);
    res.flushHeaders();
    // Stop generating (and paying for) a reply nobody will read.
    res.on('close', () => {
      if (!res.writableEnded) {
        visitorLeft = true;
        stream.abort();
      }
    });
  }

  try {
    const final = await stream.finalMessage();
    // The hidden options line is split off here, so it never reaches the visitor as text.
    const { reply, options, truncated } = finalizeReply(final, replyLang);
    logUsage({ route: 'chat', lang: replyLang, message: final, latencyMs: Date.now() - started, truncated });
    if (!wantsStream) return res.json({ reply, options, lang: replyLang });
    sendEvent(res, 'done', { reply, options, lang: replyLang });
    return res.end();
  } catch (err) {
    if (visitorLeft) {
      nuraUsage.recordFailure('aborted');
      return undefined;
    }
    nuraUsage.recordFailure('error');
    const status = err?.status || err?.statusCode;
    const detail = err?.message || String(err);
    logError('chat:anthropic', status ? `${status} ${detail}` : detail);
    if (!wantsStream) return fail(status && status >= 400 && status < 500 ? 502 : 500, 'unavailable');
    sendEvent(res, 'error', { error: replyCopy('unavailable', replyLang), lang: replyLang });
    return res.end();
  }
});

// Drafts the enquiry form's topic and description from the chat so far.
// The visitor reviews the draft; failures just leave the form blank.
app.post('/api/chat/brief', async (req, res) => {
  const history = sanitizeTranscript(req.body?.history);
  const lang = detectReplyLanguage('', history);

  const ip = clientIp(req);
  if (!allowChat(ip)) {
    return res.status(429).json({ error: replyCopy('rateLimited', lang) });
  }
  if (!history.some((turn) => turn.role === 'user')) {
    return res.status(400).json({ error: 'There is no conversation to draft from yet.' });
  }

  const client = getAnthropicClient();
  if (!client) return res.status(503).json({ error: replyCopy('unavailable', lang) });

  const started = Date.now();
  try {
    const message = await client.messages.create(buildBriefRequest({ model: NURA_MODEL, lang, history }));
    logUsage({ route: 'brief', lang, message, latencyMs: Date.now() - started });
    const brief = parseBrief(message, history);
    if (!brief) {
      logError('brief:unparseable', `stop_reason=${message.stop_reason}`);
      return res.status(502).json({ error: 'Could not draft the enquiry.' });
    }
    return res.json({ ...brief, lang });
  } catch (err) {
    nuraUsage.recordFailure('error');
    const status = err?.status || err?.statusCode;
    logError('brief:anthropic', status ? `${status} ${err?.message}` : err?.message || String(err));
    return res.status(502).json({ error: 'Could not draft the enquiry.' });
  }
});

app.post('/api/enquiry', async (req, res) => {
  const ip = clientIp(req);
  const payload = req.body && typeof req.body === 'object' ? req.body : {};

  if (typeof payload.website === 'string' && payload.website.trim() !== '') {
    return res.json({ ok: true });
  }

  const { value, errors } = validateEnquiry(payload);
  const file = sanitizeAttachment(payload.attachment);
  if (file.error) errors.attachment = file.error;
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Validation failed.', errors });
  }

  const result = await submitLead({
    ...value,
    // Present only when the visitor ticked "include my chat"; capped and escaped.
    transcript: sanitizeTranscript(payload.transcript),
    attachment: file.attachment,
    ip,
    userAgent: String(req.headers['user-agent'] || 'unknown'),
  });

  if (result.error) {
    return res.status(result.status || 502).json({ error: result.error });
  }
  return res.json({ ok: true, delivery: result.delivery });
});

// Emails the team, then keeps a copy for the dashboard. The lead is saved even
// when the email fails, so it can still be followed up from the dashboard.
async function submitLead({ attachment, ip, userAgent, ...fields }) {
  const lead = {
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    ...fields,
    attachment: attachment
      ? { filename: attachment.filename, mime: attachment.mime, size: attachment.buffer.length }
      : null,
  };

  const result = await deliverLeadEmail(lead, attachment, { ip, userAgent });
  leadStore.add({ ...lead, delivery: result.delivery }, attachment);
  return result;
}

async function deliverLeadEmail(lead, attachment, meta) {
  const { subject, text, html } = renderLeadEmail(lead, meta);

  const resendKey = process.env.RESEND_API_KEY;
  if (isPlaceholder(resendKey)) {
    console.warn('[enquiry] RESEND_API_KEY not set — logging enquiry instead of emailing.');
    console.log('[enquiry:pending-email]', JSON.stringify({ to: ENQUIRY_RECIPIENT, subject, text }));
    return { delivery: 'logged' };
  }

  try {
    const upstream = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: ENQUIRY_FROM_EMAIL,
        to: [ENQUIRY_RECIPIENT],
        ...(ENQUIRY_CC.length ? { cc: ENQUIRY_CC } : {}),
        reply_to: lead.email,
        subject,
        text,
        html,
        ...(attachment
          ? { attachments: [{ filename: attachment.filename, content: attachment.buffer.toString('base64') }] }
          : {}),
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      logError('enquiry:resend', `${upstream.status} ${detail}`);
      return { error: 'Could not deliver enquiry. Please try again or email us directly.', status: 502, delivery: 'failed' };
    }
    return { delivery: 'sent' };
  } catch (err) {
    logError('enquiry:exception', err?.message || err);
    return { error: 'Something went wrong. Please try again.', status: 500, delivery: 'failed' };
  }
}

// Admin API — all guarded by Basic Auth.
app.get('/admin/api/status', adminAuth, (_req, res) => {
  const anthropic = process.env.ANTHROPIC_API_KEY;
  const resend = process.env.RESEND_API_KEY;

  res.json({
    settings: {
      anthropicKey: { set: !isPlaceholder(anthropic), masked: maskSecret(anthropic || '') },
      resendKey: { set: !isPlaceholder(resend), masked: maskSecret(resend || '') },
      enquiryFromEmail: ENQUIRY_FROM_EMAIL,
      enquiryRecipient: [ENQUIRY_RECIPIENT, ...ENQUIRY_CC].join(', '),
      leadStorage: {
        // A working disk isn't enough: only a mounted volume survives a redeploy.
        persistent: leadStore.writable && Boolean(process.env.LEADS_DIR),
        writable: leadStore.writable,
        dir: LEADS_DIR,
      },
      chatModel: `${NURA_MODEL.label} (${NURA_MODEL.id})`,
      chatModelKey: NURA_MODEL.key,
      chatEffort: NURA_MODEL.effort,
      promptVersion: NURA_PROMPT_VERSION,
    },
    knowledgeBase: NURA_SYSTEM_PROMPT,
    usage: nuraUsage.snapshot(),
    counts: { enquiries: leadStore.list().length, errors: errorLog.length },
  });
});

app.get('/admin/api/leads', adminAuth, (_req, res) => {
  res.json({ leads: leadStore.list() });
});

app.get('/admin/api/leads.csv', adminAuth, (_req, res) => {
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="nuren-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    'Cache-Control': 'no-store',
  });
  res.send(leadsToCsv(leadStore.list()));
});

app.get('/admin/api/leads/:id/attachment', adminAuth, (req, res) => {
  const file = leadStore.readAttachment(req.params.id);
  if (!file) return res.status(404).json({ error: 'No attached brief for this lead.' });
  // Served as a download, never rendered: the file is whatever a visitor uploaded.
  res.set({
    'Content-Type': file.mime,
    'Content-Disposition': `attachment; filename="${file.filename}"`,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
  });
  return res.send(file.buffer);
});

app.get('/admin/api/errors', adminAuth, (_req, res) => {
  res.json({ errors: errorLog });
});

app.post('/admin/api/test-anthropic', adminAuth, async (_req, res) => {
  const client = getAnthropicClient();
  if (!client) {
    return res.status(400).json({ ok: false, error: 'ANTHROPIC_API_KEY not configured.' });
  }

  try {
    const start = Date.now();
    // Same model and effort as live chat; max_tokens leaves room for
    // adaptive thinking on models that have it.
    const response = await client.messages.create({
      model: NURA_MODEL.id,
      max_tokens: NURA_MODEL.maxTokens,
      ...(NURA_MODEL.effort ? { output_config: { effort: NURA_MODEL.effort } } : {}),
      messages: [{ role: 'user', content: 'Reply with the single word: OK' }],
    });
    const ms = Date.now() - start;
    const reply = response.content
      ?.filter((b) => b.type === 'text')
      ?.map((b) => b.text)
      ?.join('')
      ?.trim() || '';
    return res.json({ ok: true, reply, latencyMs: ms });
  } catch (err) {
    const status = err?.status || err?.statusCode;
    const detail = (err?.message || String(err)).slice(0, 300);
    return res.status(status && status >= 400 && status < 500 ? 502 : 500).json({
      ok: false, status, error: detail,
    });
  }
});

app.post('/admin/api/test-enquiry', adminAuth, async (_req, res) => {
  const { value } = validateEnquiry({
    type: 'other',
    name: 'Admin Test',
    email: 'admin-test@nurengroup.com',
    phone: '+60 000 0000',
    company: 'Admin test',
    message: 'This is a test enquiry triggered from the /admin page to verify Resend delivery.',
  });
  const result = await submitLead({ ...value, transcript: [], attachment: null, ip: 'admin-page', userAgent: 'admin-test' });
  if (result.error) return res.status(result.status || 502).json({ ok: false, error: result.error, delivery: result.delivery });
  return res.json({ ok: true, delivery: result.delivery });
});

// `index: 'index.html'` so a request for `/investors` resolves to the
// prerendered `dist/investors/index.html` automatically (build creates one
// per route — see scripts/prerender.mjs). Hashed asset bundles get a long
// cache; HTML stays at maxAge:0 so deploys propagate immediately.
app.use(express.static(DIST_DIR, {
  index: 'index.html',
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    // Normalise to forward-slash so this regex works on Windows builds too.
    const norm = filePath.replace(/\\/g, '/');
    if (norm.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else if (/\/assets\/.+\.(js|css|woff2?)$/.test(norm)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

// SPA fallback for unknown routes (dynamic params like
// /investors/governance-documents/:docId — those have no per-route prerender
// and fall back to the root client-rendered shell). Tag /admin and /api with
// X-Robots-Tag noindex so search engines don't index admin shell or API URLs
// even before the React app mounts.
app.use((req, res) => {
  if (req.path.startsWith('/admin') || req.path.startsWith('/api')) {
    res.set('X-Robots-Tag', 'noindex, nofollow');
  }
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// Last resort for errors thrown by middleware (an oversized or malformed JSON
// body, for example). Without this Express answers with an HTML page that
// includes a stack trace whenever NODE_ENV isn't "production".
app.use((err, _req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err?.status || err?.statusCode;
  if (status === 413) return res.status(413).json({ error: 'That request is too large.' });
  if (status >= 400 && status < 500) return res.status(status).json({ error: 'Invalid request.' });
  logError('server', err?.message || err);
  return res.status(500).json({ error: 'Something went wrong.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Nuren Group website listening on :${PORT}`);
});
