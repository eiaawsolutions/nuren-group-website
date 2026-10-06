// How a lead reads to the sales team: the notification email and the CSV
// export. Everything a visitor typed is escaped (HTML) or neutralised
// (spreadsheet formulas) here.
import { escapeHtml } from '../html.js';
import { renderTranscript } from '../nura/transcript.js';
import { enquiryTitle } from './enquiry.js';

export const EMAIL_SUBJECT_PREFIX = 'Nuren Group Website Enquiry';

const ROWS = [
  ['Enquiry type', (l) => l.typeLabel],
  ['Brand or company', (l) => l.company],
  ['Name', (l) => l.name],
  ['Email', (l) => l.email],
  ['Mobile', (l) => l.phone],
  ['Target audience', (l) => l.audience],
  ['Campaign period', (l) => l.period],
  ['Budget range', (l) => l.budget],
  ['Brief attached', (l) => (l.attachment ? `${l.attachment.filename} (${formatSize(l.attachment.size)})` : '')],
];

export function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const SOURCE_LABEL = { chat: 'Nura chat', 'contact-form': 'Contact Us form' };

/** @param {object} lead  a stored lead record, @param {{ip: string, userAgent: string}} meta */
export function renderLeadEmail(lead, { ip, userAgent }) {
  const rows = ROWS.map(([label, get]) => [label, get(lead)]).filter(([, value]) => value);
  const chat = renderTranscript(lead.transcript ?? []);
  const chatHeading = `Chat with Nura (${(lead.transcript ?? []).length} messages, shared by the visitor)`;
  const via = SOURCE_LABEL[lead.source] ?? 'website';

  const text = [
    `A new enquiry was submitted on the Nuren Group website (${via}).`,
    '',
    ...rows.map(([label, value]) => `${`${label}:`.padEnd(18)}${value}`),
    '',
    'Message:',
    lead.message,
    '',
    ...(chat.text ? [`${chatHeading}:`, '', chat.text, ''] : []),
    '---',
    `Submitted:        ${lead.ts}`,
    `Lead ID:          ${lead.id}`,
    `IP:               ${ip}`,
    `User-Agent:       ${userAgent}`,
  ].join('\n');

  const cell = 'padding:6px 12px;';
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;color:#0f172a;max-width:600px;">
      <h2 style="color:#FF6B9E;margin-bottom:4px;">New Website Enquiry</h2>
      <p style="color:#64748b;margin-top:0;">Submitted via the nurengroup.com ${escapeHtml(via)}</p>
      <table style="border-collapse:collapse;width:100%;margin-top:16px;">
        ${rows
          .map(([label, value]) => {
            const shown =
              label === 'Email' ? `<a href="mailto:${escapeHtml(value)}">${escapeHtml(value)}</a>` : escapeHtml(value);
            return `<tr><td style="${cell}background:#f8fafc;font-weight:600;width:150px;">${label}</td><td style="${cell}">${shown}</td></tr>`;
          })
          .join('')}
      </table>
      <h3 style="margin-top:24px;color:#7E57C2;">Message</h3>
      <p style="white-space:pre-wrap;background:#f8fafc;padding:16px;border-radius:8px;">${escapeHtml(lead.message)}</p>
      ${chat.html ? `<h3 style="margin-top:24px;color:#7E57C2;">${escapeHtml(chatHeading)}</h3>
      <div style="background:#f8fafc;padding:16px;border-radius:8px;font-size:14px;">${chat.html}</div>` : ''}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin-top:24px;"/>
      <p style="color:#94a3b8;font-size:12px;">
        Submitted ${escapeHtml(lead.ts)}<br/>
        Lead ID ${escapeHtml(lead.id)}<br/>
        IP ${escapeHtml(ip)}<br/>
        User-Agent ${escapeHtml(userAgent)}
      </p>
    </div>
  `;

  return { subject: `${EMAIL_SUBJECT_PREFIX}: ${enquiryTitle(lead)}`, text, html };
}

const CSV_COLUMNS = [
  ['Received', (l) => l.ts],
  ['Enquiry type', (l) => l.typeLabel],
  ['Brand or company', (l) => l.company],
  ['Name', (l) => l.name],
  ['Email', (l) => l.email],
  ['Mobile', (l) => l.phone],
  ['Target audience', (l) => l.audience],
  ['Campaign period', (l) => l.period],
  ['Budget range', (l) => l.budget],
  ['Message', (l) => l.message],
  ['Brief file', (l) => l.attachment?.filename ?? ''],
  ['Came from', (l) => SOURCE_LABEL[l.source] ?? l.source],
  ['Email delivery', (l) => l.delivery],
  ['Lead ID', (l) => l.id],
];

// A cell starting with = + - @ (or a tab/CR) is run as a formula by Excel and
// Sheets, so a hostile "name" could exfiltrate data. A leading quote defuses it.
function csvCell(value) {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function leadsToCsv(leads) {
  const lines = [CSV_COLUMNS.map(([header]) => header).join(',')];
  for (const lead of leads) lines.push(CSV_COLUMNS.map(([, get]) => csvCell(get(lead))).join(','));
  // BOM so Excel reads the UTF-8 (Mandarin names) correctly.
  return `﻿${lines.join('\r\n')}\r\n`;
}
