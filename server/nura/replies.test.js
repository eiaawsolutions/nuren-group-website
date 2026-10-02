import { describe, it, expect } from 'vitest';
import { replyCopy, trimToLastSentence, finalizeReply, extractOptions } from './replies.js';

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
    expect(result).toEqual({ reply: 'Hello there.', options: [], truncated: false });
  });

  it('trims a reply cut off by max_tokens and flags it', () => {
    expect(finalizeReply(message([{ type: 'text', text: 'One sentence. Two sen' }], 'max_tokens'), 'en')).toEqual({
      reply: 'One sentence.',
      options: [],
      truncated: true,
    });
  });

  it('falls back to localised copy when there is no text', () => {
    expect(finalizeReply(message([]), 'ms')).toEqual({ reply: replyCopy('empty', 'ms'), options: [], truncated: false });
    expect(finalizeReply(message(undefined, 'refusal'), 'zh').reply).toBe(replyCopy('empty', 'zh'));
  });
});

describe('extractOptions', () => {
  it('pulls the hidden options line out of the reply', () => {
    expect(extractOptions('Sampling suits a launch.\n<<options: How does sampling work? | Show me a plan | What about KOLs?>>')).toEqual({
      text: 'Sampling suits a launch.',
      options: ['How does sampling work?', 'Show me a plan', 'What about KOLs?'],
    });
  });

  it('keeps at most three short, distinct options', () => {
    const { options } = extractOptions(`Hi.\n<<options: A | A |  | B | C | D | ${'x'.repeat(80)}>>`);
    expect(options).toEqual(['A', 'B', 'C']);
  });

  it('handles a missing closing marker and an empty list', () => {
    expect(extractOptions('Hello.\n<<options: Plan | Cost')).toEqual({ text: 'Hello.', options: ['Plan', 'Cost'] });
    expect(extractOptions('Hello.\n<<options:>>')).toEqual({ text: 'Hello.', options: [] });
  });

  it('strips a marker cut off mid-word by max_tokens', () => {
    expect(extractOptions('Hello there.\n<<opt')).toEqual({ text: 'Hello there.', options: [] });
  });

  it('leaves replies without a marker alone', () => {
    expect(extractOptions('Just an answer.')).toEqual({ text: 'Just an answer.', options: [] });
  });
});

describe('finalizeReply with options', () => {
  it('returns the options separately from the visible reply', () => {
    const message = { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Try sampling.\n<<options: How? | Cost?>>' }] };
    expect(finalizeReply(message, 'en')).toEqual({ reply: 'Try sampling.', options: ['How?', 'Cost?'], truncated: false });
  });

  it('never shows a bare options line as the reply', () => {
    const message = { stop_reason: 'end_turn', content: [{ type: 'text', text: '<<options: A | B>>' }] };
    expect(finalizeReply(message, 'en')).toEqual({ reply: replyCopy('empty', 'en'), options: ['A', 'B'], truncated: false });
  });
});
