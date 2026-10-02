import { describe, it, expect } from 'vitest';
import { detectReplyLanguage, languageDirective } from './language.js';

const user = (text) => ({ role: 'user', text });
const model = (text) => ({ role: 'model', text });

describe('detectReplyLanguage', () => {
  describe('Mandarin', () => {
    it('replies in Mandarin when the message contains Chinese', () => {
      expect(detectReplyLanguage('我们是一个婴儿护肤品牌，想在马来西亚做推广', [])).toBe('zh');
    });

    it('treats Mandarin mixed with English marketing terms as Mandarin', () => {
      expect(detectReplyLanguage('想了解一下 KOL campaign 的 pricing', [])).toBe('zh');
    });

    it('keeps English when a Chinese brand name appears in an English sentence', () => {
      expect(detectReplyLanguage('Our brand is called 小天使 and we want to reach new mums', [])).toBe('en');
    });
  });

  describe('Bahasa Malaysia', () => {
    it('replies in BM for a plain BM sentence', () => {
      expect(detectReplyLanguage('Saya nak tahu pasal pakej iklan untuk brand susu formula kami', [])).toBe('ms');
    });

    it('treats BM mixed with English words as BM', () => {
      expect(detectReplyLanguage('Boleh I tahu macam mana nak buat campaign KOL dengan Ibuencer?', [])).toBe('ms');
    });

    it('treats a short BM phrase as BM', () => {
      expect(detectReplyLanguage('terima kasih', [])).toBe('ms');
    });
  });

  describe('Malaysian English', () => {
    it('keeps English with Manglish particles in English', () => {
      expect(detectReplyLanguage('Ok lah, how much ah?', [])).toBe('en');
      expect(detectReplyLanguage('Can lah, send me the rate card', [])).toBe('en');
      expect(detectReplyLanguage('Is it ok to run ads for my baby brand ke?', [])).toBe('en');
    });

    it('is not fooled by English words that are also BM words', () => {
      expect(detectReplyLanguage('Do your ads meet ADA accessibility guidelines?', [])).toBe('en');
    });

    it('defaults to English for a plain English message', () => {
      expect(detectReplyLanguage('We sell baby wipes, what do you suggest?', [])).toBe('en');
    });
  });

  describe('switching languages mid-conversation', () => {
    it('follows a full English message even after earlier BM', () => {
      const history = [user('Saya nak tanya pasal iklan'), model('Boleh! Apa produk anda?')];
      expect(detectReplyLanguage('How much for a KOL campaign?', history)).toBe('en');
    });

    it('honours an explicit request to switch to English', () => {
      const history = [user('Boleh saya tahu harga?'), model('Harga bergantung pada skop campaign.')];
      expect(detectReplyLanguage('Actually can we continue in English please', history)).toBe('en');
    });

    it('honours an explicit request written in Chinese to use English', () => {
      expect(detectReplyLanguage('可以用英文吗', [])).toBe('en');
    });

    it('honours an explicit request to switch to BM', () => {
      expect(detectReplyLanguage('Can you reply in Bahasa Malaysia?', [user('Hi, what do you offer?')])).toBe('ms');
    });

    it('honours an explicit request to switch to Mandarin', () => {
      expect(detectReplyLanguage('Can we speak in Mandarin?', [])).toBe('zh');
    });
  });

  describe('short or ambiguous messages', () => {
    it('continues in the conversation language for a short acknowledgement', () => {
      const history = [user('我想了解 Ibuencer 的 KOL 服务'), model('好的！你的品牌是做什么的？')];
      expect(detectReplyLanguage('ok thanks', history)).toBe('zh');
    });

    it('keeps an earlier explicit language request for later ambiguous messages', () => {
      const history = [
        user('Saya nak tanya pasal iklan'),
        model('Boleh!'),
        user('English please'),
        model('Sure, happy to switch.'),
      ];
      expect(detectReplyLanguage('ok', history)).toBe('en');
    });

    it('lets a clear message in a new language override an earlier explicit request', () => {
      const history = [user('English please'), model('Sure!')];
      expect(detectReplyLanguage('Sebenarnya saya lebih selesa guna BM', history)).toBe('ms');
    });

    it('defaults to English when nothing in the conversation is clear', () => {
      expect(detectReplyLanguage('👍', [])).toBe('en');
      expect(detectReplyLanguage('RM30K', [user('ok')])).toBe('en');
    });

    it('ignores assistant turns when inferring the conversation language', () => {
      const history = [user('Hi'), model('Hai! Boleh saya bantu anda dengan apa?')];
      expect(detectReplyLanguage('ok', history)).toBe('en');
    });

    it('handles oversized input without scanning all of it', () => {
      const started = performance.now();
      expect(detectReplyLanguage('How much is it? '.repeat(20_000), [user('Saya nak tanya '.repeat(5_000))])).toBe('en');
      expect(performance.now() - started).toBeLessThan(200);
    });

    it('tolerates malformed history entries', () => {
      expect(detectReplyLanguage('ok', [null, { role: 'user' }, 'text', user('Saya nak tanya')])).toBe('ms');
      expect(detectReplyLanguage('ok', undefined)).toBe('en');
    });
  });
});

describe('languageDirective', () => {
  it('gives a calm, one-paragraph instruction for every language', () => {
    for (const lang of ['en', 'ms', 'zh']) {
      const directive = languageDirective(lang);
      expect(directive.length).toBeGreaterThan(20);
      expect(directive).not.toMatch(/CRITICAL|FAILED|MUST|═/);
    }
  });

  it('keeps marketing terms in English for BM and Mandarin', () => {
    expect(languageDirective('ms')).toMatch(/Bahasa Malaysia/);
    expect(languageDirective('ms')).toMatch(/KOL/);
    expect(languageDirective('zh')).toMatch(/Simplified Chinese/);
    expect(languageDirective('zh')).toMatch(/KOL/);
  });
});
