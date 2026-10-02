import { describe, it, expect } from 'vitest';
import { createUsageTracker, usageLogRecord } from './usage.js';
import { resolveModelConfig } from './model.js';

const haiku = resolveModelConfig({});
const message = (overrides = {}) => ({
  model: haiku.id,
  stop_reason: 'end_turn',
  content: [{ type: 'text', text: 'PRIVATE REPLY TEXT' }],
  usage: { input_tokens: 500, output_tokens: 100, cache_read_input_tokens: 3000, cache_creation_input_tokens: 0 },
  ...overrides,
});

describe('usageLogRecord', () => {
  it('uses OpenTelemetry GenAI names for standard fields and app.* for the rest', () => {
    const record = usageLogRecord({
      route: 'chat', model: haiku, lang: 'ms', message: message(), latencyMs: 812, promptVersion: 'abc123',
    });
    expect(record).toMatchObject({
      'gen_ai.provider.name': 'anthropic',
      'gen_ai.operation.name': 'chat',
      'gen_ai.request.model': haiku.id,
      'gen_ai.response.model': haiku.id,
      'gen_ai.usage.input_tokens': 3500,
      'gen_ai.usage.output_tokens': 100,
      'gen_ai.response.finish_reasons': ['end_turn'],
      'app.route': 'chat',
      'app.lang': 'ms',
      'app.latency_ms': 812,
      'app.prompt_version': 'abc123',
      'app.cache_read_tokens': 3000,
      'app.cache_write_tokens': 0,
    });
    expect(record['app.cost_usd']).toBeCloseTo((500 * 1 + 3000 * 0.1 + 100 * 5) / 1e6, 12);
  });

  it('never includes message content', () => {
    const record = usageLogRecord({ route: 'chat', model: haiku, lang: 'en', message: message(), latencyMs: 1 });
    expect(JSON.stringify(record)).not.toContain('PRIVATE REPLY TEXT');
  });
});

describe('createUsageTracker', () => {
  it('aggregates requests, tokens, cost, latency and cache-read ratio', () => {
    const tracker = createUsageTracker({ now: () => Date.parse('2026-10-02T00:00:00Z') });
    tracker.record({ route: 'chat', model: haiku, lang: 'en', message: message(), latencyMs: 1000 });
    tracker.record({
      route: 'brief', model: haiku, lang: 'zh', latencyMs: 500,
      message: message({ usage: { input_tokens: 1000, output_tokens: 50 } }),
    });

    const snapshot = tracker.snapshot();
    expect(snapshot.since).toBe('2026-10-02T00:00:00.000Z');
    expect(snapshot.requests).toBe(2);
    expect(snapshot.byRoute).toEqual({ chat: 1, brief: 1 });
    expect(snapshot.byLang).toEqual({ en: 1, zh: 1 });
    expect(snapshot.inputTokens).toBe(1500);
    expect(snapshot.cacheReadTokens).toBe(3000);
    expect(snapshot.outputTokens).toBe(150);
    expect(snapshot.avgLatencyMs).toBe(750);
    expect(snapshot.cacheReadRatio).toBeCloseTo(3000 / 4500, 6);
    expect(snapshot.estimatedCostUsd).toBeCloseTo((500 + 300 + 500 + 1000 + 250) / 1e6, 12);
  });

  it('counts truncated replies, aborted streams and errors', () => {
    const tracker = createUsageTracker();
    tracker.record({ route: 'chat', model: haiku, lang: 'en', message: message(), latencyMs: 10, truncated: true });
    tracker.recordFailure('aborted');
    tracker.recordFailure('error');
    tracker.recordFailure('error');
    expect(tracker.snapshot()).toMatchObject({ truncated: 1, aborted: 1, errors: 2, requests: 1 });
  });

  it('reports zero ratios before any traffic', () => {
    expect(createUsageTracker().snapshot()).toMatchObject({ requests: 0, avgLatencyMs: 0, cacheReadRatio: 0 });
  });
});
