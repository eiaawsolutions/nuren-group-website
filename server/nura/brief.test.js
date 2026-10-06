import { describe, it, expect } from 'vitest';
import { BRIEF_SCHEMA, buildBriefRequest, parseBrief } from './brief.js';
import { resolveModelConfig } from './model.js';

const user = (text) => ({ role: 'user', text });
const model = (text) => ({ role: 'model', text });
const haiku = resolveModelConfig({});
const sonnet = resolveModelConfig({ NURA_MODEL: 'sonnet' });
const reply = (text, stop_reason = 'end_turn') => ({ stop_reason, content: [{ type: 'text', text }] });

const FIELDS = ['message', 'type', 'company', 'audience', 'period', 'budget', 'name', 'email', 'phone'];
const draft = (over = {}) => ({
  message: 'We are launching a baby skincare line.',
  type: '',
  company: '',
  audience: '',
  period: '',
  budget: '',
  name: '',
  email: '',
  phone: '',
  ...over,
});
const replyWith = (over) => reply(JSON.stringify(draft(over)));

describe('BRIEF_SCHEMA', () => {
  it('is a closed object with every field required (structured-output compatible)', () => {
    expect(BRIEF_SCHEMA.additionalProperties).toBe(false);
    expect(BRIEF_SCHEMA.required).toEqual(FIELDS);
    expect(Object.keys(BRIEF_SCHEMA.properties)).toEqual(FIELDS);
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

  it('tells the model to use only what the visitor said and never invent contact details', () => {
    const system = buildBriefRequest({ model: haiku, lang: 'en', history }).system;
    expect(system).toMatch(/only what the visitor said/i);
    expect(system).toMatch(/never guess or invent/i);
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
  const chat = [
    user("Hi, I'm Mei Lin from Drypers. My email is mei@drypers.com and my number is 012-345 6789."),
    user('We want to reach first-time mums in March.'),
  ];

  it('keeps what the visitor actually said', () => {
    const brief = parseBrief(
      replyWith({
        type: 'advertising',
        company: 'Drypers',
        audience: 'first-time mums',
        period: 'March',
        budget: 'RM10,000 to RM30,000',
        name: 'Mei Lin',
        email: 'mei@drypers.com',
        phone: '012-345 6789',
      }),
      chat,
    );
    expect(brief).toMatchObject({
      type: 'advertising',
      company: 'Drypers',
      budget: 'RM10,000 to RM30,000',
      name: 'Mei Lin',
      email: 'mei@drypers.com',
      phone: '012-345 6789',
    });
  });

  it('drops a name, brand, email or number the visitor never typed', () => {
    const brief = parseBrief(
      replyWith({ company: 'Pampers', name: 'Siti Aminah', email: 'siti@pampers.com', phone: '019 876 5432' }),
      chat,
    );
    expect(brief).toMatchObject({ company: '', name: '', email: '', phone: '' });
  });

  it('never takes contact details from Nura or when there is no chat to check against', () => {
    const fromNura = [model('You can email sales@nurengroup.com'), user('ok')];
    expect(parseBrief(replyWith({ email: 'sales@nurengroup.com' }), fromNura).email).toBe('');
    expect(parseBrief(replyWith({ email: 'mei@drypers.com' })).email).toBe('');
  });

  it('ignores an enquiry type or budget outside the offered lists', () => {
    const brief = parseBrief(replyWith({ type: 'hack', budget: 'RM1 billion' }), chat);
    expect(brief).toMatchObject({ type: '', budget: '' });
  });

  it('keeps single-line fields on one line and caps the message', () => {
    const brief = parseBrief(replyWith({ audience: 'mums\nBcc: x@y.z', message: 'x'.repeat(5000) }), chat);
    expect(brief.audience).not.toMatch(/[\r\n]/);
    expect(brief.message).toHaveLength(1500);
  });

  it('returns null for unusable output', () => {
    expect(parseBrief(reply('not json'), chat)).toBeNull();
    expect(parseBrief(reply('{"message":1}'), chat)).toBeNull();
    expect(parseBrief(replyWith({ message: '  ' }), chat)).toBeNull();
    expect(parseBrief(replyWith({}), chat) && parseBrief(reply('{"message":"d"}', 'refusal'), chat)).toBeNull();
    expect(parseBrief(reply('{"message":"d', 'max_tokens'), chat)).toBeNull();
  });
});
