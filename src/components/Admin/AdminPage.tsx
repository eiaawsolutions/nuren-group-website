import { useState, useEffect, FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { LeadsPanel, type Lead } from './LeadsPanel';

interface Status {
  settings: {
    anthropicKey: { set: boolean; masked: string };
    resendKey: { set: boolean; masked: string };
    enquiryFromEmail: string;
    enquiryRecipient: string;
    leadStorage: { persistent: boolean; writable: boolean; dir: string };
    chatModel: string;
    chatModelKey: string;
    chatEffort: string | null;
    promptVersion: string;
  };
  knowledgeBase: string;
  usage: NuraUsage;
  counts: { enquiries: number; errors: number };
}

// Running totals from server/nura/usage.js, reset on every deploy/restart.
interface NuraUsage {
  since: string;
  requests: number;
  errors: number;
  aborted: number;
  truncated: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  estimatedCostUsd: number;
  avgLatencyMs: number;
  cacheReadRatio: number;
  byRoute: Record<string, number>;
  byLang: Record<string, number>;
}

const formatCount = (n: number) => n.toLocaleString('en-MY');
const formatBreakdown = (counts: Record<string, number>) =>
  Object.entries(counts)
    .map(([key, n]) => `${key} ${formatCount(n)}`)
    .join(' · ') || '—';

interface ErrorEntry {
  ts: string;
  scope: string;
  detail: string;
}

const STORAGE_KEY = 'nuren-admin-auth';

function authHeader(password: string): string {
  return `Basic ${btoa(`admin:${password}`)}`;
}

export function AdminPage() {
  const [password, setPassword] = useState<string>(() => sessionStorage.getItem(STORAGE_KEY) || '');
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);

  const [status, setStatus] = useState<Status | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [tab, setTab] = useState<'overview' | 'kb' | 'leads' | 'errors'>('overview');
  const [testAnthropicResult, setTestAnthropicResult] = useState<string>('');
  const [testEnquiryResult, setTestEnquiryResult] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  async function loadAll(pw: string) {
    const headers = { Authorization: authHeader(pw) };
    const [s, e, x] = await Promise.all([
      fetch('/admin/api/status', { headers }),
      fetch('/admin/api/leads', { headers }),
      fetch('/admin/api/errors', { headers }),
    ]);
    if (!s.ok) throw new Error(`status ${s.status}`);
    setStatus(await s.json());
    setLeads((await e.json()).leads || []);
    setErrors((await x.json()).errors || []);
  }

  async function handleLogin(ev: FormEvent) {
    ev.preventDefault();
    setLoginBusy(true);
    setLoginError('');
    try {
      await loadAll(password);
      sessionStorage.setItem(STORAGE_KEY, password);
      setAuthed(true);
    } catch {
      setLoginError('Invalid password, or admin not configured. Set SUPERADMIN_PASSWORD in Railway and try again.');
    } finally {
      setLoginBusy(false);
    }
  }

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    loadAll(stored).then(() => setAuthed(true)).catch(() => {
      sessionStorage.removeItem(STORAGE_KEY);
    });
  }, []);

  async function refresh() {
    setRefreshing(true);
    try {
      await loadAll(password);
    } finally {
      setRefreshing(false);
    }
  }

  async function testAnthropic() {
    setTestAnthropicResult('Testing…');
    const res = await fetch('/admin/api/test-anthropic', {
      method: 'POST',
      headers: { Authorization: authHeader(password) },
    });
    const data = await res.json();
    if (data.ok) {
      setTestAnthropicResult(`OK — replied "${data.reply}" in ${data.latencyMs}ms`);
    } else {
      setTestAnthropicResult(`FAIL — ${data.error || `HTTP ${data.status || res.status}`}`);
    }
  }

  async function testEnquiry() {
    setTestEnquiryResult('Sending…');
    const res = await fetch('/admin/api/test-enquiry', {
      method: 'POST',
      headers: { Authorization: authHeader(password) },
    });
    const data = await res.json();
    if (data.ok) {
      setTestEnquiryResult(`OK — delivery: ${data.delivery}`);
    } else {
      setTestEnquiryResult(`FAIL — ${data.error || `HTTP ${res.status}`}`);
    }
    refresh();
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setAuthed(false);
    setPassword('');
    setStatus(null);
    setLeads([]);
    setErrors([]);
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
        <Helmet><title>Admin — Nuren Group</title><meta name="robots" content="noindex,nofollow" /></Helmet>
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl"
        >
          <div className="mb-6">
            <div className="text-xs uppercase tracking-widest text-pink-400 mb-2">Nuren Group</div>
            <h1 className="text-2xl font-semibold">Superadmin</h1>
            <p className="text-sm text-slate-400 mt-1">Restricted area. Authentication required.</p>
          </div>
          <label className="block">
            <span className="text-sm text-slate-300">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
            />
          </label>
          {loginError && <p className="mt-3 text-sm text-rose-400">{loginError}</p>}
          <button
            type="submit"
            disabled={loginBusy || !password}
            className="mt-6 w-full rounded-lg bg-pink-500 hover:bg-pink-400 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium py-2.5 transition"
          >
            {loginBusy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    );
  }

  if (!status) {
    return <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Helmet><title>Admin — Nuren Group</title><meta name="robots" content="noindex,nofollow" /></Helmet>

      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-pink-400">Nuren Group</div>
            <h1 className="text-lg font-semibold">Superadmin</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={refresh} disabled={refreshing} className="text-sm text-slate-300 hover:text-white">
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <button onClick={logout} className="text-sm text-slate-400 hover:text-rose-400">Sign out</button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 flex gap-1 -mb-px">
          {(['overview', 'kb', 'leads', 'errors'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm border-b-2 transition ${
                tab === t ? 'border-pink-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'overview' && 'Overview'}
              {t === 'kb' && 'Knowledge base'}
              {t === 'leads' && `Leads (${leads.length})`}
              {t === 'errors' && `Errors (${errors.length})`}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {tab === 'overview' && (
          <div className="space-y-6">
            <section className="grid sm:grid-cols-2 gap-4">
              <SettingRow
                label="Anthropic API key"
                value={status.settings.anthropicKey.masked || '— not set —'}
                ok={status.settings.anthropicKey.set}
              />
              <SettingRow
                label="Resend API key"
                value={status.settings.resendKey.masked || '— not set —'}
                ok={status.settings.resendKey.set}
                note={status.settings.resendKey.set ? undefined : 'Enquiries log to console only.'}
              />
              <SettingRow label="Enquiry sender" value={status.settings.enquiryFromEmail} ok />
              <SettingRow label="Enquiry recipient" value={status.settings.enquiryRecipient} ok />
              <SettingRow label="Chat model" value={status.settings.chatModel} ok />
              <SettingRow
                label="Model key · effort · prompt version"
                value={`NURA_MODEL=${status.settings.chatModelKey} · ${status.settings.chatEffort ?? 'n/a'} · ${status.settings.promptVersion}`}
                ok
              />
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-baseline justify-between gap-4 mb-4">
                <h2 className="text-base font-semibold">Nura usage</h2>
                <span className="text-xs text-slate-500">
                  Since {new Date(status.usage.since).toLocaleString('en-MY')} (resets on deploy)
                </span>
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <UsageStat label="Model calls" value={formatCount(status.usage.requests)} />
                <UsageStat label="Est. cost (USD)" value={`$${status.usage.estimatedCostUsd.toFixed(4)}`} />
                <UsageStat label="Avg latency" value={`${formatCount(status.usage.avgLatencyMs)} ms`} />
                <UsageStat label="Input from cache" value={`${Math.round(status.usage.cacheReadRatio * 100)}%`} />
                <UsageStat label="Input tokens (uncached)" value={formatCount(status.usage.inputTokens)} />
                <UsageStat label="Output tokens" value={formatCount(status.usage.outputTokens)} />
                <UsageStat label="Cache read / write" value={`${formatCount(status.usage.cacheReadTokens)} / ${formatCount(status.usage.cacheWriteTokens)}`} />
                <UsageStat
                  label="Errors · cut off · left early"
                  value={`${status.usage.errors} · ${status.usage.truncated} · ${status.usage.aborted}`}
                  warn={status.usage.errors > 0 || status.usage.truncated > 0}
                />
              </dl>
              <p className="mt-4 text-xs text-slate-500">
                By route: {formatBreakdown(status.usage.byRoute)} &nbsp;|&nbsp; By language: {formatBreakdown(status.usage.byLang)}.
                Costs are estimates from list prices; the Anthropic Console has the billed amounts.
              </p>
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-base font-semibold mb-4">Connection tests</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <button onClick={testAnthropic} className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-sm">
                    Ping Anthropic
                  </button>
                  {testAnthropicResult && (
                    <p className={`mt-2 text-xs ${testAnthropicResult.startsWith('OK') ? 'text-emerald-400' : testAnthropicResult.startsWith('FAIL') ? 'text-rose-400' : 'text-slate-400'}`}>
                      {testAnthropicResult}
                    </p>
                  )}
                </div>
                <div>
                  <button onClick={testEnquiry} className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-sm">
                    Send test enquiry
                  </button>
                  {testEnquiryResult && (
                    <p className={`mt-2 text-xs ${testEnquiryResult.startsWith('OK') ? 'text-emerald-400' : testEnquiryResult.startsWith('FAIL') ? 'text-rose-400' : 'text-slate-400'}`}>
                      {testEnquiryResult}
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Test enquiries deliver to the configured recipient (or log to stdout if Resend is not set), and appear in the Leads tab as <code>Admin test</code>.
              </p>
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-base font-semibold mb-2">Editing settings</h2>
              <p className="text-sm text-slate-400">
                Settings are read-only here by design. To change a value, update the corresponding environment variable in the
                {' '}<a href="https://railway.com/project/dcee776f-2d22-4312-a6da-e1431cc25b84" target="_blank" rel="noreferrer" className="text-pink-400 hover:text-pink-300 underline">Railway dashboard</a>{' '}
                — the service will redeploy automatically. The knowledge base lives in <code className="text-slate-300">server/nura/prompt.md</code> and changes via a code commit.
              </p>
            </section>
          </div>
        )}

        {tab === 'kb' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">Nura knowledge base</h2>
              <button
                onClick={() => navigator.clipboard.writeText(status.knowledgeBase)}
                className="text-xs text-slate-400 hover:text-white"
              >Copy</button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Source of truth: <code>server.js</code>. Edit there, commit, push — Railway redeploys.
            </p>
            <pre className="text-xs leading-relaxed text-slate-300 bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">
              {status.knowledgeBase}
            </pre>
          </div>
        )}

        {tab === 'leads' && <LeadsPanel leads={leads} storage={status.settings.leadStorage} authHeader={authHeader(password)} />}

        {tab === 'errors' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {errors.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No errors logged. The log holds the last 50 and resets on redeploy.</div>
            ) : (
              <ul className="divide-y divide-slate-800 font-mono text-xs">
                {errors.map((e, idx) => (
                  <li key={idx} className="p-4">
                    <div className="text-slate-500">{new Date(e.ts).toLocaleString()}</div>
                    <div className="text-rose-400 mt-1">[{e.scope}]</div>
                    <div className="text-slate-300 mt-1 whitespace-pre-wrap">{e.detail}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function UsageStat({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`mt-1 text-sm font-mono ${warn ? 'text-amber-400' : 'text-slate-200'}`}>{value}</dd>
    </div>
  );
}

function SettingRow({ label, value, ok, note }: { label: string; value: string; ok: boolean; note?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
        <span className={`w-2 h-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-amber-400'}`} aria-hidden />
      </div>
      <div className="mt-2 text-sm font-mono text-slate-200 break-all">{value}</div>
      {note && <div className="mt-1 text-xs text-amber-400">{note}</div>}
    </div>
  );
}
