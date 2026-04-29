// One-shot test for the language-detection regexes used in server.js.
// Mirrors the regexes exactly so we can verify behaviour without spinning up
// the full server (which needs ANTHROPIC_API_KEY).
const HAN_RE = /[一-鿿㐀-䶿]/;
const BM_MARKERS = [
  'boleh', 'nak', 'tak', 'awak', 'macam', 'untuk', 'saya', 'kami', 'kita',
  'dengan', 'dah', 'belum', 'ini', 'itu', 'ada', 'tiada', 'apa', 'siapa',
  'bagaimana', 'kenapa', 'bila', 'tolong', 'terima kasih', 'minta',
  'perlu', 'jangan', 'cuba', 'sila', 'baik', 'sangat', 'lah', 'ke',
];
const BM_RE = new RegExp(`\\b(${BM_MARKERS.join('|')})\\b`, 'i');

function detect(msg) {
  if (HAN_RE.test(msg)) return 'zh';
  if (BM_RE.test(msg)) return 'ms';
  return 'en';
}

const fixtures = [
  ['Hi.. Alanis, 真的比较忙。', 'zh'],
  ['你好 KOL campaign RM50K', 'zh'],
  ['Hello how are you', 'en'],
  ['boleh tolong saya', 'ms'],
  ['I want to advertise', 'en'],
  ['请用中文回答', 'zh'],
  ['👋 emoji only message', 'en'],
  ['saya nak tanya pasal KOL', 'ms'],
  ['Hi.. Alanis, 真的比较忙。你有没有一个项目是可以让bidan wow的。', 'zh'],
];

let fails = 0;
for (const [msg, want] of fixtures) {
  const got = detect(msg);
  const ok = got === want;
  if (!ok) fails += 1;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${got}/${want}  ${msg}`);
}
process.exit(fails === 0 ? 0 : 1);
