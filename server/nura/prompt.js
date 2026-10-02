// Single source of truth for Nura's system prompt. Edit prompt.md, not this
// file. The prompt is read once at boot; line endings are normalised so a
// Windows checkout sends the model the same bytes as Linux (and the same
// prefix, which matters once prompt caching is switched on).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { languageDirective } from './language.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export const NURA_SYSTEM_PROMPT = fs
  .readFileSync(path.join(here, 'prompt.md'), 'utf8')
  .replace(/\r\n?/g, '\n')
  .trim();

// Content hash of the prompt, logged with every call so eval runs and usage
// can be tied to the exact prompt that produced them.
export const NURA_PROMPT_VERSION = crypto.createHash('sha256').update(NURA_SYSTEM_PROMPT).digest('hex').slice(0, 8);

// Restated in the per-turn note because instructions at the end of the
// system prompt carry the most weight, and these slipped in production
// evals (replies of 500-900 characters, two questions at once).
export const TURN_REMINDER =
  'For this reply: under about 60 words, at most one question, start with substance, and finish with the options line.';

// Added for turns where the visitor asks for a price, proposal, budget plan
// or meeting (see intent.js).
export const TEAM_HINT =
  'The visitor is asking for something only the team can give, such as a price, proposal or meeting: answer briefly, then name the **Talk to our team** button and say what to include (brand, goal, timing, budget range).';

/**
 * System blocks for one chat turn: the stable prompt first, with a cache
 * breakpoint, then the per-turn note (language, reminder, optional team
 * hint), so the cached prefix never changes between turns.
 * @param {'en' | 'ms' | 'zh'} lang
 * @param {{ teamHint?: boolean }} [options]
 */
export function buildSystemPrompt(lang, { teamHint = false } = {}) {
  const note = [languageDirective(lang), TURN_REMINDER, ...(teamHint ? [TEAM_HINT] : [])].join('\n');
  return [
    { type: 'text', text: NURA_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: note },
  ];
}
