import { describe, it, expect } from 'vitest';
import { splitIntoBubbles, typingDelayMs } from './pacing';

describe('splitIntoBubbles', () => {
  it('keeps a one-paragraph reply as a single message', () => {
    expect(splitIntoBubbles('Sampling plus mum-KOL reviews is a good start.')).toEqual([
      'Sampling plus mum-KOL reviews is a good start.',
    ]);
  });

  it('sends each paragraph as its own message, like a person would', () => {
    expect(splitIntoBubbles('Sampling is a good start.\n\nIt gets the product into homes fast.')).toEqual([
      'Sampling is a good start.',
      'It gets the product into homes fast.',
    ]);
  });

  it('keeps a list with the sentence that introduces it', () => {
    expect(splitIntoBubbles('Two ideas:\n\n- Sampling\n- KOL reviews\n\nWant a sample plan?')).toEqual([
      'Two ideas:\n- Sampling\n- KOL reviews',
      'Want a sample plan?',
    ]);
  });

  it('never sends more than three messages', () => {
    const bubbles = splitIntoBubbles('One.\n\nTwo.\n\nThree.\n\nFour.');
    expect(bubbles).toEqual(['One.', 'Two.', 'Three.\n\nFour.']);
  });

  it('ignores blank paragraphs and Windows line endings', () => {
    expect(splitIntoBubbles('One.\r\n\r\n   \r\n\r\nTwo.')).toEqual(['One.', 'Two.']);
  });
});

describe('typingDelayMs', () => {
  it('never answers instantly', () => {
    expect(typingDelayMs('Ok.')).toBe(900);
  });

  it('takes longer for longer messages', () => {
    const short = typingDelayMs('x'.repeat(40));
    const medium = typingDelayMs('x'.repeat(100));
    expect(medium).toBeGreaterThan(short);
    expect(medium).toBe(2000);
  });

  it('never keeps the visitor waiting more than a few seconds', () => {
    expect(typingDelayMs('x'.repeat(2000))).toBe(2800);
  });
});
