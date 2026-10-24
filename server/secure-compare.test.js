import { describe, it, expect } from 'vitest';
import { secretsMatch } from './secure-compare.js';

describe('secretsMatch', () => {
  it('accepts the exact secret', () => {
    expect(secretsMatch('correct horse battery staple', 'correct horse battery staple')).toBe(true);
  });

  it('rejects a different secret of the same length', () => {
    expect(secretsMatch('correct horse battery stapler', 'correct horse battery staples')).toBe(false);
  });

  it('rejects a secret of a different length', () => {
    expect(secretsMatch('short', 'a much longer secret')).toBe(false);
    expect(secretsMatch('', 'secret')).toBe(false);
  });

  it('rejects non-string input instead of throwing', () => {
    expect(secretsMatch(undefined, 'secret')).toBe(false);
    expect(secretsMatch('secret', null)).toBe(false);
  });
});
