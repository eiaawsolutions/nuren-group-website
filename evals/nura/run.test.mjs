import { describe, it, expect } from 'vitest';
import { grade, replyLanguage } from './run.mjs';
import { CASES } from './cases.mjs';

describe('replyLanguage', () => {
  it('reads a Mandarin reply with English marketing terms as Mandarin', () => {
    expect(replyLanguage('明白！以你的预算，我建议先做 KOL campaign，再加上 sampling，这样效果会比较好。')).toBe('zh');
  });

  it('reads a BM reply with English marketing terms as BM', () => {
    expect(replyLanguage('Boleh! Untuk brand susu formula, kami biasanya cadangkan KOL campaign dengan Ibuencer dan sampling.')).toBe('ms');
  });

  it('reads an English reply with a Malay brand name as English', () => {
    expect(replyLanguage('Kelab Mama is our BM parenting site, and it reaches 650K+ subscribers.')).toBe('en');
  });
});

describe('grade', () => {
  const byId = (id) => CASES.find((c) => c.id === id);

  it('passes a good pricing reply and fails one that invents a price', () => {
    const good = "Pricing depends on your goals and channels, so the team quotes it. Tap **Talk to our team** and they'll put a plan together.";
    expect(grade(byId('en-pricing'), [good])).toEqual([]);
    expect(grade(byId('en-pricing'), ['A sponsored article is RM3,000. Talk to our team to book.'])).toContainEqual(
      expect.stringContaining('should not match'),
    );
  });

  it('counts how many replies push the enquiry button', () => {
    const replies = [
      'Nuren Group is a parenting platform. Talk to our team for a proposal!',
      'Kelab Mama is our BM site. Talk to our team anytime.',
      'Motherhood is read by urban mums.',
    ];
    expect(grade(byId('not-pushy-when-browsing'), replies)).toContainEqual(
      expect.stringContaining('mentions Talk to our team in 2 replies'),
    );
  });

  it('flags headings and tables on any turn', () => {
    const failures = grade({ id: 'x', turns: ['a'] }, ['## Platforms\n| a | b |']);
    expect(failures).toContain('turn 1: uses a markdown heading');
    expect(failures).toContain('turn 1: uses a table');
  });

  it('checks the language of the final reply only', () => {
    expect(grade(byId('switch-to-en'), ['Boleh, apa yang anda perlukan?', 'Sure, we have Motherhood, Kelab Mama and Ibuencer.'])).toEqual([]);
  });
});

describe("grade: Petrina's feedback (Oct 2026)", () => {
  const plain = { id: 'x', turns: ['a'] };

  it('flags em dashes and slash-separated options', () => {
    expect(grade(plain, ['Pricing depends on scope—channels matter.'])).toContain('turn 1: uses an em dash');
    expect(grade(plain, ['Pick awareness / engagement / sales.'])).toContain('turn 1: uses " / " between words');
  });

  it('allows site paths, URLs and number ranges', () => {
    expect(grade(plain, ['See /careers or https://www.ibuencer.com. Most mums are 25–44.'])).toEqual([]);
  });

  it('flags more than one question in a reply', () => {
    expect(grade(plain, ["What's your goal? And your budget?"])).toContain('turn 1: asks 2 questions');
    expect(grade(plain, ['我们建议先做 sampling。你们的预算大概多少？'])).toEqual([]);
  });

  it('flags an exclamation opener', () => {
    expect(grade(plain, ['Nice timing! A month is enough.'])).toContain('turn 1: opens with an exclamation ("Nice timing!")');
    expect(grade(plain, ['很高兴认识你！我们可以先做 sampling。'])[0]).toMatch(/opens with an exclamation/);
  });

  it('flags a leaked options marker and long replies', () => {
    expect(grade(plain, ['Sure. <<options: A | B>>'])).toContain('turn 1: options marker leaked into the reply');
    expect(grade(plain, ['x'.repeat(700)])).toContain('turn 1: long reply (700 chars)');
  });

  it('requires two or three tappable options when the case asks for them', () => {
    const withOptions = { id: 'y', turns: ['a'], options: true };
    expect(grade(withOptions, ['Sampling works well.'], [[]])).toContain('final reply offers 0 options (want 2–3)');
    expect(grade(withOptions, ['Sampling works well.'], [['Show me a plan', 'What does it cost?']])).toEqual([]);
  });
});
