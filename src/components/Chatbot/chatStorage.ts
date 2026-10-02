// Keeps the conversation when the chat panel is closed or the page reloads.
// sessionStorage, not localStorage: the chat survives within this browser tab
// and is forgotten when the tab closes, which is kinder on shared computers
// for a chat that may contain names, budgets or phone numbers.
import { isLang } from './types';
import type { ChatMessage, Lang } from './types';

export const CHAT_STORAGE_KEY = 'nura:chat:v1';
export const MAX_STORED_MESSAGES = 60;
const MAX_STORED_CHARS = 4000;

export type ChatStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface StoredChat {
  messages: ChatMessage[];
  lang: Lang;
}

/** The browser's sessionStorage, or null where it's blocked (privacy modes, prerender). */
export function sessionChatStore(): ChatStore | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function toStored(message: ChatMessage): ChatMessage {
  const text = message.text.slice(0, MAX_STORED_CHARS);
  return message.local ? { role: message.role, text, local: true } : { role: message.role, text };
}

const isStorable = (value: unknown): value is ChatMessage => {
  const m = value as ChatMessage | null;
  return Boolean(m) && (m!.role === 'user' || m!.role === 'model') && typeof m!.text === 'string';
};

export function loadChat(store: ChatStore | null): StoredChat | null {
  if (!store) return null;
  try {
    const raw = store.getItem(CHAT_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.messages)) return null;
    const messages = data.messages.filter(isStorable).map(toStored).slice(-MAX_STORED_MESSAGES);
    if (!messages.length) return null;
    return { messages, lang: isLang(data.lang) ? data.lang : 'en' };
  } catch {
    return null;
  }
}

export function saveChat(store: ChatStore | null, chat: StoredChat): void {
  if (!store) return;
  const messages = chat.messages
    .filter((m) => !m.intro && !m.streaming)
    .map(toStored)
    .slice(-MAX_STORED_MESSAGES);
  try {
    if (messages.length) store.setItem(CHAT_STORAGE_KEY, JSON.stringify({ messages, lang: chat.lang }));
    else store.removeItem(CHAT_STORAGE_KEY);
  } catch {
    // Storage full or blocked: the chat still works, it just won't survive a reload.
  }
}

export function clearChat(store: ChatStore | null): void {
  try {
    store?.removeItem(CHAT_STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is blocked.
  }
}
