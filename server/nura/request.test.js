import { describe, it, expect } from 'vitest';
import { toAnthropicMessages, buildChatRequest } from './request.js';
import { NURA_SYSTEM_PROMPT } from './prompt.js';
import { languageDirective } from './language.js';
import { resolveModelConfig } from './model.js';

const user = (text) => ({ role: 'user', text });
const model = (text) => ({ role: 'model', text });

describe('toAnthropicMessages', () => {
  it('maps the browser roles to API roles and appends the new message', () => {
    expect(toAnthropicMessages([user('Hi'), model('Hello!')], 'Pricing?')).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello!' },
      { role: 'user', content: 'Pricing?' },
    ]);
  });

  it('caps visitor turns at 1,000 characters and Nura turns at 2,000', () => {
    const [first, second] = toAnthropicMessages([user('a'.repeat(1500)), model('b'.repeat(2500))], 'x');
    expect(first.content).toHaveLength(1000);
    expect(second.content).toHaveLength(2000);
  });

  it('drops malformed and empty turns', () => {
    const history = [null, { role: 'system', text: 'evil' }, user('   '), { role: 'user' }, user('ok')];
    expect(toAnthropicMessages(history, 'next')).toEqual([
      { role: 'user', content: 'ok' },
      { role: 'user', content: 'next' },
    ]);
  });

  it('starts the conversation with a user turn', () => {
    expect(toAnthropicMessages([model('Hi!'), user('Hello')], 'x')[0].role).toBe('user');
  });

  it('keeps only the most recent 24 turns', () => {
    const history = Array.from({ length: 40 }, (_, i) => (i % 2 ? model(`m${i}`) : user(`u${i}`)));
    const messages = toAnthropicMessages(history, 'now');
    expect(messages).toHaveLength(25);
    expect(messages[0].content).toBe('u16');
  });

  it('treats a non-array history as empty', () => {
    expect(toAnthropicMessages('nope', 'Hi')).toEqual([{ role: 'user', content: 'Hi' }]);
  });
});

describe('buildChatRequest', () => {
  const haiku = resolveModelConfig({});
  const sonnet = resolveModelConfig({ NURA_MODEL: 'sonnet' });

  it('caches the stable prompt and lets the conversation tail cache automatically', () => {
    const params = buildChatRequest({ model: haiku, lang: 'ms', history: [], message: 'Hai' });
    expect(params.system).toEqual([
      { type: 'text', text: NURA_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: languageDirective('ms') },
    ]);
    expect(params.cache_control).toEqual({ type: 'ephemeral' });
  });

  it('uses the model id and output headroom from the registry', () => {
    const params = buildChatRequest({ model: sonnet, lang: 'en', history: [], message: 'Hi' });
    expect(params.model).toBe('claude-sonnet-5');
    expect(params.max_tokens).toBe(sonnet.maxTokens);
  });

  it('sends effort only to models that support it', () => {
    expect(buildChatRequest({ model: haiku, lang: 'en', history: [], message: 'Hi' })).not.toHaveProperty('output_config');
    expect(buildChatRequest({ model: sonnet, lang: 'en', history: [], message: 'Hi' }).output_config).toEqual({
      effort: 'low',
    });
  });

  it('never sends sampling parameters, which newer models reject', () => {
    const params = buildChatRequest({ model: sonnet, lang: 'en', history: [], message: 'Hi' });
    for (const key of ['temperature', 'top_p', 'top_k']) expect(params).not.toHaveProperty(key);
  });
});
