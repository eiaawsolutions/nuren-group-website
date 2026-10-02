import { describe, it, expect } from 'vitest';
import { buildTranscript, hasVisitorTurns } from './transcript';
import { TRANSCRIPT_LIMITS } from '../../../server/nura/transcript.js';

describe('buildTranscript', () => {
  it('keeps the real conversation and drops notices and half-streamed replies', () => {
    expect(
      buildTranscript([
        { role: 'model', text: 'Hi, I am Nura', intro: true },
        { role: 'user', text: 'We sell baby wipes' },
        { role: 'model', text: 'Sorry, connection lost', local: true },
        { role: 'model', text: 'Great! KOL could work.' },
        { role: 'model', text: 'Typing…', streaming: true },
      ]),
    ).toEqual([
      { role: 'user', text: 'We sell baby wipes' },
      { role: 'model', text: 'Great! KOL could work.' },
    ]);
  });

  it('applies the same size limits as the server', () => {
    const long = Array.from({ length: 40 }, () => ({ role: 'user' as const, text: 'x'.repeat(3000) }));
    const transcript = buildTranscript(long);
    expect(transcript.every((t) => t.text.length <= TRANSCRIPT_LIMITS.maxCharsPerTurn)).toBe(true);
    expect(transcript.reduce((sum, t) => sum + t.text.length, 0)).toBeLessThanOrEqual(TRANSCRIPT_LIMITS.maxTotalChars);
  });
});

describe('hasVisitorTurns', () => {
  it('is true only once the visitor has said something', () => {
    expect(hasVisitorTurns([{ role: 'model', text: 'Hi', intro: true }])).toBe(false);
    expect(hasVisitorTurns([{ role: 'user', text: 'Hello' }])).toBe(true);
  });
});
