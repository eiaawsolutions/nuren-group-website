import { describe, it, expect } from 'vitest';
import { asksForTeam } from './intent.js';

describe('asksForTeam', () => {
  it('spots pricing, quotes, proposals, budgets and meetings in English', () => {
    for (const message of [
      'How much does a sponsored article cost?',
      'We have RM50K for a 3-month campaign starting next month. Can you propose something?',
      'Do you have a rate card?',
      'Can we set up a meeting?',
      "Here's my brief",
      'Where can I upload our brief?',
      "What's the pricing for KOL?",
    ]) {
      expect(asksForTeam(message), message).toBe(true);
    }
  });

  it('spots the same in BM and Mandarin', () => {
    for (const message of ['Berapa harga pakej iklan?', 'Boleh bagi sebut harga?', '想了解一下 KOL campaign 的 pricing', '可以给我报价吗', '预算大概五万']) {
      expect(asksForTeam(message), message).toBe(true);
    }
  });

  it('leaves ordinary questions alone', () => {
    for (const message of [
      'How do KOL campaigns with Ibuencer work?',
      "I'm a creator. Can I join Ibuencer?",
      "What's Kelab Mama?",
      "Are you hiring? I'm a graphic designer.",
      'Who reads Motherhood.com.my?',
    ]) {
      expect(asksForTeam(message), message).toBe(false);
    }
  });
});
