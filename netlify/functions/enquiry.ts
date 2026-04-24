import type { Handler, HandlerEvent } from '@netlify/functions';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const RECIPIENT = 'petrina.goh@nurengroup.com';
const SUBJECT_PREFIX = 'Nuren Group Website Enquiry';

interface EnquiryRequest {
  name?: string;
  email?: string;
  phone?: string;
  topic?: string;
  description?: string;
  website?: string;
}

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return {
      statusCode: 429,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Too many submissions. Please try again later.' }),
    };
  }

  let payload: EnquiryRequest;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
  }

  // Honeypot — real users leave this empty; bots fill it.
  if (payload.website && payload.website.trim() !== '') {
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  }

  const name = (payload.name || '').trim().slice(0, 120);
  const email = (payload.email || '').trim().slice(0, 200);
  const phone = (payload.phone || '').trim().slice(0, 40);
  const topic = (payload.topic || '').trim().slice(0, 160);
  const description = (payload.description || '').trim().slice(0, 4000);

  const errors: Record<string, string> = {};
  if (!name) errors.name = 'Name is required.';
  if (!email) errors.email = 'Email is required.';
  else if (!isEmail(email)) errors.email = 'Please enter a valid email.';
  if (!phone) errors.phone = 'Phone is required.';
  if (!topic) errors.topic = 'Topic is required.';
  if (!description) errors.description = 'Please describe your enquiry.';

  if (Object.keys(errors).length > 0) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Validation failed.', errors }),
    };
  }

  const subject = `${SUBJECT_PREFIX}: ${topic}`;
  const submittedAt = new Date().toISOString();
  const userAgent = event.headers['user-agent'] || 'unknown';

  const textBody = [
    'A new enquiry was submitted via the Nuren Group website chatbot.',
    '',
    `Topic:        ${topic}`,
    `Name:         ${name}`,
    `Email:        ${email}`,
    `Phone:        ${phone}`,
    '',
    'Description:',
    description,
    '',
    '---',
    `Submitted:    ${submittedAt}`,
    `IP:           ${ip}`,
    `User-Agent:   ${userAgent}`,
  ].join('\n');

  const htmlBody = `
    <div style="font-family:Inter,Arial,sans-serif;color:#0f172a;max-width:600px;">
      <h2 style="color:#FF6B9E;margin-bottom:4px;">New Website Enquiry</h2>
      <p style="color:#64748b;margin-top:0;">Submitted via the nurengroup.com chatbot</p>
      <table style="border-collapse:collapse;width:100%;margin-top:16px;">
        <tr><td style="padding:6px 12px;background:#f8fafc;font-weight:600;width:120px;">Topic</td><td style="padding:6px 12px;">${escapeHtml(topic)}</td></tr>
        <tr><td style="padding:6px 12px;background:#f8fafc;font-weight:600;">Name</td><td style="padding:6px 12px;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:6px 12px;background:#f8fafc;font-weight:600;">Email</td><td style="padding:6px 12px;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
        <tr><td style="padding:6px 12px;background:#f8fafc;font-weight:600;">Phone</td><td style="padding:6px 12px;">${escapeHtml(phone)}</td></tr>
      </table>
      <h3 style="margin-top:24px;color:#7E57C2;">Enquiry Description</h3>
      <p style="white-space:pre-wrap;background:#f8fafc;padding:16px;border-radius:8px;">${escapeHtml(description)}</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin-top:24px;"/>
      <p style="color:#94a3b8;font-size:12px;">
        Submitted ${escapeHtml(submittedAt)}<br/>
        IP ${escapeHtml(ip)}<br/>
        User-Agent ${escapeHtml(userAgent)}
      </p>
    </div>
  `;

  const resendKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.ENQUIRY_FROM_EMAIL || 'Nuren Group Website <onboarding@resend.dev>';

  if (!resendKey) {
    console.warn('[enquiry] RESEND_API_KEY not set — logging enquiry instead of emailing.');
    console.log('[enquiry:pending-email]', JSON.stringify({ to: RECIPIENT, subject, textBody }));
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, delivery: 'logged' }),
    };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [RECIPIENT],
        reply_to: email,
        subject,
        text: textBody,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('Resend error', res.status, detail);
      return {
        statusCode: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Could not deliver enquiry. Please try again or email us directly.' }),
      };
    }

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, delivery: 'sent' }),
    };
  } catch (err) {
    console.error('Enquiry handler error', err);
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Something went wrong. Please try again.' }),
    };
  }
};
