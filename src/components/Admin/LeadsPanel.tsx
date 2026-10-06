import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Download, Paperclip } from 'lucide-react';
import { ENQUIRY_TYPES } from '../Enquiry/enquiryClient';

export interface Lead {
  id: string;
  ts: string;
  type: string;
  typeLabel: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  audience: string;
  period: string;
  budget: string;
  message: string;
  source: 'chat' | 'contact-form';
  attachment: { filename: string; size: number } | null;
  transcript: { role: 'user' | 'model'; text: string }[];
  delivery: string;
}

interface Props {
  leads: Lead[];
  storage: { persistent: boolean; writable: boolean; dir: string };
  authHeader: string;
}

const SOURCE_LABEL = { chat: 'Nura chat', 'contact-form': 'Contact Us form' } as const;
const DELIVERY_STYLE: Record<string, string> = {
  sent: 'bg-emerald-500/10 text-emerald-400',
  logged: 'bg-amber-500/10 text-amber-400',
};

// The admin API is behind Basic Auth sent as a header, so a plain link can't
// download: fetch the file, then hand the bytes to the browser.
async function download(url: string, authHeader: string, fallbackName: string) {
  const res = await fetch(url, { headers: { Authorization: authHeader } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? fallbackName;
  const href = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  a.click();
  URL.revokeObjectURL(href);
}

export function LeadsPanel({ leads, storage, authHeader }: Props) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState('');

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter(
      (l) =>
        (!type || l.type === type) &&
        (!q || [l.name, l.email, l.company, l.phone, l.message, l.audience].some((v) => v.toLowerCase().includes(q))),
    );
  }, [leads, query, type]);

  const run = (url: string, fallback: string) => {
    setDownloadError('');
    download(url, authHeader, fallback).catch(() => setDownloadError('Download failed. Refresh the page and try again.'));
  };

  return (
    <div className="space-y-4">
      <div
        className={`rounded-xl border px-4 py-3 text-xs ${
          storage.persistent ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300' : 'border-amber-500/30 bg-amber-500/5 text-amber-300'
        }`}
      >
        {storage.persistent
          ? `Leads and attached briefs are saved to ${storage.dir} and survive deploys.`
          : storage.writable
          ? 'Leads and briefs are saved on the server disk, which is wiped on every deploy. Mount a Railway volume and set LEADS_DIR to its path to keep them. Every lead is also emailed to the team.'
          : 'The server disk is not writable, so leads are kept in memory only and are lost on restart. Every lead is also emailed to the team.'}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, brand, email, message…"
          aria-label="Search leads"
          className="min-w-[14rem] flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Filter by enquiry type"
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
        >
          <option value="">All enquiry types</option>
          {Object.entries(ENQUIRY_TYPES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={() => run('/admin/api/leads.csv', 'nuren-leads.csv')}
          disabled={leads.length === 0}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700 disabled:opacity-40"
        >
          <Download size={14} aria-hidden="true" />
          Export CSV
        </button>
      </div>
      {downloadError && <p className="text-xs text-rose-400">{downloadError}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        {leads.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No leads yet. Enquiries from the Contact Us form and the Nura chat appear here, and each one is also emailed to the team.
          </div>
        ) : shown.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No leads match that search.</div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {shown.map((l) => {
              const open = openId === l.id;
              return (
                <li key={l.id}>
                  <button
                    onClick={() => setOpenId(open ? null : l.id)}
                    aria-expanded={open}
                    className="flex w-full items-start justify-between gap-4 p-5 text-left hover:bg-slate-800/40"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {l.company || l.name}
                        {l.company && <span className="text-slate-400"> · {l.name}</span>}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {l.typeLabel} · {SOURCE_LABEL[l.source] ?? l.source} · {new Date(l.ts).toLocaleString('en-MY')}
                      </div>
                      {!open && <div className="mt-2 line-clamp-2 text-sm text-slate-400">{l.message}</div>}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {l.attachment && <Paperclip size={14} className="text-slate-400" aria-label="Has a brief attached" />}
                      <span className={`rounded px-2 py-1 text-xs ${DELIVERY_STYLE[l.delivery] ?? 'bg-rose-500/10 text-rose-400'}`}>
                        {l.delivery === 'sent' ? 'emailed' : l.delivery}
                      </span>
                    </div>
                  </button>

                  {open && (
                    <div className="space-y-4 px-5 pb-5">
                      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                        <Detail label="Email">
                          <a href={`mailto:${l.email}`} className="text-pink-400 hover:text-pink-300">
                            {l.email}
                          </a>
                        </Detail>
                        <Detail label="Mobile">
                          <a href={`tel:${l.phone.replace(/[^\d+]/g, '')}`} className="text-pink-400 hover:text-pink-300">
                            {l.phone}
                          </a>
                        </Detail>
                        <Detail label="Target audience">{l.audience}</Detail>
                        <Detail label="Campaign period">{l.period}</Detail>
                        <Detail label="Budget range">{l.budget}</Detail>
                      </dl>

                      <div>
                        <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">Message</div>
                        <p className="whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
                          {l.message}
                        </p>
                      </div>

                      {l.attachment && (
                        <button
                          onClick={() => run(`/admin/api/leads/${l.id}/attachment`, l.attachment!.filename)}
                          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
                        >
                          <Paperclip size={14} aria-hidden="true" />
                          Download brief: {l.attachment.filename} ({Math.max(1, Math.round(l.attachment.size / 1024))} KB)
                        </button>
                      )}

                      {l.transcript?.length > 0 && (
                        <details className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm">
                          <summary className="cursor-pointer text-slate-400">Chat with Nura ({l.transcript.length} messages)</summary>
                          <div className="mt-3 space-y-2">
                            {l.transcript.map((t, i) => (
                              <p key={i} className="whitespace-pre-wrap text-slate-300">
                                <strong className={t.role === 'user' ? 'text-slate-100' : 'text-pink-400'}>
                                  {t.role === 'user' ? 'Visitor' : 'Nura'}:
                                </strong>{' '}
                                {t.text}
                              </p>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words text-slate-200">{children || <span className="text-slate-600">Not given</span>}</dd>
    </div>
  );
}
