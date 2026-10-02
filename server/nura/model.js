// Model registry. The app picks a model by key (NURA_MODEL=haiku|sonnet),
// never by raw model ID, so a swap or a provider deprecation is a one-line
// change here. Each profile records what the API accepts for that model.
//
// Prices are Anthropic list prices per million tokens (claude-api reference,
// cached 2026-06-24). They feed the admin page's cost estimate only; check
// https://platform.claude.com/docs/en/about-claude/pricing before quoting.

export const NURA_MODELS = {
  haiku: {
    id: 'claude-haiku-4-5-20251001',
    label: 'Claude Haiku 4.5',
    // Haiku 4.5 rejects output_config.effort.
    supportsEffort: false,
    maxTokens: 1024,
    pricePerMTok: { input: 1, output: 5 },
  },
  sonnet: {
    id: 'claude-sonnet-5',
    label: 'Claude Sonnet 5',
    supportsEffort: true,
    // Adaptive thinking is on by default and its tokens count toward
    // max_tokens, so leave room for it on top of a short reply.
    maxTokens: 4096,
    pricePerMTok: { input: 2, output: 10 },
  },
};

const DEFAULT_MODEL_KEY = 'haiku';
// Chat is latency-sensitive and doesn't repay deep reasoning; raise only if evals show it helps.
const DEFAULT_EFFORT = 'low';
const EFFORT_LEVELS = new Set(['low', 'medium', 'high', 'xhigh', 'max']);

// Cache writes (5-minute TTL) and reads relative to the base input price.
const CACHE_WRITE_MULTIPLIER = 1.25;
const CACHE_READ_MULTIPLIER = 0.1;

/** Resolve NURA_MODEL / NURA_EFFORT into a model profile. */
export function resolveModelConfig(env = process.env) {
  const requested = (env.NURA_MODEL ?? DEFAULT_MODEL_KEY).trim().toLowerCase();
  const known = Object.hasOwn(NURA_MODELS, requested);
  const key = known ? requested : DEFAULT_MODEL_KEY;
  const profile = NURA_MODELS[key];

  const requestedEffort = (env.NURA_EFFORT ?? DEFAULT_EFFORT).trim().toLowerCase();
  const effort = profile.supportsEffort
    ? (EFFORT_LEVELS.has(requestedEffort) ? requestedEffort : DEFAULT_EFFORT)
    : null;

  return {
    key,
    ...profile,
    effort,
    warning: known ? null : `Unknown NURA_MODEL "${requested}"; using ${DEFAULT_MODEL_KEY}.`,
  };
}

/** Estimated USD cost of one response's usage on the given model profile. */
export function estimateCostUsd(model, usage) {
  if (!usage) return 0;
  const { input, output } = model.pricePerMTok;
  const dollars =
    (usage.input_tokens ?? 0) * input +
    (usage.cache_creation_input_tokens ?? 0) * input * CACHE_WRITE_MULTIPLIER +
    (usage.cache_read_input_tokens ?? 0) * input * CACHE_READ_MULTIPLIER +
    (usage.output_tokens ?? 0) * output;
  return dollars / 1_000_000;
}
