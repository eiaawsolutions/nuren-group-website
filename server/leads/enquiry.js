// The enquiry form's fields and rules, shared by the Contact Us window, the
// "Talk to our team" form in the chat, and the server (the browser imports the
// constants from here, so the two cannot drift). The server is the authority:
// everything arriving at /api/enquiry is untrusted and re-validated here.

export const ENQUIRY_TYPES = {
  advertising: 'Advertising or campaign',
  kol: 'Influencer or KOL marketing',
  marketplace: 'Motherhood marketplace',
  data: 'Data insights and analytics',
  events: 'Offline events and sampling',
  partnership: 'Partnership',
  creator: 'Creator opportunity',
  press: 'Press or media',
  other: 'Other',
};

// Types where the sales team needs campaign details to put a pitch together.
export const CAMPAIGN_TYPES = ['advertising', 'kol', 'marketplace', 'data', 'events', 'partnership'];

export const BUDGET_RANGES = [
  'Under RM10,000',
  'RM10,000 to RM30,000',
  'RM30,000 to RM100,000',
  'Above RM100,000',
  'Not sure yet',
];

export const ENQUIRY_SOURCES = ['chat', 'contact-form'];

export const FIELD_LIMITS = {
  name: 120,
  email: 200,
  phone: 40,
  company: 120,
  audience: 300,
  period: 120,
  message: 4000,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s().-]*$/;

const oneLine = (value, max) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);

/**
 * @param {unknown} raw  the request body
 * @returns {{ value: object, errors: Record<string, string> }}
 */
export function validateEnquiry(raw) {
  const body = raw && typeof raw === 'object' ? raw : {};

  const type = typeof body.type === 'string' && body.type in ENQUIRY_TYPES ? body.type : '';
  const isCampaign = CAMPAIGN_TYPES.includes(type);
  const budget = BUDGET_RANGES.includes(body.budget) ? body.budget : '';

  const value = {
    type,
    typeLabel: type ? ENQUIRY_TYPES[type] : '',
    name: oneLine(body.name, FIELD_LIMITS.name),
    email: oneLine(body.email, FIELD_LIMITS.email),
    phone: oneLine(body.phone, FIELD_LIMITS.phone),
    company: oneLine(body.company, FIELD_LIMITS.company),
    // Campaign details only mean something for the types that run campaigns.
    audience: isCampaign ? oneLine(body.audience, FIELD_LIMITS.audience) : '',
    period: isCampaign ? oneLine(body.period, FIELD_LIMITS.period) : '',
    budget: isCampaign ? budget : '',
    message: String(body.message ?? '').trim().slice(0, FIELD_LIMITS.message),
    source: ENQUIRY_SOURCES.includes(body.source) ? body.source : 'contact-form',
  };

  const errors = {};
  if (!type) errors.type = 'Please choose what your enquiry is about.';
  if (!value.name) errors.name = 'Please enter your name.';
  if (!value.email) errors.email = 'Please enter your email.';
  else if (!EMAIL_RE.test(value.email)) errors.email = 'Please enter a valid email.';
  if (!value.phone) errors.phone = 'Please enter your mobile number.';
  else if (!PHONE_RE.test(value.phone) || value.phone.replace(/\D/g, '').length < 7) {
    errors.phone = 'Please enter a valid mobile number.';
  }
  if (!value.message) errors.message = 'Please tell us how we can help.';

  return { value, errors };
}

/** The email subject / dashboard title for an enquiry. */
export function enquiryTitle({ typeLabel, company }) {
  return company ? `${typeLabel} (${company})` : typeLabel;
}
