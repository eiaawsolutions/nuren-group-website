import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { validateRecord } from '../../../server/investors/validate.js';
import { formatAnnouncementDate } from '../Investors/format';
import type { InvestorCollection, InvestorRecord } from '../Investors/useInvestorList';
import { FileUploadField } from './FileUploadField';
import { ADMIN_COPY, emptyRecord, matchesSearch, type RecordDraft } from './investorAdmin';

interface Props {
  collection: InvestorCollection;
  authHeader: string;
  storage: { persistent: boolean; writable: boolean; dir: string };
}

type Notice = { kind: 'ok' | 'error'; text: string } | null;

/**
 * The Nuren investor site's Announcements / Finance Reports admin: search,
 * add, edit, hide or show (rows are kept, only hidden from the public page),
 * and delete. Records live on the server under INVESTOR_DATA_DIR.
 */
export function InvestorRecordsPanel({ collection, authHeader, storage }: Props) {
  const copy = ADMIN_COPY[collection];
  const isReports = collection === 'financial-reports';
  const [records, setRecords] = useState<InvestorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [editing, setEditing] = useState<RecordDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InvestorRecord | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const api = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const res = await fetch(path, {
        ...init,
        headers: { Authorization: authHeader, ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
      });
      const json = res.status === 204 ? {} : await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(json.error || `HTTP ${res.status}`), { errors: json.errors });
      return json;
    },
    [authHeader],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await api(`/admin/api/${collection}`);
      setRecords(json.records || []);
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Could not load the list.' });
    } finally {
      setLoading(false);
    }
  }, [api, collection]);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(
    () => records.filter((r) => matchesSearch(r, collection, appliedSearch)),
    [records, collection, appliedSearch],
  );

  async function save(draft: RecordDraft) {
    const { id, ...body } = draft;
    const json = await api(id ? `/admin/api/${collection}/${id}` : `/admin/api/${collection}`, {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(body),
    });
    await load();
    return json.record as InvestorRecord;
  }

  async function toggleActive(record: InvestorRecord) {
    try {
      await save({ ...record, active: record.active === false });
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Could not update.' });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await api(`/admin/api/${collection}/${deleteTarget.id}`, { method: 'DELETE' });
      setNotice({ kind: 'ok', text: 'Deleted.' });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Could not delete.' });
    }
  }

  const applySearch = () => setAppliedSearch(search);

  return (
    <div className="space-y-4">
      <div
        className={`rounded-xl border px-4 py-3 text-xs ${
          storage.persistent ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300' : 'border-amber-500/30 bg-amber-500/5 text-amber-300'
        }`}
      >
        {storage.persistent
          ? `Announcements, reports and uploaded files are saved to ${storage.dir} and survive deploys.`
          : storage.writable
          ? 'Changes are saved on the server disk, which is wiped on every deploy. Mount a Railway volume and set INVESTOR_DATA_DIR to its path to keep them.'
          : 'The server disk is not writable, so changes last only until the next restart, and uploads are refused.'}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{copy.title}</h2>
        <div className="flex flex-wrap gap-2">
          <a
            href={copy.viewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
          >
            {copy.view}
          </a>
          <button
            onClick={() => setEditing(emptyRecord(collection))}
            className="rounded-lg bg-pink-500 px-3 py-2 text-sm font-medium text-white hover:bg-pink-400"
          >
            {copy.add}
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyUp={(e) => e.key === 'Enter' && applySearch()}
          placeholder="Search"
          aria-label={`Search ${copy.title.toLowerCase()}`}
          className="w-64 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
        />
        <button onClick={applySearch} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700">
          Search
        </button>
      </div>

      {notice && (
        <p className={`text-sm ${notice.kind === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`}>{notice.text}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {isReports ? (
                <>
                  <th className="px-4 py-3 w-36">Date</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3 w-24">Link/File</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 w-28">Code</th>
                  <th className="px-4 py-3">Headline</th>
                  <th className="px-4 py-3 w-36">Release Date</th>
                </>
              )}
              <th className="px-4 py-3 w-28">Status</th>
              <th className="px-4 py-3 w-52 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading…</td></tr>
            ) : shown.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">There are no records available.</td></tr>
            ) : (
              shown.map((r) => {
                const hidden = r.active === false;
                const heading = (isReports ? r.title : r.headline) || '';
                return (
                  <tr key={r.id} className={hidden ? 'opacity-60' : ''}>
                    {isReports ? (
                      <>
                        <td className="px-4 py-3 whitespace-nowrap">{formatAnnouncementDate(r.date)}</td>
                        <td className="px-4 py-3"><RecordLink url={r.url}>{heading}</RecordLink></td>
                        <td className="px-4 py-3">{r.type}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">{r.code}</td>
                        <td className="px-4 py-3"><RecordLink url={r.url}>{heading}</RecordLink></td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatAnnouncementDate(r.date)}</td>
                      </>
                    )}
                    <td className={`px-4 py-3 ${hidden ? 'text-rose-400' : 'text-emerald-400'}`}>{hidden ? 'Hidden' : 'Visible'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => toggleActive(r)}
                          title={hidden ? `Show this ${copy.noun} to the public` : `Hide this ${copy.noun} from the public (kept in backend)`}
                          className={`font-semibold ${hidden ? 'text-emerald-400' : 'text-rose-400'}`}
                        >
                          {hidden ? 'Show' : 'Hide'}
                        </button>
                        <button onClick={() => setEditing({ ...r })} className="text-sky-400 hover:text-sky-300">Edit</button>
                        <button onClick={() => setDeleteTarget(r)} className="text-rose-500 hover:text-rose-400">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <Modal title={`Delete ${copy.noun}`} onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-slate-300">Are you sure to delete?</p>
          <p className="mt-2 text-sm text-slate-500">{(isReports ? deleteTarget.title : deleteTarget.headline) || ''}</p>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm">Cancel</button>
            <button onClick={confirmDelete} className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-500">Delete</button>
          </div>
        </Modal>
      )}

      {editing && (
        <EditPopup
          collection={collection}
          initial={editing}
          authHeader={authHeader}
          onClose={() => setEditing(null)}
          onSave={async (draft) => {
            await save(draft);
            setNotice({ kind: 'ok', text: 'Saved successfully.' });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function RecordLink({ url, children }: { url: string; children: ReactNode }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="underline decoration-slate-600 hover:text-pink-300">
      {children}
    </a>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-10" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-base font-semibold">{title}</h3>
        {children}
      </div>
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none';

function Labelled({ label, error, children }: { label: ReactNode; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      {children}
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </label>
  );
}

function Toggle({ options, value, onChange }: {
  options: { value: string; label: string; on: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-slate-700">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`px-3 py-1.5 text-sm ${value === o.value ? `${o.on} text-white` : 'text-slate-400'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function EditPopup({ collection, initial, authHeader, onClose, onSave }: {
  collection: InvestorCollection;
  initial: RecordDraft;
  authHeader: string;
  onClose: () => void;
  onSave: (draft: RecordDraft) => Promise<void>;
}) {
  const isReports = collection === 'financial-reports';
  const titleField = isReports ? 'title' : 'headline';
  const [draft, setDraft] = useState<RecordDraft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const set = (key: keyof RecordDraft, value: unknown) => setDraft((prev) => ({ ...prev, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const { errors: found } = validateRecord(collection, draft);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setSaveError('');
    try {
      await onSave(draft);
    } catch (err) {
      const fieldErrors = (err as { errors?: Record<string, string> }).errors;
      if (fieldErrors) setErrors(fieldErrors);
      setSaveError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={initial.id ? `Edit ${ADMIN_COPY[collection].noun}` : ADMIN_COPY[collection].add} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-[9rem_1fr] gap-4">
          <Labelled label="Code" error={errors.code}>
            <input className={inputCls} value={draft.code || ''} placeholder={isReports ? '40560' : '40060'} onChange={(e) => set('code', e.target.value)} />
          </Labelled>
          <Labelled label="Category" error={errors.category}>
            <input
              className={inputCls}
              value={draft.category || ''}
              placeholder={isReports ? 'NSX Quarterly Report' : 'NSX Removal from Official List'}
              onChange={(e) => set('category', e.target.value)}
            />
          </Labelled>
        </div>

        <Labelled label={isReports ? 'Title / Headline' : 'Headline'} error={errors[titleField]}>
          <textarea
            className={`${inputCls} h-20`}
            value={(draft[titleField] as string) || ''}
            placeholder={isReports ? 'Title' : '40060 NSX Removal from Official List - ...'}
            onChange={(e) => set(titleField, e.target.value)}
          />
        </Labelled>

        <Labelled label="Description" error={errors.description}>
          <textarea
            className={`${inputCls} h-24`}
            value={draft.description || ''}
            placeholder={`Short description shown under the ${isReports ? 'title' : 'headline'}`}
            onChange={(e) => set('description', e.target.value)}
          />
        </Labelled>

        <div className="grid gap-4 sm:grid-cols-2">
          <Labelled label={isReports ? 'Date' : 'Release Date'} error={errors.date}>
            <input
              type="datetime-local"
              step={1}
              className={inputCls}
              value={draft.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </Labelled>
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-slate-500">{isReports ? 'Type' : 'Status'}</span>
            {isReports ? (
              <Toggle
                value={draft.type || 'file'}
                onChange={(v) => set('type', v)}
                options={[
                  { value: 'file', label: 'File', on: 'bg-emerald-600' },
                  { value: 'link', label: 'Link', on: 'bg-emerald-600' },
                ]}
              />
            ) : (
              <Toggle
                value={draft.active === false ? 'inactive' : 'active'}
                onChange={(v) => set('active', v === 'active')}
                options={[
                  { value: 'active', label: 'Active', on: 'bg-emerald-600' },
                  { value: 'inactive', label: 'Inactive', on: 'bg-rose-600' },
                ]}
              />
            )}
          </div>
        </div>

        <Labelled
          label={
            <>
              {isReports ? 'File Link/URL' : 'PDF Link / URL'}{' '}
              <em className="normal-case text-slate-600">(paste a link, e.g. /announcements-pdfs/&lt;file&gt;.pdf or a Drive URL)</em>
            </>
          }
          error={errors.url}
        >
          <input className={inputCls} value={draft.url} placeholder="/announcements-pdfs/..." onChange={(e) => set('url', e.target.value)} />
        </Labelled>

        <FileUploadField
          value={draft.url}
          authHeader={authHeader}
          // An upload also sets a report's Type to "file", as on the investor site.
          onChange={(url) => setDraft((prev) => ({ ...prev, url, ...(isReports && url ? { type: 'file' as const } : {}) }))}
        />

        {saveError && <p className="text-sm text-rose-400">{saveError}</p>}

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-700 px-4 py-2 text-sm">Close</button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-400 disabled:bg-slate-700"
          >
            {saving ? 'Saving…' : 'Submit'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
