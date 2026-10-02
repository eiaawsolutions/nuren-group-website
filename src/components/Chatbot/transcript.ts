// The conversation as sent to the server for the enquiry draft and email.
// Uses the server's own sanitiser so the size limits can't drift apart
// (and the request stays under the server's 64 KB body limit).
import { sanitizeTranscript } from '../../../server/nura/transcript.js';
import type { ChatMessage } from './types';

/** Visitor and Nura turns only: no greeting, error notices or half-streamed replies. */
export function buildTranscript(messages: ChatMessage[]) {
  return sanitizeTranscript(
    messages.filter((m) => !m.intro && !m.local && !m.streaming).map(({ role, text }) => ({ role, text })),
  );
}

export const hasVisitorTurns = (messages: ChatMessage[]) => messages.some((m) => m.role === 'user' && !m.local);
