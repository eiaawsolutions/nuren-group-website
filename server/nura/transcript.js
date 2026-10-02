// The visitor's chat with Nura, attached to their enquiry email (with their
// consent) so the team doesn't have to ask again. It comes from the browser,
// so it is untrusted: shape-checked, size-capped and HTML-escaped here.
// The limits keep the whole enquiry body under the 64 KB JSON limit even for
// Mandarin text (3 bytes per character in UTF-8); src/components/Chatbot
// applies the same limits before sending.
import { escapeHtml } from '../html.js';

export const TRANSCRIPT_LIMITS = {
  maxTurns: 30,
  maxCharsPerTurn: 1500,
  maxTotalChars: 10_000,
};

const SPEAKER = { user: 'Visitor', model: 'Nura' };

/** @returns {Array<{role: 'user' | 'model', text: string}>} newest turns that fit the limits */
export function sanitizeTranscript(raw) {
  if (!Array.isArray(raw)) return [];
  const turns = raw
    .filter((t) => t && (t.role === 'user' || t.role === 'model') && typeof t.text === 'string' && t.text.trim())
    .map((t) => ({ role: t.role, text: t.text.trim().slice(0, TRANSCRIPT_LIMITS.maxCharsPerTurn) }))
    .slice(-TRANSCRIPT_LIMITS.maxTurns);

  let total = 0;
  let start = turns.length;
  while (start > 0 && total + turns[start - 1].text.length <= TRANSCRIPT_LIMITS.maxTotalChars) {
    start -= 1;
    total += turns[start].text.length;
  }
  return turns.slice(start);
}

/** Plain-text and HTML renderings for the enquiry email. */
export function renderTranscript(turns) {
  if (!turns.length) return { text: '', html: '' };
  const text = turns.map((t) => `${SPEAKER[t.role]}: ${t.text}`).join('\n\n');
  const html = turns
    .map(
      (t) =>
        `<p style="margin:0 0 10px;white-space:pre-wrap;"><strong style="color:${t.role === 'user' ? '#0f172a' : '#7E57C2'};">${SPEAKER[t.role]}:</strong> ${escapeHtml(t.text)}</p>`,
    )
    .join('');
  return { text, html };
}
