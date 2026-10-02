import { describe, it, expect } from 'vitest';
import { loadChat, saveChat, clearChat, CHAT_STORAGE_KEY, MAX_STORED_MESSAGES } from './chatStorage';
import type { ChatStore } from './chatStorage';

class MemoryStorage implements ChatStore {
  values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}

const throwing: ChatStore = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('quota');
  },
  removeItem: () => {
    throw new Error('blocked');
  },
};

describe('chat storage', () => {
  it('round-trips the conversation and its language', () => {
    const storage = new MemoryStorage();
    const messages = [
      { role: 'user' as const, text: 'Hi' },
      { role: 'model' as const, text: 'Hello!' },
      { role: 'model' as const, text: 'Connection lost', local: true },
    ];
    saveChat(storage, { messages, lang: 'ms' });
    expect(loadChat(storage)).toEqual({ messages, lang: 'ms' });
  });

  it("keeps a reply's next-step options so they come back after a reload", () => {
    const storage = new MemoryStorage();
    const messages = [
      { role: 'user' as const, text: 'We sell diapers' },
      { role: 'model' as const, text: 'Sampling works well.', options: ['How does sampling work?', 'Show me a plan'] },
    ];
    saveChat(storage, { messages, lang: 'en' });
    expect(loadChat(storage)?.messages).toEqual(messages);
  });

  it('drops tampered options', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify({ messages: [{ role: 'model', text: 'Hi', options: ['Ok', 5, '', 'x'.repeat(100), 'A', 'B', 'C'] }], lang: 'en' }),
    );
    expect(loadChat(storage)?.messages).toEqual([{ role: 'model', text: 'Hi', options: ['Ok', 'A', 'B'] }]);
  });

  it('keeps only the most recent messages', () => {
    const storage = new MemoryStorage();
    const messages = Array.from({ length: MAX_STORED_MESSAGES + 10 }, (_, i) => ({ role: 'user' as const, text: `m${i}` }));
    saveChat(storage, { messages, lang: 'en' });
    const loaded = loadChat(storage)!.messages;
    expect(loaded).toHaveLength(MAX_STORED_MESSAGES);
    expect(loaded.at(-1)?.text).toBe(`m${MAX_STORED_MESSAGES + 9}`);
  });

  it('returns null when there is nothing stored or no storage', () => {
    expect(loadChat(new MemoryStorage())).toBeNull();
    expect(loadChat(null)).toBeNull();
  });

  it('ignores corrupt or tampered data', () => {
    const storage = new MemoryStorage();
    storage.setItem(CHAT_STORAGE_KEY, '{oops');
    expect(loadChat(storage)).toBeNull();

    storage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ messages: 'nope', lang: 'en' }));
    expect(loadChat(storage)).toBeNull();

    storage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify({ messages: [{ role: 'system', text: 'x' }, { role: 'user', text: 42 }, { role: 'user', text: 'ok' }], lang: 'fr' }),
    );
    expect(loadChat(storage)).toEqual({ messages: [{ role: 'user', text: 'ok' }], lang: 'en' });
  });

  it('treats an empty conversation as nothing stored', () => {
    const storage = new MemoryStorage();
    saveChat(storage, { messages: [], lang: 'en' });
    expect(loadChat(storage)).toBeNull();
  });

  it('clears the stored conversation', () => {
    const storage = new MemoryStorage();
    saveChat(storage, { messages: [{ role: 'user', text: 'Hi' }], lang: 'en' });
    clearChat(storage);
    expect(loadChat(storage)).toBeNull();
  });

  it('never throws when storage is blocked or full', () => {
    expect(loadChat(throwing)).toBeNull();
    expect(() => saveChat(throwing, { messages: [{ role: 'user', text: 'Hi' }], lang: 'en' })).not.toThrow();
    expect(() => clearChat(throwing)).not.toThrow();
  });
});
