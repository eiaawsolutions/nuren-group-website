import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { NURA_SYSTEM_PROMPT, NURA_PROMPT_VERSION, buildSystemPrompt } from './prompt.js';
import { languageDirective } from './language.js';
import { OPTIONS_MARKER } from './replies.js';

const here = path.dirname(fileURLToPath(import.meta.url));

describe('NURA_SYSTEM_PROMPT', () => {
  it('is normalised to LF line endings regardless of checkout platform', () => {
    expect(NURA_SYSTEM_PROMPT).not.toContain('\r');
    expect(NURA_SYSTEM_PROMPT.startsWith('# Nura')).toBe(true);
  });

  it('avoids capitals-for-emphasis, which makes replies stiff and over-cautious', () => {
    expect(NURA_SYSTEM_PROMPT).not.toMatch(/\b(CRITICAL|MUST|NEVER|ALWAYS|IMPORTANT|NON-NEGOTIABLE|DO NOT)\b/);
  });

  it('keeps the media-kit facts that sales conversations rely on', () => {
    const facts = [
      '5M+', '12.8M', '1.43M+', '2.9M+', '10.3M+', '650K+', '369K+', '709K+',
      '10,000+', '5,000+', '84,392', '1,400+', '90% are 25–44', '63%', '78%',
      'Enlinea Sdn Bhd (960617-A)', '+603-76255605', 'admin@nurengroup.com', '03-79320050',
    ];
    for (const fact of facts) expect(NURA_SYSTEM_PROMPT, fact).toContain(fact);
  });

  it('only links to site paths that exist as routes', () => {
    const app = fs.readFileSync(path.resolve(here, '../../src/App.tsx'), 'utf8');
    const routes = new Set([...app.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]));
    const mentioned = [...NURA_SYSTEM_PROMPT.matchAll(/(?<=[\s(])\/[a-z][a-z0-9/-]*/g)].map((m) => m[0]);
    expect(mentioned.length).toBeGreaterThan(0);
    for (const sitePath of mentioned) expect(routes, sitePath).toContain(sitePath);
  });

  it('asks for next-step options in the exact form the server parses', () => {
    expect(NURA_SYSTEM_PROMPT).toContain(OPTIONS_MARKER);
  });

  it('models the tone it asks for: no em dashes or slash lists in the prompt itself', () => {
    expect(NURA_SYSTEM_PROMPT).not.toContain('—');
    expect(NURA_SYSTEM_PROMPT).not.toMatch(/\S \/ \S/);
  });

  it('keeps the guardrails for investors and AI honesty', () => {
    expect(NURA_SYSTEM_PROMPT).toMatch(/IPO and listing plans/);
    expect(NURA_SYSTEM_PROMPT).toMatch(/Don't claim or imply that you're a person/);
  });
});

describe('buildSystemPrompt', () => {
  it('sends the stable, cached prompt first and the per-turn language note last', () => {
    const blocks = buildSystemPrompt('ms');
    expect(blocks).toEqual([
      { type: 'text', text: NURA_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: languageDirective('ms') },
    ]);
  });

  it('exposes a short, stable version id for logs and evals', () => {
    expect(NURA_PROMPT_VERSION).toMatch(/^[0-9a-f]{8}$/);
  });
});
