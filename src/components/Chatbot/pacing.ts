// Paces Nura's replies like a person typing in a chat app: a short "typing"
// pause that grows with the message, and longer answers sent as a couple of
// short messages rather than one block. Replies that land the instant the
// visitor hits send are what made Nura feel scripted (Petrina's feedback,
// Oct 2026).

const MAX_BUBBLES = 3;
const LIST_ITEM_RE = /^\s*(?:[-*•]|\d+[.)])\s/;

// Roughly a quick typist: a beat to start, then a little per character,
// never instant and never more than a few seconds per message.
const TYPING_BASE_MS = 600;
const TYPING_PER_CHAR_MS = 14;
const TYPING_MIN_MS = 900;
const TYPING_MAX_MS = 2800;

/** Split a reply into up to three chat messages at paragraph breaks. */
export function splitIntoBubbles(text: string): string[] {
  const blocks = text
    .replace(/\r\n?/g, '\n')
    .split(/\n[ \t]*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const bubbles: string[] = [];
  for (const block of blocks) {
    // A list belongs with the sentence that introduces it.
    if (bubbles.length && LIST_ITEM_RE.test(block)) bubbles[bubbles.length - 1] += `\n${block}`;
    else bubbles.push(block);
  }
  if (bubbles.length > MAX_BUBBLES) {
    const tail = bubbles.splice(MAX_BUBBLES - 1).join('\n\n');
    bubbles.push(tail);
  }
  return bubbles.length ? bubbles : [text.trim()];
}

/** How long Nura "types" before a message appears. */
export function typingDelayMs(text: string): number {
  const ms = TYPING_BASE_MS + text.length * TYPING_PER_CHAR_MS;
  return Math.round(Math.min(TYPING_MAX_MS, Math.max(TYPING_MIN_MS, ms)));
}
