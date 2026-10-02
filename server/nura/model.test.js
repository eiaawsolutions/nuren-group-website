import { describe, it, expect } from 'vitest';
import { NURA_MODELS, resolveModelConfig, estimateCostUsd } from './model.js';

describe('resolveModelConfig', () => {
  it('defaults to Claude Haiku 4.5 without effort', () => {
    const model = resolveModelConfig({});
    expect(model.key).toBe('haiku');
    expect(model.id).toBe(NURA_MODELS.haiku.id);
    expect(model.effort).toBeNull();
    expect(model.warning).toBeNull();
  });

  it('selects Claude Sonnet 5 by key, case-insensitively, with low effort by default', () => {
    const model = resolveModelConfig({ NURA_MODEL: ' Sonnet ' });
    expect(model.key).toBe('sonnet');
    expect(model.id).toBe('claude-sonnet-5');
    expect(model.effort).toBe('low');
  });

  it('honours a valid NURA_EFFORT on models that support effort', () => {
    expect(resolveModelConfig({ NURA_MODEL: 'sonnet', NURA_EFFORT: 'medium' }).effort).toBe('medium');
  });

  it('ignores an invalid effort value', () => {
    expect(resolveModelConfig({ NURA_MODEL: 'sonnet', NURA_EFFORT: 'turbo' }).effort).toBe('low');
  });

  it('never sends effort to a model that rejects it', () => {
    expect(resolveModelConfig({ NURA_MODEL: 'haiku', NURA_EFFORT: 'high' }).effort).toBeNull();
  });

  it('falls back to Haiku with a warning for an unknown key', () => {
    const model = resolveModelConfig({ NURA_MODEL: 'gpt-4' });
    expect(model.key).toBe('haiku');
    expect(model.warning).toMatch(/gpt-4/);
  });

  it('gives models with adaptive thinking more output headroom', () => {
    expect(NURA_MODELS.sonnet.maxTokens).toBeGreaterThan(NURA_MODELS.haiku.maxTokens);
  });
});

describe('estimateCostUsd', () => {
  it('prices uncached input, output, cache writes (1.25x) and cache reads (0.1x)', () => {
    const usage = {
      input_tokens: 1_000_000,
      output_tokens: 100_000,
      cache_creation_input_tokens: 1_000_000,
      cache_read_input_tokens: 1_000_000,
    };
    // Haiku 4.5: $1 input, $5 output per million tokens.
    expect(estimateCostUsd(NURA_MODELS.haiku, usage)).toBeCloseTo(1 + 0.5 + 1.25 + 0.1, 9);
  });

  it('treats missing usage fields as zero', () => {
    expect(estimateCostUsd(NURA_MODELS.sonnet, { input_tokens: 500_000 })).toBeCloseTo(1, 9);
    expect(estimateCostUsd(NURA_MODELS.sonnet, undefined)).toBe(0);
  });
});
