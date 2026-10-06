import { useState, useRef, useEffect } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Sparkles, CheckCircle2, Loader2, ArrowLeft, RotateCcw } from 'lucide-react';
import { RichText } from './RichText';
import { readSse } from './sse';
import { loadChat, saveChat, clearChat, sessionChatStore } from './chatStorage';
import { buildTranscript, hasVisitorTurns } from './transcript';
import { EnquiryForm } from '../Enquiry/EnquiryForm';
import { useEnquiryForm } from '../Enquiry/enquiryClient';
import { splitIntoBubbles, typingDelayMs } from './pacing';
import { isLang, toOptions } from './types';
import type { ChatMessage, Lang, Role } from './types';

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

/** The turns Nura should see: no greeting or error notices. */
const toHistory = (messages: ChatMessage[]) => {
  const turns: { role: Role; text: string }[] = [];
  for (const m of messages) {
    if (m.intro || m.local) continue;
    const last = turns.at(-1);
    // A reply shown as several bubbles is still one turn for Nura.
    if (last && last.role === 'model' && m.role === 'model') last.text += `\n\n${m.text}`;
    else turns.push({ role: m.role, text: m.text });
  }
  return turns.slice(-HISTORY_LIMIT);
};

const countVisitorTurns = (messages: ChatMessage[]) => messages.filter((m) => m.role === 'user' && !m.local).length;

const parseEventData = (data: string): Record<string, unknown> => {
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
};

/** Wait, but finish early if the reply is abandoned (new chat or unmount). */
const pause = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (ms <= 0 || signal.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });

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

  const form = useEnquiryForm();
  const [draft, setDraft] = useState<{ status: DraftStatus; turns: number }>({ status: 'idle', turns: 0 });

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const visitorTurns = countVisitorTurns(messages);
  const lastMessage = messages.at(-1);
  // Tappable next steps from Nura's latest reply, hidden while a reply is on its way.
  const nextSteps =
    !sending && lastMessage?.role === 'model' && !lastMessage.local ? (lastMessage.options ?? []) : [];

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
    saveChat(sessionChatStore(), { messages, lang: lastLang.current });
  }, [messages]);

  useEffect(() => () => inflight.current?.abort(), []);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const history = toHistory(messages);
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setSending(true);
    const sentAt = Date.now();
    const fallbackLang: Lang = /[一-鿿]/.test(trimmed) ? 'zh' : lastLang.current;
    const controller = new AbortController();
    inflight.current = controller;

    const addNotice = (error: unknown) =>
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: typeof error === 'string' && error ? error : CONNECTION_ERROR[fallbackLang], local: true },
      ]);

    // Show the reply the way a person sends it: "typing…" for a moment that
    // grows with the message, longer answers as a couple of short messages,
    // and the next-step options on the last one. The first pause overlaps the
    // time already spent waiting for the server. The pause applies to everyone:
    // "reduce motion" (on by default on many Windows machines) only stills the
    // typing dots, it doesn't make replies instant.
    const deliver = async (reply: string, options: string[]) => {
      const bubbles = splitIntoBubbles(reply);
      for (const [i, bubble] of bubbles.entries()) {
        await pause(typingDelayMs(bubble) - (i === 0 ? Date.now() - sentAt : 0), controller.signal);
        if (controller.signal.aborted) return;
        const isLast = i === bubbles.length - 1;
        setMessages((prev) => [...prev, { role: 'model', text: bubble, ...(isLast && options.length ? { options } : {}) }]);
      }
    };

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ message: trimmed, history }),
        signal: controller.signal,
      });

      let result: { reply?: string; options?: string[]; error?: unknown } = {};
      if (res.ok && res.body && (res.headers.get('content-type') ?? '').includes('text/event-stream')) {
        for await (const { event, data } of readSse(res.body)) {
          const payload = parseEventData(data);
          if (isLang(payload.lang)) lastLang.current = payload.lang;
          if (event === 'done' && typeof payload.reply === 'string') {
            result = { reply: payload.reply, options: toOptions(payload.options) };
          } else if (event === 'error') {
            result = { error: payload.error };
          }
        }
      } else {
        // Errors before the reply starts (rate limit, validation) come back as JSON.
        const data = await res.json().catch(() => ({}));
        if (isLang(data.lang)) lastLang.current = data.lang;
        result = res.ok && data.reply ? { reply: data.reply, options: toOptions(data.options) } : { error: data.error };
      }

      if (result.reply) await deliver(result.reply, result.options ?? []);
      else if (!controller.signal.aborted) addNotice(result.error);
    } catch {
      // Aborted because the visitor started a new chat: nothing to show.
      if (!controller.signal.aborted) addNotice(null);
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
    form.clearCampaign();
    setDraft({ status: 'idle', turns: 0 });
    inputRef.current?.focus();
  };

  // Fills in the form from the chat (brand, audience, period, budget, and any
  // contact details the visitor gave) so they don't retype what they already
  // told Nura. Only fills fields that are still empty.
  const draftFromChat = async () => {
    setDraft({ status: 'loading', turns: visitorTurns });
    try {
      const res = await fetch(BRIEF_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: buildTranscript(messages) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.message !== 'string') throw new Error('no draft');
      form.applyDraft({
        type: data.type,
        message: data.message,
        company: data.company,
        audience: data.audience,
        period: data.period,
        budget: data.budget,
        name: data.name,
        email: data.email,
        phone: data.phone,
      });
      setDraft({ status: 'ready', turns: visitorTurns });
    } catch {
      setDraft({ status: 'failed', turns: visitorTurns });
    }
  };

  const openEnquiry = () => {
    setView('form');
    const nothingTyped = !form.values.message.trim() && !form.values.type;
    if (visitorTurns > 0 && visitorTurns !== draft.turns && nothingTyped) void draftFromChat();
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
                      key={i}
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
                        {m.role === 'user' ? m.text : <RichText text={m.text} />}
                      </div>
                    </div>
                  ))}
                  {nextSteps.length > 0 && (
                    <div className="flex flex-wrap gap-2 pl-1" role="group" aria-label="Suggested replies">
                      {nextSteps.map((option) => (
                        <button
                          key={option}
                          onClick={() => sendMessage(option)}
                          className="text-sm px-3.5 py-1.5 rounded-full bg-white border border-nuren-pink/40 text-nuren-pink hover:bg-nuren-pink hover:text-white transition-colors"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                        <span className="sr-only">Nura is typing</span>
                        <div className="flex gap-1" aria-hidden="true">
                          <span className="h-2 w-2 bg-nuren-pink rounded-full motion-safe:animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="h-2 w-2 bg-nuren-pink rounded-full motion-safe:animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="h-2 w-2 bg-nuren-pink rounded-full motion-safe:animate-bounce" style={{ animationDelay: '300ms' }}></span>
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
              <div className="flex-1 overflow-y-auto px-5 py-5 bg-slate-50">
                <EnquiryForm
                  form={form}
                  source="chat"
                  transcript={hasVisitorTurns(messages) ? buildTranscript(messages) : []}
                  onSent={() => {
                    setView('success');
                    setDraft({ status: 'idle', turns: visitorTurns });
                  }}
                  notice={
                    <>
                      <p className="text-sm text-slate-600">Share a few details and our team will get back to you.</p>
                      {draft.status === 'loading' && (
                        <p className="flex items-center gap-2 text-xs text-slate-500" role="status">
                          <Loader2 size={14} className="animate-spin flex-shrink-0" />
                          Filling in the details from our chat…
                        </p>
                      )}
                      {draft.status === 'ready' && (
                        <p className="text-xs text-slate-500" role="status">
                          We've filled in what you told Nura. Check it and edit anything before you send.
                        </p>
                      )}
                    </>
                  }
                />
              </div>
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

export default Chatbot;
