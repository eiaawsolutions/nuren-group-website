import { useState, useRef, useEffect } from 'react';
import type { FormEvent, KeyboardEvent, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Sparkles, CheckCircle2, Loader2, ArrowLeft, RotateCcw } from 'lucide-react';
import { RichText } from './RichText';
import { readSse } from './sse';
import { loadChat, saveChat, clearChat, sessionChatStore } from './chatStorage';
import { buildTranscript, hasVisitorTurns } from './transcript';
import { isLang } from './types';
import type { ChatMessage, Lang } from './types';

type View = 'chat' | 'form' | 'success';
type DraftStatus = 'idle' | 'loading' | 'ready' | 'failed';

const INTRO_MESSAGE: ChatMessage = {
  role: 'model',
  intro: true,
  text:
    "Hi, I'm Nura, Nuren Group's AI assistant. Whether you're planning a campaign to reach Malaysian mums or just looking around, I'm happy to help. You can chat with me in English, BM or 中文.",
};

// Cover the main reasons people open the chat, not only advertisers.
const SUGGESTED_PROMPTS = [
  'I want to reach mums with my brand',
  'How do KOL campaigns with Ibuencer work?',
  "I'm a creator. Can I join Ibuencer?",
  'Where can I find investor information?',
];

// Enough history for Nura to remember the brand and goal from the start of a chat.
const HISTORY_LIMIT = 20;

// Shown when the server can't be reached at all (otherwise the server sends
// its own localised error).
const CONNECTION_ERROR: Record<Lang, string> = {
  en: "Sorry, I couldn't connect just now. Please try again, or tap Talk to our team and the team will get back to you.",
  ms: 'Maaf, sambungan terputus sebentar. Cuba lagi, atau tekan Talk to our team dan team kami akan menghubungi anda.',
  zh: '抱歉，刚才连接不上。请再试一次，或点击下方的 Talk to our team，我们的团队会联系你。',
};

const CHAT_ENDPOINT = '/api/chat';
const BRIEF_ENDPOINT = '/api/chat/brief';
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

/** The turns Nura should see: no greeting, error notices or half-streamed reply. */
const toHistory = (messages: ChatMessage[]) =>
  messages
    .filter((m) => !m.intro && !m.local && !m.streaming)
    .slice(-HISTORY_LIMIT)
    .map(({ role, text }) => ({ role, text }));

const countVisitorTurns = (messages: ChatMessage[]) => messages.filter((m) => m.role === 'user' && !m.local).length;

const parseEventData = (data: string): Record<string, unknown> => {
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
};

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<View>('chat');
  // Restore the conversation from this tab's session, so closing the panel or
  // reloading the page doesn't make Nura forget what the visitor said.
  const [restored] = useState(() => loadChat(sessionChatStore()));
  const [messages, setMessages] = useState<ChatMessage[]>(() => [INTRO_MESSAGE, ...(restored?.messages ?? [])]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  // Last reply language reported by the server, for client-side error copy.
  const lastLang = useRef<Lang>(restored?.lang ?? 'en');
  // The in-flight reply, so "start a new chat" can stop it.
  const inflight = useRef<AbortController | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ status: DraftStatus; turns: number }>({ status: 'idle', turns: 0 });
  const [includeChat, setIncludeChat] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isStreaming = messages.some((m) => m.streaming);
  const visitorTurns = countVisitorTurns(messages);

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

  useEffect(() => {
    // Save settled conversations only; a reply mid-stream is saved once it lands.
    if (!isStreaming) saveChat(sessionChatStore(), { messages, lang: lastLang.current });
  }, [messages, isStreaming]);

  useEffect(() => () => inflight.current?.abort(), []);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const history = toHistory(messages);
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setSending(true);
    const fallbackLang: Lang = /[一-鿿]/.test(trimmed) ? 'zh' : lastLang.current;
    const controller = new AbortController();
    inflight.current = controller;

    const showStreamed = (streamed: string) =>
      setMessages((prev) => [...prev.filter((m) => !m.streaming), { role: 'model', text: streamed, streaming: true }]);
    // Replace the in-progress reply (if any) with the final text or a notice.
    const settle = (final: ChatMessage) => setMessages((prev) => [...prev.filter((m) => !m.streaming), final]);
    const notice = (error: unknown): ChatMessage => ({
      role: 'model',
      text: typeof error === 'string' && error ? error : CONNECTION_ERROR[fallbackLang],
      local: true,
    });

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ message: trimmed, history }),
        signal: controller.signal,
      });

      const streamed = res.ok && res.body && (res.headers.get('content-type') ?? '').includes('text/event-stream');
      if (!streamed) {
        // Errors before the reply starts (rate limit, validation) come back as JSON.
        const data = await res.json().catch(() => ({}));
        if (isLang(data.lang)) lastLang.current = data.lang;
        settle(res.ok && data.reply ? { role: 'model', text: data.reply } : notice(data.error));
        return;
      }

      let text = '';
      let settled = false;
      for await (const { event, data } of readSse(res.body!)) {
        const payload = parseEventData(data);
        if (isLang(payload.lang)) lastLang.current = payload.lang;
        if (event === 'delta' && typeof payload.text === 'string') {
          text += payload.text;
          showStreamed(text);
        } else if (event === 'done') {
          // The server's final text wins: it may be trimmed or replaced.
          settle({ role: 'model', text: (typeof payload.reply === 'string' && payload.reply) || text || '…' });
          settled = true;
        } else if (event === 'error') {
          settle(notice(payload.error));
          settled = true;
        }
      }
      if (!settled) settle(notice(null));
    } catch {
      // Aborted because the visitor started a new chat: nothing to show.
      if (!controller.signal.aborted) settle(notice(null));
    } finally {
      if (inflight.current === controller) {
        inflight.current = null;
        setSending(false);
      }
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

  const startNewChat = () => {
    inflight.current?.abort();
    inflight.current = null;
    setSending(false);
    setMessages([INTRO_MESSAGE]);
    clearChat(sessionChatStore());
    // Same visitor, new conversation: keep their contact details, drop the draft.
    setForm((f) => ({ ...f, topic: '', description: '' }));
    setDraft({ status: 'idle', turns: 0 });
    setIncludeChat(true);
    inputRef.current?.focus();
  };

  // Drafts the topic and description from the chat so the visitor doesn't
  // retype what they already told Nura. Only fills fields that are still empty.
  const draftFromChat = async () => {
    setDraft({ status: 'loading', turns: visitorTurns });
    try {
      const res = await fetch(BRIEF_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: buildTranscript(messages) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.topic !== 'string' || typeof data.description !== 'string') throw new Error('no draft');
      setForm((f) => ({
        ...f,
        topic: f.topic.trim() ? f.topic : data.topic,
        description: f.description.trim() ? f.description : data.description,
      }));
      setDraft({ status: 'ready', turns: visitorTurns });
    } catch {
      setDraft({ status: 'failed', turns: visitorTurns });
    }
  };

  const openEnquiry = () => {
    setSubmitError(null);
    setFormErrors({});
    setView('form');
    const nothingTyped = !form.topic.trim() && !form.description.trim();
    if (visitorTurns > 0 && visitorTurns !== draft.turns && nothingTyped) void draftFromChat();
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
      const transcript = includeChat ? buildTranscript(messages) : [];
      const res = await fetch(ENQUIRY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ...(transcript.length ? { transcript } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.errors) setFormErrors(data.errors);
        throw new Error(data.error || 'Could not submit your enquiry.');
      }
      setView('success');
      setForm(EMPTY_FORM);
      setDraft({ status: 'idle', turns: visitorTurns });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  // Closing only hides the panel; the conversation stays for when they come back.
  const closePanel = () => {
    setIsOpen(false);
    setTimeout(() => setView('chat'), 300);
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
              {view === 'chat' && visitorTurns > 0 && (
                <button
                  onClick={startNewChat}
                  aria-label="Start a new chat"
                  title="Start a new chat"
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <RotateCcw size={17} />
                </button>
              )}
              <button
                onClick={closePanel}
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
                  role="log"
                  aria-live="polite"
                  aria-label="Conversation with Nura"
                  className="flex-1 overflow-y-auto px-4 py-5 space-y-3 bg-slate-50"
                >
                  {messages.map((m, i) => (
                    <div
                      // The streaming bubble gets its own key so the finished reply mounts
                      // as a new node: screen readers announce it once, not every token.
                      key={m.streaming ? 'streaming' : i}
                      aria-hidden={m.streaming || undefined}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed [overflow-wrap:anywhere] ${
                          m.role === 'user'
                            ? 'bg-nuren-pink text-white rounded-br-md whitespace-pre-wrap'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md shadow-sm'
                        }`}
                      >
                        <span className="sr-only">{m.role === 'user' ? 'You: ' : 'Nura: '}</span>
                        {m.role === 'user' ? m.text : <RichText text={m.text} streaming={m.streaming} />}
                      </div>
                    </div>
                  ))}
                  {sending && !isStreaming && (
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
                {draft.status === 'loading' && (
                  <p className="flex items-center gap-2 text-xs text-slate-500" role="status">
                    <Loader2 size={14} className="animate-spin flex-shrink-0" />
                    Filling in the details from our chat…
                  </p>
                )}
                {draft.status === 'ready' && (
                  <p className="text-xs text-slate-500" role="status">
                    We've filled in the topic and description from your chat. Edit anything before you send.
                  </p>
                )}

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
                    rows={draft.status === 'ready' ? 6 : 4}
                    className={inputCls(!!formErrors.description) + ' resize-none'}
                    placeholder="Tell us a little about what you're looking for."
                    disabled={submitting}
                  />
                </Field>

                {hasVisitorTurns(messages) && (
                  <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeChat}
                      onChange={(e) => setIncludeChat(e.target.checked)}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 accent-nuren-pink"
                      disabled={submitting}
                    />
                    <span>Include my chat with Nura so the team has the full picture.</span>
                  </label>
                )}

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
                    onClick={closePanel}
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
