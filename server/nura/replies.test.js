import { describe, it, expect } from 'vitest';
import { replyCopy, trimToLastSentence, finalizeReply, extractOptions, naturalize } from './replies.js';

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

describe('naturalize', () => {
  it('swaps em dashes for the punctuation a person would use', () => {
    expect(naturalize('Build trust fast—skin products need credibility.')).toBe('Build trust fast, skin products need credibility.');
    expect(naturalize('It depends on your goal — a single story costs less.')).toBe('It depends on your goal, a single story costs less.');
    expect(naturalize('Of course—lots of brands do.')).toBe('Of course, lots of brands do.');
    expect(naturalize('妈妈——她们是决策者。')).toBe('妈妈，她们是决策者。');
  });

  it('keeps number ranges but swaps spaced en dashes', () => {
    expect(naturalize('Most mums are 25–44.')).toBe('Most mums are 25–44.');
    expect(naturalize('Awareness – then trial.')).toBe('Awareness, then trial.');
  });

  it('drops a short exclamation opener', () => {
    expect(naturalize('Hey! Nuren reaches 5M+ mums.')).toBe('Nuren reaches 5M+ mums.');
    expect(naturalize('Boleh! Mari kita cakap BM je.')).toBe('Mari kita cakap BM je.');
    expect(naturalize('你好！我们可以先做 sampling。')).toBe('我们可以先做 sampling。');
    expect(naturalize('Nice timing! A month is enough.')).toBe('A month is enough.');
  });

  it('calms a longer exclamation opener to a full stop', () => {
    expect(naturalize('Great to hear you are launching soon! Most brands start with sampling.')).toBe(
      'Great to hear you are launching soon. Most brands start with sampling.',
    );
  });

  it('leaves exclamations later in the reply, and a reply that is only a greeting', () => {
    expect(naturalize('Sampling works. It is fast!')).toBe('Sampling works. It is fast!');
    expect(naturalize('Hey!')).toBe('Hey!');
  });
});

describe('extractOptions: the team button is always on screen', () => {
  it('drops options that just repeat "talk to the team"', () => {
    const raw = 'Sure.\n<<options: Tell me about sampling | Talk to our team | Talk to the team now | 直接联系团队报价 | Hubungi team kami>>';
    expect(extractOptions(raw).options).toEqual(['Tell me about sampling']);
  });
});

describe('finalizeReply tidies punctuation', () => {
  it('applies naturalize to the visible reply', () => {
    const message = { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Hey! Sampling works—fast.\n<<options: How? | Cost?>>' }] };
    expect(finalizeReply(message, 'en').reply).toBe('Sampling works, fast.');
  });
});
