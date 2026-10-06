import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Loader2, Paperclip, X } from 'lucide-react';
import {
  ENQUIRY_TYPES,
  BUDGET_RANGES,
  ATTACHMENT_EXTENSIONS,
  isCampaignType,
  submitEnquiry,
  validateBrief,
  type EnquiryFormState,
  type EnquiryValues,
  type EnquirySource,
} from './enquiryClient';
import { buildTranscript } from '../Chatbot/transcript';

type Turns = ReturnType<typeof buildTranscript>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const inputCls = (hasError: boolean) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 transition-colors ${
    hasError
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
      : 'border-slate-300 focus:border-nuren-pink focus:ring-nuren-pink/20'
  } disabled:bg-slate-100 disabled:cursor-not-allowed`;

export const Field = ({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) => (
  <label className="block">
    <span className="text-xs font-semibold text-slate-700 block mb-1">
      {label}
      {required && <span aria-hidden="true"> *</span>}
    </span>
    {children}
    {hint && !error && <span className="text-[11px] text-slate-500 block mt-1">{hint}</span>}
    {error && (
      <span role="alert" className="text-xs text-rose-600 block mt-1">
        {error}
      </span>
    )}
  </label>
);

interface Props {
  form: EnquiryFormState;
  source: EnquirySource;
  /** The chat to offer to include with the enquiry (chat form only). */
  transcript?: Turns;
  /** Shown above the fields, e.g. "filling in from our chat". */
  notice?: ReactNode;
  onSent: () => void;
}

/**
 * One enquiry form for every place a visitor can reach the team, laid out like
 * motherhood.com.my/contact-us: what the enquiry is about, who they are, how to
 * reach them, and what they need. For campaign enquiries it also asks what
 * the sales team needs to pitch (audience, period, budget) and takes the brief.
 */
export function EnquiryForm({ form, source, transcript = [], notice, onSent }: Props) {
  const { values, file } = form;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [includeChat, setIncludeChat] = useState(true);
  const showCampaign = isCampaignType(values.type);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!values.type) errs.type = 'Please choose what your enquiry is about.';
    if (!values.name.trim()) errs.name = 'Please enter your name.';
    if (!values.email.trim()) errs.email = 'Please enter your email.';
    else if (!EMAIL_RE.test(values.email.trim())) errs.email = 'Please enter a valid email.';
    if (!values.phone.trim()) errs.phone = 'Please enter your mobile number.';
    if (!values.message.trim()) errs.message = 'Please tell us how we can help.';
    if (file) {
      const problem = validateBrief(file);
      if (problem) errs.attachment = problem;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    const result = await submitEnquiry({
      values,
      file,
      transcript: includeChat ? transcript : [],
      source,
    });
    setSubmitting(false);

    if (result.ok) {
      setErrors({});
      form.reset();
      onSent();
      return;
    }
    if (result.fieldErrors) setErrors(result.fieldErrors);
    setSubmitError(result.error);
  };

  // Typing in a field clears its error, so a fixed field stops looking wrong.
  const edit = (key: keyof EnquiryValues, value: string) => {
    form.set(key, value);
    setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev));
  };

  const text = (key: 'name' | 'email' | 'phone' | 'company' | 'audience' | 'period') => ({
    value: values[key],
    onChange: (e: { target: { value: string } }) => edit(key, e.target.value),
    disabled: submitting,
    className: inputCls(!!errors[key]),
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
      {notice}

      <Field label="What is your enquiry about?" required error={errors.type}>
        <select
          value={values.type}
          onChange={(e) => edit('type', e.target.value)}
          disabled={submitting}
          className={inputCls(!!errors.type)}
        >
          <option value="">Select an enquiry type</option>
          {Object.entries(ENQUIRY_TYPES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Full name" required error={errors.name}>
        <input type="text" autoComplete="name" placeholder="Your name" {...text('name')} />
      </Field>

      <Field label="Email address" required error={errors.email}>
        <input type="email" autoComplete="email" placeholder="name@example.com" {...text('email')} />
      </Field>

      <Field label="Mobile number" required error={errors.phone}>
        <input type="tel" autoComplete="tel" placeholder="e.g. 012 345 6789" {...text('phone')} />
      </Field>

      <Field label="Brand or company" error={errors.company}>
        <input type="text" autoComplete="organization" placeholder="Who is this for?" {...text('company')} />
      </Field>

      {showCampaign && (
        <fieldset className="space-y-3.5 rounded-2xl border border-nuren-pink/30 bg-nuren-pink/5 p-3.5">
          <legend className="px-1.5 text-xs font-semibold text-nuren-purple">
            Campaign details (helps us prepare your pitch)
          </legend>
          <Field label="Target audience" error={errors.audience}>
            <input type="text" placeholder="e.g. first-time mums, 25 to 35, Klang Valley" {...text('audience')} />
          </Field>
          <Field label="Campaign period" error={errors.period}>
            <input type="text" placeholder="e.g. March to May 2027" {...text('period')} />
          </Field>
          <Field label="Budget range" error={errors.budget}>
            <select
              value={values.budget}
              onChange={(e) => form.set('budget', e.target.value)}
              disabled={submitting}
              className={inputCls(false)}
            >
              <option value="">Not sure yet</option>
              {BUDGET_RANGES.filter((range) => range !== 'Not sure yet').map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </Field>
        </fieldset>
      )}

      <Field label="Message" required error={errors.message}>
        <textarea
          value={values.message}
          onChange={(e) => edit('message', e.target.value)}
          rows={5}
          disabled={submitting}
          placeholder="Tell us how we can help."
          className={`${inputCls(!!errors.message)} resize-none`}
        />
      </Field>

      <Field
        label="Attach your brief"
        hint={`Optional. ${ATTACHMENT_EXTENSIONS.filter((ext) => ext !== 'jpeg').join(', ').toUpperCase()}, up to 4 MB.`}
        error={errors.attachment}
      >
        {file ? (
          <span className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700">
            <Paperclip size={15} className="flex-shrink-0 text-nuren-purple" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
            <button
              type="button"
              onClick={() => form.setFile(null)}
              disabled={submitting}
              aria-label="Remove attached brief"
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          </span>
        ) : (
          <input
            type="file"
            accept={ATTACHMENT_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
            disabled={submitting}
            onChange={(e) => {
              const picked = e.target.files?.[0] ?? null;
              const problem = picked ? validateBrief(picked) : null;
              setErrors((prev) => ({ ...prev, attachment: problem ?? '' }));
              form.setFile(problem ? null : picked);
              e.target.value = '';
            }}
            className="block w-full text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
          />
        )}
      </Field>

      {transcript.length > 0 && (
        <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={includeChat}
            onChange={(e) => setIncludeChat(e.target.checked)}
            disabled={submitting}
            className="mt-0.5 h-4 w-4 flex-shrink-0 accent-nuren-pink"
          />
          <span>Include my chat with Nura so the team has the full picture.</span>
        </label>
      )}

      {/* Honeypot: people never see it, bots fill it. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={(e) => form.set('website', e.target.value)}
          />
        </label>
      </div>

      {submitError && (
        <div role="alert" className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-full bg-gradient-to-r from-nuren-pink to-nuren-purple text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-nuren-pink/20 hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:cursor-wait disabled:hover:scale-100"
      >
        {submitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Sending…
          </>
        ) : (
          'Send Enquiry →'
        )}
      </button>
      <p className="text-[11px] text-slate-500 text-center">
        By submitting this form, you agree that Nuren Group may use the information provided to respond to your enquiry.
      </p>
    </form>
  );
}
