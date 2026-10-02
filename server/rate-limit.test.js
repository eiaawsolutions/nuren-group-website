import { describe, it, expect } from 'vitest';
import { createRateLimiter } from './rate-limit.js';

describe('createRateLimiter', () => {
  const setup = () => {
    let clock = 0;
    const allow = createRateLimiter({ windowMs: 60_000, max: 3, now: () => clock });
    return { allow, tick: (ms) => (clock += ms) };
  };

  it('allows up to max requests per window, per key', () => {
    const { allow } = setup();
    expect([allow('a'), allow('a'), allow('a'), allow('a')]).toEqual([true, true, true, false]);
    expect(allow('b')).toBe(true);
  });

  it('opens a fresh window once the old one has passed, even with steady traffic', () => {
    const { allow, tick } = setup();
    // One request every 15 s: 4 per minute against a limit of 3.
    const results = [];
    for (let i = 0; i < 8; i += 1) {
      results.push(allow('a'));
      tick(15_000);
    }
    // Window 1 (0–45 s): 3 allowed, then 1 blocked; window 2 starts at 60 s.
    expect(results).toEqual([true, true, true, false, true, true, true, false]);
  });

  it('does not extend the window when a blocked request arrives', () => {
    const { allow, tick } = setup();
    allow('a');
    allow('a');
    allow('a');
    tick(59_000);
    expect(allow('a')).toBe(false);
    tick(1_000);
    expect(allow('a')).toBe(true);
  });
});
