import { describe, it, expect } from 'vitest';
import { BRIEF_SCHEMA, buildBriefRequest, parseBrief } from './brief.js';
import { resolveModelConfig } from './model.js';

const user = (text) => ({ role: 'user', text });
const model = (text) => ({ role: 'model', text });
const haiku = resolveModelConfig({});
const sonnet = resolveModelConfig({ NURA_MODEL: 'sonnet' });
const reply = (text, stop_reason = 'end_turn') => ({ stop_reason, content: [{ type: 'text', text }] });

describe('BRIEF_SCHEMA', () => {
  it('is a closed object with both fields required (structured-output compatible)', () => {
    expect(BRIEF_SCHEMA.additionalProperties).toBe(false);
    expect(BRIEF_SCHEMA.required).toEqual(['topic', 'description']);
  });
});

describe('buildBriefRequest', () => {
  const history = [user("We're Drypers, launching in March."), model('Nice! What is the goal?'), user('Awareness with new mums')];

  it('asks for JSON matching the schema via structured outputs', () => {
    const params = buildBriefRequest({ model: haiku, lang: 'en', history });
    expect(params.output_config.format).toEqual({ type: 'json_schema', schema: BRIEF_SCHEMA });
    expect(params.model).toBe(haiku.id);
  });

  it('passes the chat as a labelled transcript', () => {
    const { content } = buildBriefRequest({ model: haiku, lang: 'en', history }).messages[0];
    expect(content).toContain("Visitor: We're Drypers, launching in March.");
    expect(content).toContain('Nura: Nice! What is the goal?');
  });

  it('tells the model to use only what the visitor said and never contact details', () => {
    const system = buildBriefRequest({ model: haiku, lang: 'en', history }).system;
    expect(system).toMatch(/only what the visitor/i);
    expect(system).toMatch(/contact details/i);
  });

  it('writes the brief in the visitor language', () => {
    expect(buildBriefRequest({ model: haiku, lang: 'zh', history }).system).toMatch(/Simplified Chinese/);
    expect(buildBriefRequest({ model: haiku, lang: 'ms', history }).system).toMatch(/Bahasa Malaysia/);
  });

  it('adds effort only for models that support it', () => {
    expect(buildBriefRequest({ model: haiku, lang: 'en', history }).output_config).not.toHaveProperty('effort');
    expect(buildBriefRequest({ model: sonnet, lang: 'en', history }).output_config.effort).toBe('low');
  });
});

describe('parseBrief', () => {
  it('returns trimmed fields from valid JSON', () => {
    expect(parseBrief(reply('{"topic":"  KOL launch  ","description":" We are Drypers. "}'))).toEqual({
      topic: 'KOL launch',
      description: 'We are Drypers.',
    });
  });

  it('keeps the topic on one line and within 160 characters', () => {
    const brief = parseBrief(reply(JSON.stringify({ topic: `Line one\nBcc: x@y.z ${'a'.repeat(300)}`, description: 'd' })));
    expect(brief.topic).not.toMatch(/[\r\n]/);
    expect(brief.topic.length).toBeLessThanOrEqual(160);
  });

  it('caps the description', () => {
    expect(parseBrief(reply(JSON.stringify({ topic: 't', description: 'x'.repeat(5000) }))).description).toHaveLength(1500);
  });

  it('returns null for unusable output', () => {
    expect(parseBrief(reply('not json'))).toBeNull();
    expect(parseBrief(reply('{"topic":1,"description":"x"}'))).toBeNull();
    expect(parseBrief(reply('{"topic":"","description":"  "}'))).toBeNull();
    expect(parseBrief(reply('{"topic":"t","description":"d"}', 'refusal'))).toBeNull();
    expect(parseBrief(reply('{"topic":"t","descr', 'max_tokens'))).toBeNull();
  });
});
