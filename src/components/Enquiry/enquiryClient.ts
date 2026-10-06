// The browser side of the enquiry form, shared by the Contact Us window and the
// "Talk to our team" form in the chat: the form's state, the brief file
// checks, and the call to /api/enquiry. The rules themselves (types, budget
// ranges, limits) come from the server module so the two cannot drift.
import { useState } from 'react';
import {
  ENQUIRY_TYPES,
  CAMPAIGN_TYPES,
  BUDGET_RANGES,
  FIELD_LIMITS,
} from '../../../server/leads/enquiry.js';
import { ATTACHMENT_EXTENSIONS, MAX_ATTACHMENT_BYTES } from '../../../server/leads/attachment.js';
import type { buildTranscript } from '../Chatbot/transcript';

type TranscriptTurn = ReturnType<typeof buildTranscript>[number];
export type EnquirySource = 'chat' | 'contact-form';

export { ENQUIRY_TYPES, CAMPAIGN_TYPES, BUDGET_RANGES, FIELD_LIMITS, ATTACHMENT_EXTENSIONS };

export interface EnquiryValues {
  type: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  audience: string;
  period: string;
  budget: string;
  message: string;
  website: string; // honeypot
}

export const EMPTY_ENQUIRY: EnquiryValues = {
  type: '',
  name: '',
  email: '',
  phone: '',
  company: '',
  audience: '',
  period: '',
  budget: '',
  message: '',
  website: '',
};

export const ENQUIRY_ENDPOINT = '/api/enquiry';

export const isCampaignType = (type: string) => (CAMPAIGN_TYPES as string[]).includes(type);

/** Why this brief can't be attached, or null if it can. */
export function validateBrief(file: Pick<File, 'name' | 'size'>): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!(ATTACHMENT_EXTENSIONS as string[]).includes(ext)) return 'Attach a PDF, Word, PowerPoint, Excel, PNG or JPG file.';
  if (file.size === 0) return 'That file is empty.';
  if (file.size > MAX_ATTACHMENT_BYTES) return 'That file is too large. The limit is 4 MB.';
  return null;
}

/** Fills only the fields still empty, so a draft never overwrites what the visitor typed. */
export function fillEmpty(current: EnquiryValues, draft: Partial<EnquiryValues>): EnquiryValues {
  const next = { ...current };
  for (const key of Object.keys(draft) as (keyof EnquiryValues)[]) {
    const value = draft[key];
    if (typeof value === 'string' && value && !current[key].trim()) next[key] = value;
  }
  return next;
}

export function useEnquiryForm() {
  const [values, setValues] = useState<EnquiryValues>(EMPTY_ENQUIRY);
  const [file, setFile] = useState<File | null>(null);
  return {
    values,
    file,
    setFile,
    set: <K extends keyof EnquiryValues>(key: K, value: EnquiryValues[K]) => setValues((v) => ({ ...v, [key]: value })),
    applyDraft: (draft: Partial<EnquiryValues>) => setValues((v) => fillEmpty(v, draft)),
    /** After "new chat": same visitor, so keep who they are but drop the campaign and message. */
    clearCampaign: () => {
      setValues((v) => ({ ...v, type: '', audience: '', period: '', budget: '', message: '' }));
      setFile(null);
    },
    reset: () => {
      setValues(EMPTY_ENQUIRY);
      setFile(null);
    },
  };
}

export type EnquiryFormState = ReturnType<typeof useEnquiryForm>;

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export interface SubmitResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function submitEnquiry(args: {
  values: EnquiryValues;
  file: File | null;
  transcript: TranscriptTurn[];
  source: EnquirySource;
}): Promise<SubmitResult> {
  const { values, file, transcript, source } = args;
  try {
    const attachment = file ? { filename: file.name, data: await readAsBase64(file) } : undefined;
    const res = await fetch(ENQUIRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...values,
        source,
        ...(attachment ? { attachment } : {}),
        ...(transcript.length ? { transcript } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true };
    if (res.status === 413) return { ok: false, error: 'That file is too large. The limit is 4 MB.' };
    return {
      ok: false,
      error: data.error || 'Could not submit your enquiry.',
      fieldErrors: data.errors,
    };
  } catch {
    return { ok: false, error: 'We could not reach the server. Please check your connection and try again.' };
  }
}
