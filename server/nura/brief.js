// Drafts the enquiry form's topic and description from the chat, so a visitor
// who has already told Nura their brand, goal and budget doesn't retype it.
// The visitor reviews and edits the draft before sending. It must contain only
// what the visitor actually said — never guessed details or contact info.
import { renderTranscript } from './transcript.js';

export const BRIEF_SCHEMA = {
  type: 'object',
  properties: {
    topic: {
      type: 'string',
      description: 'Short subject line for the enquiry, under 12 words.',
    },
    description: {
      type: 'string',
      description: "What the visitor wants, in their own voice, using only what they said in the chat.",
    },
  },
  required: ['topic', 'description'],
  additionalProperties: false,
};

const LANGUAGE_NAMES = { en: 'English', ms: 'Bahasa Malaysia', zh: 'Simplified Chinese' };
const MAX_TOPIC_CHARS = 160;
const MAX_DESCRIPTION_CHARS = 1500;

function briefSystemPrompt(lang) {
  const language = LANGUAGE_NAMES[lang] ?? LANGUAGE_NAMES.en;
  return [
    "You draft enquiry briefs for Nuren Group's sales team from a chat between a website visitor and Nura, Nuren's AI assistant. The visitor will read and edit your draft before sending it.",
    '',
    '- topic: a short subject line, for example "KOL campaign for a baby skincare launch".',
    '- description: two to five short lines in the visitor\'s voice ("We are…", "We\'d like…") covering what they said about their brand or product, goal, audience, timing, budget, and any questions for the team.',
    '',
    "Use only what the visitor said. Leave out anything they didn't mention rather than guessing: no invented budgets, dates, names or figures, and no contact details. Don't present Nura's suggestions as decisions the visitor made.",
    `Write both fields in ${language}, keeping brand names and marketing terms (KOL, campaign, brief) in English.`,
  ].join('\n');
}

export function buildBriefRequest({ model, lang, history }) {
  const { text } = renderTranscript(history);
  return {
    model: model.id,
    max_tokens: model.maxTokens,
    system: briefSystemPrompt(lang),
    messages: [{ role: 'user', content: `Chat transcript:\n<transcript>\n${text}\n</transcript>` }],
    output_config: {
      format: { type: 'json_schema', schema: BRIEF_SCHEMA },
      ...(model.effort ? { effort: model.effort } : {}),
    },
  };
}

/** @returns {{topic: string, description: string} | null} */
export function parseBrief(message) {
  if (message?.stop_reason !== 'end_turn') return null;
  const text = (message.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof data?.topic !== 'string' || typeof data?.description !== 'string') return null;
  // The topic becomes an email subject: keep it on one line (header injection).
  const topic = data.topic.replace(/[\r\n]+/g, ' ').trim().slice(0, MAX_TOPIC_CHARS);
  const description = data.description.trim().slice(0, MAX_DESCRIPTION_CHARS);
  if (!topic && !description) return null;
  return { topic, description };
}
