// Nura conversation eval. Talks to a running server over HTTP, so the same
// suite can score any version of the site (before/after a prompt change).
//
//   1. Start the server with a real key:  ANTHROPIC_API_KEY=... node server.js
//   2. Run:  npm run eval:nura -- --label after
//      Options: --base-url http://localhost:3000   --repeat 3 (pass^k)
//               --only id1,id2   --delay-ms 3200
//
// For a baseline, check out the previous version, start its server, and run
// again with --label before. To compare models, start a second server with
// NURA_MODEL=sonnet on another port (PORT=3001) and run with
// --base-url http://localhost:3001 --label sonnet. Transcripts and results
// are written to evals/nura/results/<label>-<timestamp>.md. Exits 1 if any
// case fails.
//
// Cost: about 30 model calls per pass (~$0.15 on Claude Haiku 4.5); --repeat
// multiplies that. The server allows 20 chat requests a minute per IP, so
// calls are spaced out by --delay-ms.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CASES } from './cases.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = { baseUrl: 'http://localhost:3000', repeat: 1, only: null, delayMs: 3200, label: 'run' };
  for (let i = 0; i < argv.length; i += 1) {
    const [flag, value] = [argv[i], argv[i + 1]];
    if (flag === '--base-url') args.baseUrl = value;
    else if (flag === '--repeat') args.repeat = Math.max(1, Number(value));
    else if (flag === '--only') args.only = new Set(value.split(','));
    else if (flag === '--delay-ms') args.delayMs = Number(value);
    else if (flag === '--label') args.label = value.replace(/[^a-z0-9-]/gi, '-');
    else continue;
    i += 1;
  }
  return args;
}

// Deliberately independent of server/nura/language.js, so a detector bug
// can't hide itself by also mis-grading the reply.
const BM_WORDS = new Set(
  'yang dan untuk anda kami boleh dengan ini itu akan ada saya kita di ke dari pada juga atau lebih tidak tak nak kalau sebab apa bagaimana macam mana sahaja sangat perlu kepada dalam mereka seperti jika'.split(' '),
);
const EN_WORDS = new Set(
  'the and you your we our to is for with that this of in are can it a an be will would if or what how they'.split(' '),
);

export function replyLanguage(text) {
  const han = (text.match(/[一-鿿]/g) ?? []).length;
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  if (han >= 10 && han >= words.length) return 'zh';
  const bm = words.filter((w) => BM_WORDS.has(w)).length;
  const en = words.filter((w) => EN_WORDS.has(w)).length;
  return bm > en ? 'ms' : 'en';
}

// Replies longer than this stop feeling like chat messages.
const MAX_REPLY_CHARS = 650;

function globalProblems(reply) {
  const problems = [];
  if (!reply.trim()) problems.push('empty reply');
  if (/^\s*#{1,6}\s/m.test(reply)) problems.push('uses a markdown heading');
  if (/^\s*\|.*\|\s*$/m.test(reply)) problems.push('uses a table');
  if (reply.length > MAX_REPLY_CHARS) problems.push(`long reply (${reply.length} chars)`);
  // Petrina's feedback (Oct 2026): these read as scripted, AI-written chat.
  if (/—/.test(reply)) problems.push('uses an em dash');
  if (/\S \/ \S/.test(reply)) problems.push('uses " / " between words');
  if (/<<\s*options/i.test(reply)) problems.push('options marker leaked into the reply');
  const questions = (reply.match(/[?？]/g) ?? []).length;
  if (questions > 1) problems.push(`asks ${questions} questions`);
  const opener = reply.trim().split(/(?<=[.!?。！？])/)[0];
  if (/[!！]$/.test(opener)) problems.push(`opens with an exclamation ("${opener.slice(0, 40)}")`);
  return problems;
}

/**
 * @param {object} testCase
 * @param {string[]} replies - Nura's reply for each turn
 * @param {string[][]} [options] - tappable options returned with each reply
 */
export function grade(testCase, replies, options = []) {
  const failures = [];
  const final = replies.at(-1) ?? '';
  replies.forEach((reply, i) => globalProblems(reply).forEach((p) => failures.push(`turn ${i + 1}: ${p}`)));
  if (testCase.options) {
    const count = (options.at(-1) ?? []).length;
    if (count < 2 || count > 3) failures.push(`final reply offers ${count} options (want 2–3)`);
  }

  if (testCase.lang && replyLanguage(final) !== testCase.lang) {
    failures.push(`expected ${testCase.lang} reply, got ${replyLanguage(final)}`);
  }
  for (const re of testCase.includes ?? []) if (!re.test(final)) failures.push(`missing ${re}`);
  for (const re of testCase.excludes ?? []) if (re.test(final)) failures.push(`should not match ${re}`);
  for (const re of testCase.excludesAny ?? []) {
    replies.forEach((reply, i) => re.test(reply) && failures.push(`turn ${i + 1} should not match ${re}`));
  }
  if (testCase.maxChars && final.length > testCase.maxChars) {
    failures.push(`final reply ${final.length} chars > ${testCase.maxChars}`);
  }
  if (testCase.maxCtaReplies !== undefined) {
    const ctaCount = replies.filter((r) => /talk to our team/i.test(r)).length;
    if (ctaCount > testCase.maxCtaReplies) {
      failures.push(`mentions Talk to our team in ${ctaCount} replies (max ${testCase.maxCtaReplies})`);
    }
  }
  return failures;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runConversation(testCase, args) {
  const history = [];
  const replies = [];
  const options = [];
  const transcript = [];
  for (const turn of testCase.turns) {
    const res = await fetch(new URL('/api/chat', args.baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: turn, history }),
    });
    const data = await res.json().catch(() => ({}));
    const detected = res.headers.get('x-nura-lang') ?? '?';
    if (!res.ok) throw new Error(`HTTP ${res.status} on "${turn}": ${data.error ?? 'no body'}`);
    replies.push(data.reply);
    options.push(Array.isArray(data.options) ? data.options : []);
    const chips = options.at(-1).length ? `\n\n_Options:_ ${options.at(-1).map((o) => `[${o}]`).join(' ')}` : '';
    transcript.push(`**Visitor:** ${turn}\n\n**Nura** _(detected: ${detected})_: ${data.reply}${chips}`);
    history.push({ role: 'user', text: turn }, { role: 'model', text: data.reply });
    await sleep(args.delayMs);
  }
  return { replies, options, transcript };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cases = CASES.filter((c) => !args.only || args.only.has(c.id));
  const results = [];

  for (const testCase of cases) {
    const runs = [];
    for (let k = 0; k < args.repeat; k += 1) {
      try {
        const { replies, options, transcript } = await runConversation(testCase, args);
        runs.push({ failures: grade(testCase, replies, options), transcript });
      } catch (err) {
        runs.push({ failures: [String(err.message ?? err)], transcript: [] });
      }
    }
    const passed = runs.every((run) => run.failures.length === 0);
    results.push({ testCase, runs, passed });
    const passCount = runs.filter((r) => r.failures.length === 0).length;
    console.log(`${passed ? 'PASS' : 'FAIL'}  ${testCase.id}  (${passCount}/${runs.length})`);
    for (const run of runs) for (const failure of run.failures) console.log(`        - ${failure}`);
  }

  const passedCases = results.filter((r) => r.passed).length;
  const summary = `${passedCases}/${results.length} cases passed` + (args.repeat > 1 ? ` on all ${args.repeat} runs (pass^${args.repeat})` : '');
  console.log(`\n${summary}`);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(here, 'results');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${args.label}-${stamp}.md`);
  const body = results
    .map(({ testCase, runs, passed }) =>
      [
        `## ${passed ? 'PASS' : 'FAIL'}: ${testCase.id}`,
        ...runs.map((run, k) =>
          [
            args.repeat > 1 ? `### Run ${k + 1}` : '',
            run.failures.length ? run.failures.map((f) => `- ${f}`).join('\n') : '- all checks passed',
            '',
            run.transcript.join('\n\n'),
          ].join('\n'),
        ),
      ].join('\n\n'),
    )
    .join('\n\n---\n\n');
  fs.writeFileSync(outFile, `# Nura eval: ${args.label}\n\n${args.baseUrl} · ${new Date().toISOString()} · ${summary}\n\n${body}\n`);
  console.log(`Transcripts: ${path.relative(process.cwd(), outFile)}`);
  process.exitCode = passedCases === results.length ? 0 : 1;
}

// Only run when executed directly, so the grader can be unit-tested.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
