import { useState, useRef, useEffect } from 'react';
import type { FormEvent, KeyboardEvent, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Sparkles, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

type Role = 'user' | 'model';
interface ChatMessage {
  role: Role;
  text: string;
}

type View = 'chat' | 'form' | 'success';

const INTRO_MESSAGE: ChatMessage = {
  role: 'model',
  text:
    "Hi! I'm Nura, your assistant for Nuren Group. Ask me about our ecosystem, brand solutions, or products — or tap \"Talk to our team\" to leave an enquiry.",
};

const SUGGESTED_PROMPTS = [
  'What does Nuren Group do?',
  'Tell me about your products',
  'How can brands partner with you?',
];

const CHAT_ENDPOINT = '/api/chat';
const ENQUIRY_ENDPOINT = '/api/enquiry';

interface FormState {
  name: string;
  email: string;
  phone: string;
  topic: string;
  description: string;
  website: string; // honeypot
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  phone: '',
  topic: '',
  description: '',
  website: '',
};

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<View>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (view === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, view, sending]);

  useEffect(() => {
    if (isOpen && view === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, view]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setChatError(null);
    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: trimmed }];
    setMessages(newMessages);
    setInput('');
    setSending(true);

    try {
      const history = newMessages
        .filter((m) => m !== INTRO_MESSAGE)
        .slice(0, -1)
        .slice(-10);

      const res = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setMessages((prev) => [...prev, { role: 'model', text: data.reply || '…' }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setChatError(msg);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text:
            "Sorry — I couldn't reach the server just now. You can try again or tap Talk to our team and we'll get back to you.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const openEnquiry = () => {
    setSubmitError(null);
    setFormErrors({});
    setView('form');
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Please enter your name.';
    if (!form.email.trim()) errs.email = 'Please enter your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Please enter a valid email.';
    if (!form.phone.trim()) errs.phone = 'Please enter your phone number.';
    if (!form.topic.trim()) errs.topic = 'Please enter a topic.';
    if (!form.description.trim()) errs.description = 'Please describe your enquiry.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitEnquiry = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitError(null);
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await fetch(ENQUIRY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.errors) setFormErrors(data.errors);
        throw new Error(data.error || 'Could not submit your enquiry.');
      }
      setView('success');
      setForm(EMPTY_FORM);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setView('chat');
      setMessages([INTRO_MESSAGE]);
      setForm(EMPTY_FORM);
      setFormErrors({});
      setSubmitError(null);
      setChatError(null);
    }, 300);
  };

  return (
    <>
      {/* Floating launcher */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="launcher"
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            onClick={() => setIsOpen(true)}
            aria-label="Open Nuren Group chat"
            className="fixed bottom-6 right-6 z-[90] flex items-center gap-3 pl-5 pr-6 py-4 rounded-full bg-gradient-to-br from-nuren-pink to-nuren-purple text-white font-semibold shadow-2xl shadow-nuren-pink/30 hover:scale-105 transition-transform"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <MessageCircle size={22} />
            <span className="hidden sm:inline">Ask Nura</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            className="fixed z-[95] bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[400px] max-h-[calc(100vh-2rem)] sm:max-h-[640px] h-[640px] max-h-[85vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-5 py-4 bg-gradient-to-br from-nuren-pink to-nuren-purple text-white flex items-center gap-3 flex-shrink-0">
              {view === 'form' && (
                <button
                  onClick={() => setView('chat')}
                  aria-label="Back to chat"
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-lg leading-tight">
                  {view === 'form' ? 'Talk to our team' : view === 'success' ? 'Thank you!' : 'Ask Nura'}
                </div>
                <div className="text-xs text-white/80">
                  {view === 'form'
                    ? 'We usually reply within 1–2 business days'
                    : view === 'success'
                    ? 'Your enquiry is on its way'
                    : 'Nuren Group • AI assistant'}
                </div>
              </div>
              <button
                onClick={resetAndClose}
                aria-label="Close chat"
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            {view === 'chat' && (
              <>
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto px-4 py-5 space-y-3 bg-slate-50"
                >
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                          m.role === 'user'
                            ? 'bg-nuren-pink text-white rounded-br-md'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md shadow-sm'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                        <div className="flex gap-1">
                          <span className="h-2 w-2 bg-nuren-pink rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="h-2 w-2 bg-nuren-pink rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="h-2 w-2 bg-nuren-pink rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  )}
                  {messages.length === 1 && !sending && (
                    <div className="pt-2 space-y-2">
                      {SUGGESTED_PROMPTS.map((p) => (
                        <button
                          key={p}
                          onClick={() => sendMessage(p)}
                          className="block w-full text-left text-sm px-4 py-2.5 bg-white border border-slate-200 rounded-full hover:border-nuren-pink hover:text-nuren-pink transition-colors"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                  {chatError && (
                    <div className="text-xs text-rose-600 px-1">{chatError}</div>
                  )}
                </div>

                <div className="px-4 pt-2 pb-2 border-t border-slate-200 bg-white flex-shrink-0">
                  <button
                    onClick={openEnquiry}
                    className="w-full text-sm font-semibold py-2.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors mb-2"
                  >
                    Talk to our team →
                  </button>
                  <form onSubmit={handleSubmit} className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      placeholder="Ask anything about Nuren Group…"
                      className="flex-1 resize-none px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:border-nuren-pink focus:ring-2 focus:ring-nuren-pink/20 max-h-28"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !input.trim()}
                      aria-label="Send message"
                      className="h-10 w-10 flex-shrink-0 rounded-full bg-nuren-pink text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-nuren-purple transition-colors"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                  <div className="text-[10px] text-slate-400 text-center mt-1.5">
                    AI answers based on Nuren Group public info. Not financial advice.
                  </div>
                </div>
              </>
            )}

            {view === 'form' && (
              <form
                onSubmit={submitEnquiry}
                className="flex-1 overflow-y-auto px-5 py-5 space-y-3.5 bg-slate-50"
              >
                <p className="text-sm text-slate-600">
                  Share a few details and our team will get back to you.
                </p>

                <Field label="Name" error={formErrors.name}>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputCls(!!formErrors.name)}
                    autoComplete="name"
                    disabled={submitting}
                  />
                </Field>

                <Field label="Email" error={formErrors.email}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputCls(!!formErrors.email)}
                    autoComplete="email"
                    disabled={submitting}
                  />
                </Field>

                <Field label="Phone" error={formErrors.phone}>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={inputCls(!!formErrors.phone)}
                    autoComplete="tel"
                    placeholder="+60 …"
                    disabled={submitting}
                  />
                </Field>

                <Field label="Enquiry topic" error={formErrors.topic}>
                  <input
                    type="text"
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                    className={inputCls(!!formErrors.topic)}
                    placeholder="e.g. Brand partnership, Investor relations"
                    disabled={submitting}
                  />
                </Field>

                <Field label="Description" error={formErrors.description}>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    className={inputCls(!!formErrors.description) + ' resize-none'}
                    placeholder="Tell us a little about what you're looking for."
                    disabled={submitting}
                  />
                </Field>

                {/* Honeypot */}
                <div className="hidden" aria-hidden="true">
                  <label>
                    Website
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                    />
                  </label>
                </div>

                {submitError && (
                  <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
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
                    'Submit enquiry'
                  )}
                </button>
                <p className="text-[11px] text-slate-400 text-center">
                  Your enquiry is sent to the Nuren Group team.
                </p>
              </form>
            )}

            {view === 'success' && (
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center bg-slate-50">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="h-20 w-20 rounded-full bg-gradient-to-br from-nuren-pink to-nuren-purple text-white flex items-center justify-center mb-5 shadow-xl shadow-nuren-pink/30"
                >
                  <CheckCircle2 size={40} />
                </motion.div>
                <h3 className="font-display text-2xl font-bold text-slate-900 mb-2">
                  Enquiry submitted
                </h3>
                <p className="text-sm text-slate-600 max-w-xs mb-6">
                  Thanks for reaching out! Our team will review your message and get back to you shortly.
                </p>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  <button
                    onClick={() => setView('chat')}
                    className="w-full py-2.5 rounded-full bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors"
                  >
                    Back to chat
                  </button>
                  <button
                    onClick={resetAndClose}
                    className="w-full py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) => (
  <label className="block">
    <span className="text-xs font-semibold text-slate-700 block mb-1">{label}</span>
    {children}
    {error && <span className="text-xs text-rose-600 block mt-1">{error}</span>}
  </label>
);

const inputCls = (hasError: boolean) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 transition-colors ${
    hasError
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
      : 'border-slate-300 focus:border-nuren-pink focus:ring-nuren-pink/20'
  } disabled:bg-slate-100 disabled:cursor-not-allowed`;

export default Chatbot;
