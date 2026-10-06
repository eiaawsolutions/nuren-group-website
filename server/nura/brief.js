// Fills in the enquiry form from the chat, so a visitor who has already told
// Nura their brand, goal, audience, timing and budget doesn't retype it. The
// visitor reviews and edits everything before sending. It must contain only
// what the visitor actually said, never guessed details: a name, email, phone
// number or brand is kept only if it appears word for word in what the visitor
// typed (the model could otherwise invent a plausible one).
import { renderTranscript } from './transcript.js';
import { ENQUIRY_TYPES, BUDGET_RANGES, FIELD_LIMITS } from '../leads/enquiry.js';

const str = (description) => ({ type: 'string', description });

export const BRIEF_SCHEMA = {
  type: 'object',
  properties: {
    message: str("What the visitor wants, in their own voice, using only what they said in the chat."),
    type: {
      type: 'string',
      enum: [...Object.keys(ENQUIRY_TYPES), ''],
      description: 'The enquiry type that fits best, or an empty string if unclear.',
    },
    company: str('The visitor\'s brand or company name exactly as they wrote it, or an empty string.'),
    audience: str('Who the campaign should reach, as the visitor described it, or an empty string.'),
    period: str('When the campaign should run, as the visitor described it, or an empty string.'),
    budget: {
      type: 'string',
      enum: [...BUDGET_RANGES, ''],
      description: 'The range containing the budget the visitor stated, or an empty string if they gave none.',
    },
    name: str("The visitor's own name exactly as they wrote it, or an empty string."),
    email: str("The visitor's email address exactly as they wrote it, or an empty string."),
    phone: str("The visitor's phone number exactly as they wrote it, or an empty string."),
  },
  required: ['message', 'type', 'company', 'audience', 'period', 'budget', 'name', 'email', 'phone'],
  additionalProperties: false,
};

const LANGUAGE_NAMES = { en: 'English', ms: 'Bahasa Malaysia', zh: 'Simplified Chinese' };
const MAX_MESSAGE_CHARS = 1500;

function briefSystemPrompt(lang) {
  const language = LANGUAGE_NAMES[lang] ?? LANGUAGE_NAMES.en;
  return [
    "You fill in an enquiry form for Nuren Group's sales team from a chat between a website visitor and Nura, Nuren's AI assistant. The visitor will read and edit your draft before sending it.",
    '',
    '- message: two to five short lines in the visitor\'s voice ("We are…", "We\'d like…") covering what they said about their product, goal, and any questions for the team. Leave contact details out of it.',
    '- company, audience, period, budget, name, email, phone: copy what the visitor said, and use an empty string for anything they did not say.',
    '- type: the enquiry type that fits best, or an empty string if unclear.',
    '',
    "Use only what the visitor said. Never guess or invent a budget, date, brand, name, email address or phone number, and don't present Nura's suggestions as decisions the visitor made.",
    `Write message, audience and period in ${language}, keeping brand names and marketing terms (KOL, campaign, brief) in English.`,
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

const oneLine = (value, max) => (typeof value === 'string' ? value.replace(/[\r\n]+/g, ' ').trim().slice(0, max) : '');
const digits = (value) => value.replace(/\D/g, '');

/**
 * @param {object} message  the model's reply
 * @param {Array<{role: string, text: string}>} [history]  the chat, to check
 *   that names and contact details really came from the visitor
 * @returns {{message: string, type: string, company: string, audience: string, period: string,
 *   budget: string, name: string, email: string, phone: string} | null}
 */
export function parseBrief(message, history = []) {
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
  if (typeof data?.message !== 'string') return null;

  const said = history.filter((turn) => turn.role === 'user').map((turn) => turn.text).join('\n');
  const saidLower = said.toLowerCase();
  const saidDigits = digits(said);
  const fromVisitor = (value) => (value && saidLower.includes(value.toLowerCase()) ? value : '');

  const phone = oneLine(data.phone, FIELD_LIMITS.phone);
  const brief = {
    message: data.message.trim().slice(0, MAX_MESSAGE_CHARS),
    type: typeof data.type === 'string' && data.type in ENQUIRY_TYPES ? data.type : '',
    company: fromVisitor(oneLine(data.company, FIELD_LIMITS.company)),
    audience: oneLine(data.audience, FIELD_LIMITS.audience),
    period: oneLine(data.period, FIELD_LIMITS.period),
    budget: BUDGET_RANGES.includes(data.budget) ? data.budget : '',
    name: fromVisitor(oneLine(data.name, FIELD_LIMITS.name)),
    email: fromVisitor(oneLine(data.email, FIELD_LIMITS.email)),
    phone: digits(phone).length >= 7 && saidDigits.includes(digits(phone)) ? phone : '',
  };

  const hasContent = Object.values(brief).some((value) => value);
  return hasContent ? brief : null;
}
