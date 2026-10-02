// Server-side fallback copy in the visitor's language, plus a guard for
// replies that hit max_tokens. Mandarin uses more tokens per sentence than
// English, so a cut-off reply is likelier there; showing half a sentence
// reads as broken, so we trim back to the last complete one.

const COPY = {
  rateLimited: {
    en: "You're sending messages a little fast. Give me a few seconds and try again.",
    ms: 'Mesej dihantar terlalu cepat. Tunggu beberapa saat dan cuba lagi ya.',
    zh: '消息发得有点快，请稍等几秒再试。',
  },
  unavailable: {
    en: "Sorry, I can't reply right now. Please try again in a moment, or tap Talk to our team and the team will get back to you.",
    ms: 'Maaf, saya tak dapat membalas sekarang. Cuba lagi sebentar lagi, atau tekan Talk to our team dan team kami akan menghubungi anda.',
    zh: '抱歉，我暂时无法回复。请稍后再试，或点击下方的 Talk to our team，我们的团队会联系你。',
  },
  empty: {
    en: 'Sorry, I lost my train of thought there. Could you say that another way?',
    ms: 'Maaf, saya terlepas maksud tadi. Boleh cuba tanya dengan cara lain?',
    zh: '抱歉，我刚才没能好好回答。可以换个方式再问一次吗？',
  },
  // Keep the number in step with MAX_MESSAGE_LENGTH in server.js.
  tooLong: {
    en: "That's a bit long for me. Could you keep it under 1,000 characters?",
    ms: 'Mesej itu agak panjang. Boleh ringkaskan kepada bawah 1,000 aksara?',
    zh: '这条消息有点长，可以精简到 1,000 字以内吗？',
  },
  required: {
    en: "Type a message and I'll do my best to help.",
    ms: 'Taipkan mesej anda dan saya akan cuba bantu.',
    zh: '请输入你的问题，我会尽力帮忙。',
  },
};

/**
 * @param {keyof typeof COPY} key
 * @param {string} lang
 */
export function replyCopy(key, lang) {
  const entry = COPY[key];
  return entry[lang] ?? entry.en;
}

// Latin terminators only count when followed by whitespace, a closing quote or
// the end, so "RM1.5K" and "nurengroup.com" don't count as sentence ends.
const SENTENCE_END_RE = /[.!?…](?=\s|$|["'”’)])|[。！？]/g;

/**
 * The visitor-facing reply from a finished model message: text blocks only
 * (thinking blocks are skipped), trimmed back to a full sentence if
 * max_tokens cut it off, or localised fallback copy if there's no text.
 */
export function finalizeReply(message, lang) {
  const text = (message.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
  if (!text) return { reply: replyCopy('empty', lang), truncated: false };
  if (message.stop_reason === 'max_tokens') return { reply: trimToLastSentence(text), truncated: true };
  return { reply: text, truncated: false };
}

/** Cut a truncated reply back to its last complete sentence or line. */
export function trimToLastSentence(text) {
  let cut = -1;
  for (const match of text.matchAll(SENTENCE_END_RE)) {
    cut = match.index + match[0].length;
  }
  const lastNewline = text.lastIndexOf('\n');
  if (lastNewline > cut) cut = lastNewline;
  if (cut <= 0) return text.trim();
  return text.slice(0, cut).trim();
}
