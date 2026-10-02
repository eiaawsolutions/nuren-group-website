// Per-call usage records (for logs) and running totals (for the admin page).
// Standard fields use OpenTelemetry GenAI semantic-convention names so the
// logs line up with OTel tooling later; everything else is under app.*.
// Message content is never recorded: chats can contain personal data.
import { estimateCostUsd } from './model.js';

/** One structured log record for a completed model call. */
export function usageLogRecord({ route, model, lang, message, latencyMs, promptVersion, truncated = false }) {
  const usage = message.usage ?? {};
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  return {
    'gen_ai.provider.name': 'anthropic',
    'gen_ai.operation.name': 'chat',
    'gen_ai.request.model': model.id,
    'gen_ai.response.model': message.model ?? model.id,
    // OTel counts all input tokens; Anthropic reports cached ones separately.
    'gen_ai.usage.input_tokens': (usage.input_tokens ?? 0) + cacheRead + cacheWrite,
    'gen_ai.usage.output_tokens': usage.output_tokens ?? 0,
    'gen_ai.response.finish_reasons': [message.stop_reason ?? 'unknown'],
    'app.route': route,
    'app.lang': lang,
    'app.effort': model.effort ?? null,
    'app.latency_ms': latencyMs,
    'app.prompt_version': promptVersion ?? null,
    'app.cache_read_tokens': cacheRead,
    'app.cache_write_tokens': cacheWrite,
    'app.truncated': truncated,
    'app.cost_usd': estimateCostUsd(model, usage),
  };
}

const increment = (counts, key) => {
  counts[key] = (counts[key] ?? 0) + 1;
};

/** In-memory totals since the process started (reset on every deploy). */
export function createUsageTracker({ now = Date.now } = {}) {
  const since = new Date(now()).toISOString();
  const totals = {
    requests: 0,
    errors: 0,
    aborted: 0,
    truncated: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    estimatedCostUsd: 0,
    latencyMsTotal: 0,
    byRoute: {},
    byLang: {},
  };

  return {
    /** Record a completed call; returns the log record for the caller to emit. */
    record(call) {
      const record = usageLogRecord(call);
      const usage = call.message.usage ?? {};
      totals.requests += 1;
      totals.inputTokens += usage.input_tokens ?? 0;
      totals.outputTokens += usage.output_tokens ?? 0;
      totals.cacheReadTokens += record['app.cache_read_tokens'];
      totals.cacheWriteTokens += record['app.cache_write_tokens'];
      totals.estimatedCostUsd += record['app.cost_usd'];
      totals.latencyMsTotal += call.latencyMs;
      if (call.truncated) totals.truncated += 1;
      increment(totals.byRoute, call.route);
      increment(totals.byLang, call.lang);
      return record;
    },

    /** @param {'error' | 'aborted'} kind */
    recordFailure(kind) {
      if (kind === 'aborted') totals.aborted += 1;
      else totals.errors += 1;
    },

    snapshot() {
      const { latencyMsTotal, ...rest } = totals;
      const allInput = totals.inputTokens + totals.cacheReadTokens + totals.cacheWriteTokens;
      return {
        since,
        ...rest,
        byRoute: { ...totals.byRoute },
        byLang: { ...totals.byLang },
        avgLatencyMs: totals.requests ? Math.round(latencyMsTotal / totals.requests) : 0,
        // Share of input served from cache — the number to watch after enabling caching.
        cacheReadRatio: allInput ? totals.cacheReadTokens / allInput : 0,
      };
    },
  };
}
