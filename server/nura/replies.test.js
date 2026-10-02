import { describe, it, expect } from 'vitest';
import { replyCopy, trimToLastSentence, finalizeReply } from './replies.js';

describe('replyCopy', () => {
  const keys = ['rateLimited', 'unavailable', 'empty', 'tooLong', 'required'];

  it('has every message in English, BM and Mandarin', () => {
    for (const lang of ['en', 'ms', 'zh']) {
      for (const key of keys) {
        expect(replyCopy(key, lang), `${key}/${lang}`).toEqual(expect.any(String));
        expect(replyCopy(key, lang).length).toBeGreaterThan(5);
      }
    }
  });

  it('writes the Mandarin copy in Chinese', () => {
    for (const key of keys) expect(replyCopy(key, 'zh')).toMatch(/[一-鿿]/);
  });

  it('falls back to English for an unknown language', () => {
    expect(replyCopy('unavailable', 'ta')).toBe(replyCopy('unavailable', 'en'));
  });

  it('never tells the visitor "I don\'t know" bluntly in the fallback for an empty reply', () => {
    expect(replyCopy('empty', 'en')).not.toMatch(/not sure about that/i);
  });
});

describe('trimToLastSentence', () => {
  it('drops a trailing half-sentence', () => {
    expect(trimToLastSentence('KOL works well here. For sampling we usually rec')).toBe(
      'KOL works well here.',
    );
  });

  it('understands Chinese sentence endings', () => {
    expect(trimToLastSentence('我们建议先做 KOL。然后再考虑 sampling，因为')).toBe('我们建议先做 KOL。');
  });

  it('keeps complete list items when the cut happens mid-item', () => {
    expect(trimToLastSentence('Here are two ideas:\n- Sponsored content\n- KOL campaign with Ibu')).toBe(
      'Here are two ideas:\n- Sponsored content',
    );
  });

  it('leaves text alone when there is no boundary to cut back to', () => {
    expect(trimToLastSentence('Sponsored content and KOL campaigns are a good')).toBe(
      'Sponsored content and KOL campaigns are a good',
    );
  });
});

describe('finalizeReply', () => {
  const message = (content, stop_reason = 'end_turn') => ({ content, stop_reason });

  it('joins the text blocks and ignores thinking blocks', () => {
    const result = finalizeReply(
      message([{ type: 'thinking', thinking: '' }, { type: 'text', text: ' Hello there. ' }]),
      'en',
    );
    expect(result).toEqual({ reply: 'Hello there.', truncated: false });
  });

  it('trims a reply cut off by max_tokens and flags it', () => {
    expect(finalizeReply(message([{ type: 'text', text: 'One sentence. Two sen' }], 'max_tokens'), 'en')).toEqual({
      reply: 'One sentence.',
      truncated: true,
    });
  });

  it('falls back to localised copy when there is no text', () => {
    expect(finalizeReply(message([]), 'ms')).toEqual({ reply: replyCopy('empty', 'ms'), truncated: false });
    expect(finalizeReply(message(undefined, 'refusal'), 'zh').reply).toBe(replyCopy('empty', 'zh'));
  });
});
