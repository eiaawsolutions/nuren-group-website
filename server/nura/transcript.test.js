import { describe, it, expect } from 'vitest';
import { sanitizeTranscript, renderTranscript, TRANSCRIPT_LIMITS } from './transcript.js';

const user = (text) => ({ role: 'user', text });
const model = (text) => ({ role: 'model', text });

describe('sanitizeTranscript', () => {
  it('returns an empty list for anything but an array', () => {
    expect(sanitizeTranscript(undefined)).toEqual([]);
    expect(sanitizeTranscript('hello')).toEqual([]);
  });

  it('keeps only visitor and Nura turns with text', () => {
    const raw = [user('Hi'), { role: 'system', text: 'x' }, model(''), null, { role: 'user', text: 5 }, model('Hello!')];
    expect(sanitizeTranscript(raw)).toEqual([user('Hi'), model('Hello!')]);
  });

  it('caps each turn', () => {
    const [turn] = sanitizeTranscript([user('a'.repeat(5000))]);
    expect(turn.text).toHaveLength(TRANSCRIPT_LIMITS.maxCharsPerTurn);
  });

  it('keeps the most recent turns when there are too many', () => {
    const raw = Array.from({ length: TRANSCRIPT_LIMITS.maxTurns + 5 }, (_, i) => user(`turn ${i}`));
    const turns = sanitizeTranscript(raw);
    expect(turns).toHaveLength(TRANSCRIPT_LIMITS.maxTurns);
    expect(turns.at(-1).text).toBe(`turn ${TRANSCRIPT_LIMITS.maxTurns + 4}`);
  });

  it('drops the oldest turns to stay under the total size cap', () => {
    const raw = Array.from({ length: 20 }, (_, i) => user(`${i}`.padEnd(TRANSCRIPT_LIMITS.maxCharsPerTurn, '.')));
    const turns = sanitizeTranscript(raw);
    const total = turns.reduce((sum, t) => sum + t.text.length, 0);
    expect(total).toBeLessThanOrEqual(TRANSCRIPT_LIMITS.maxTotalChars);
    expect(turns.at(-1).text.startsWith('19')).toBe(true);
  });
});

describe('renderTranscript', () => {
  it('labels speakers in the plain-text version', () => {
    expect(renderTranscript([user('Hi'), model('Hello!')]).text).toBe('Visitor: Hi\n\nNura: Hello!');
  });

  it('escapes markup in the HTML version', () => {
    const { html } = renderTranscript([user('<script>alert(1)</script> & "quotes"')]);
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quotes&quot;');
    expect(html).not.toContain('<script>');
  });

  it('renders nothing for an empty transcript', () => {
    expect(renderTranscript([])).toEqual({ text: '', html: '' });
  });
});
