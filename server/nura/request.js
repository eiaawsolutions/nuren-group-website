// Builds the Messages API request for one chat turn.
import { buildSystemPrompt } from './prompt.js';
import { asksForTeam } from './intent.js';

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_REPLY_LENGTH = 2000;
// ~12 exchanges, so Nura still remembers the brand and goal from the start.
const MAX_HISTORY = 24;

// Frontend sends history with role: 'user' | 'model' (Gemini convention).
// Anthropic expects role: 'user' | 'assistant'. Map at the boundary.
// History is client-supplied, so both the turn count and turn length are capped.
export function toAnthropicMessages(rawHistory, currentMessage) {
  const mapped = (Array.isArray(rawHistory) ? rawHistory.slice(-MAX_HISTORY) : [])
    .filter((m) => m && typeof m.text === 'string' && m.text.trim() && (m.role === 'user' || m.role === 'model'))
    .map((m) => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.text.slice(0, m.role === 'model' ? MAX_HISTORY_REPLY_LENGTH : MAX_MESSAGE_LENGTH),
    }));
  // The API requires the conversation to open with a user turn.
  while (mapped.length && mapped[0].role === 'assistant') mapped.shift();
  mapped.push({ role: 'user', content: currentMessage });
  return mapped;
}

/**
 * Caching: the system prompt carries an explicit breakpoint (shared by every
 * conversation), and the top-level cache_control lets the API cache the
 * growing conversation tail, so each follow-up turn reads the earlier turns
 * from cache. Prefixes under the model's minimum (4,096 tokens on Haiku 4.5,
 * 1,024 on Sonnet 5) simply don't cache — no error.
 */
export function buildChatRequest({ model, lang, history, message }) {
  return {
    model: model.id,
    max_tokens: model.maxTokens,
    system: buildSystemPrompt(lang, { teamHint: asksForTeam(message) }),
    messages: toAnthropicMessages(history, message),
    cache_control: { type: 'ephemeral' },
    ...(model.effort ? { output_config: { effort: model.effort } } : {}),
  };
}
