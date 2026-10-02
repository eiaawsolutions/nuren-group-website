// Decides which language Nura should reply in, and phrases that as a short
// directive appended to the system prompt.
//
// Malaysian visitors code-switch constantly, so "contains a BM word" is not a
// signal: "Ok lah, how much ah?" is English, and "ADA" is an English acronym.
// We score whole messages instead, honour explicit requests ("English please"),
// and only fall back to earlier turns when the latest message is too short to
// tell (e.g. "ok", "thanks", "👍").

const HAN_RE = /[一-鿿㐀-䶿]/g;
const LATIN_WORD_RE = /[a-z]+(?:'[a-z]+)?/g;

// Words that, in a Malaysian chat, mark the sentence as BM. Manglish particles
// (lah, ah, ke, kan, meh, lor) are deliberately absent — they appear in English.
const BM_WORDS = new Set([
  'saya', 'kami', 'kita', 'awak', 'anda', 'nak', 'mahu', 'hendak', 'boleh',
  'tak', 'tidak', 'bukan', 'dah', 'sudah', 'belum', 'ada', 'tiada', 'apa',
  'siapa', 'bagaimana', 'macam', 'mana', 'kenapa', 'mengapa', 'bila',
  'berapa', 'harga', 'untuk', 'dengan', 'dan', 'atau', 'yang', 'ini', 'itu',
  'ni', 'tu', 'dari', 'daripada', 'pada', 'kepada', 'dalam', 'juga', 'lagi',
  'sangat', 'sikit', 'banyak', 'semua', 'tolong', 'minta', 'sila', 'terima',
  'kasih', 'perlu', 'jangan', 'cuba', 'baik', 'pasal', 'tentang', 'tanya',
  'tahu', 'buat', 'iklan', 'pakej', 'jenama', 'produk', 'syarikat', 'bajet',
  'selesa', 'guna', 'cakap', 'sebenarnya', 'lebih', 'betul', 'orang', 'kalau',
  'macamana', 'camne', 'sebab', 'kerana', 'mula', 'bulan', 'tahun', 'ialah',
  'adalah', 'akan', 'sedang', 'masih', 'hanya', 'sahaja', 'je', 'jer',
]);

// Common English function words. Loanwords shared by both languages in
// Malaysian marketing chat (brand, campaign, KOL) count for neither side.
const EN_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'been', 'do', 'does', 'did', 'you', 'your', 'we', 'our', 'us', 'i', 'me',
  'my', 'it', 'its', 'this', 'that', 'these', 'those', 'to', 'of', 'in', 'on',
  'for', 'with', 'from', 'at', 'by', 'about', 'how', 'what', 'which', 'who',
  'when', 'where', 'why', 'can', 'could', 'would', 'should', 'will', 'have',
  'has', 'had', 'please', 'thanks', 'thank', 'much', 'many', 'any', 'some',
  'there', 'here', 'if', 'so', 'not', 'just', 'also', 'more', 'like', 'want',
  'need', 'get', 'know', 'tell', 'send', 'they', 'them', 'their', 'than',
  'then', 'into', 'out', 'up', 'all', 'one', 'am', "i'm", "we're", "don't",
  "what's", "it's",
]);

// Explicit "please use X" requests. Each needs a conversational verb or a
// "please" so that "do you have content in Chinese?" is not read as a request.
const EN_NAMES = '(?:english|inggeris)';
const MS_NAMES = '(?:bm|bahasa(?:\\s+(?:melayu|malaysia))?|malay|melayu)';
const ZH_NAMES = '(?:chinese|mandarin|cina)';
const VERBS = '(?:reply|respond|answer|talk|speak|chat|write|continue|switch|change|use|go)';
const BM_VERBS = '(?:cakap|guna|pakai|tulis|balas|jawab|tukar)';

function explicitRequestRe(names, extra) {
  return new RegExp(
    [
      `\\b${VERBS}(?:\\s+(?:to|in|with|me|us|back))*\\s+${names}\\b`,
      `\\b${names}\\s+(?:please|pls|plz)\\b`,
      `^\\s*${names}\\s*[?!.]*\\s*$`,
      `\\b${BM_VERBS}(?:\\s+(?:dalam|ke))?\\s+(?:bahasa\\s+)?${names}\\b`,
      extra,
    ].join('|'),
    'i',
  );
}

const EXPLICIT_REQUESTS = [
  ['en', explicitRequestRe(EN_NAMES, '(?:用|说|說|讲|講|改用|换成|換成)\\s*(?:英文|英语|英語)')],
  ['ms', explicitRequestRe(MS_NAMES, '(?:用|说|說|讲|講|改用|换成|換成)\\s*(?:马来文|马来语|馬來文|馬來語|巫文)')],
  ['zh', explicitRequestRe(ZH_NAMES, '(?:用|说|說|讲|講|改用|换成|換成)\\s*(?:中文|华语|華語|华文|華文)')],
];

// The opening of a message is plenty to tell its language, and capping it
// keeps detection cheap on oversized client-supplied input.
const MAX_SAMPLE_CHARS = 2000;

/** Language a single message is clearly written in, or null if too short to tell. */
function classify(input) {
  if (typeof input !== 'string' || !input.trim()) return null;
  const text = input.slice(0, MAX_SAMPLE_CHARS);

  for (const [lang, re] of EXPLICIT_REQUESTS) {
    if (re.test(text)) return lang;
  }

  const words = text.toLowerCase().match(LATIN_WORD_RE) ?? [];
  const hanCount = (text.match(HAN_RE) ?? []).length;
  // One Han character carries roughly as much meaning as two English words,
  // so a Chinese brand name inside an English sentence doesn't flip it.
  if (hanCount > 0 && hanCount * 2 >= words.length) return 'zh';

  let bm = 0;
  let en = 0;
  for (const word of words) {
    if (BM_WORDS.has(word)) bm += 1;
    if (EN_WORDS.has(word)) en += 1;
  }
  // Mixed BM-English ("Boleh I tahu harga?") is BM: any real BM sentence wins ties.
  if (bm >= 2 && bm >= en) return 'ms';
  if (en >= 2 && en > bm) return 'en';
  if (en >= 1 && bm === 0 && words.length >= 4) return 'en';
  return null;
}

/**
 * @param {string} message - the visitor's latest message
 * @param {Array<{role: string, text: string}>} history - earlier turns, oldest first
 * @returns {'en' | 'ms' | 'zh'}
 */
export function detectReplyLanguage(message, history) {
  const current = classify(message);
  if (current) return current;

  // Short or ambiguous message: carry on in the conversation's language,
  // judged from the visitor's own turns (Nura's replies just mirror them).
  const userTurns = (Array.isArray(history) ? history : []).filter(
    (turn) => turn?.role === 'user' && typeof turn.text === 'string',
  );
  for (let i = userTurns.length - 1; i >= 0; i -= 1) {
    const lang = classify(userTurns[i].text);
    if (lang) return lang;
  }
  return 'en';
}

const DIRECTIVES = {
  en: 'Language for this reply: the conversation is in English, so reply in English.',
  ms:
    'Language for this reply: the visitor is writing in Bahasa Malaysia, so reply in BM. ' +
    'Keep brand names and marketing terms such as KOL, campaign, brief and proposal in English, ' +
    'the way Malaysian marketers write.',
  zh:
    'Language for this reply: the visitor is writing in Mandarin, so reply in Simplified Chinese. ' +
    'Keep brand names and marketing terms such as KOL, campaign, brief and proposal in English, ' +
    'the way Malaysian Chinese marketers write.',
};

/** @param {'en' | 'ms' | 'zh'} lang */
export function languageDirective(lang) {
  return DIRECTIVES[lang] ?? DIRECTIVES.en;
}
