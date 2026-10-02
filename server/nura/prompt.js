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

/**
 * System blocks for one chat turn: the stable prompt first, with a cache
 * breakpoint, then the per-turn language note, so the cached prefix never
 * changes between turns.
 * @param {'en' | 'ms' | 'zh'} lang
 */
export function buildSystemPrompt(lang) {
  return [
    { type: 'text', text: NURA_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: languageDirective(lang) },
  ];
}
