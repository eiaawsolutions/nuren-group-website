import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { validateJob } from '../../../server/careers/validate.js';
import type { JobPosition } from '../Careers/useJobPositions';
import { RichTextEditor } from './RichTextEditor';
import { Labelled, Modal, Toggle, inputCls } from './ui';

type JobDraft = Omit<JobPosition, 'id'> & { id?: string };
type Notice = { kind: 'ok' | 'error'; text: string } | null;

const API = '/admin/api/job-positions';
const EMPTY_JOB: JobDraft = { position: '', description: '', tags: [''], salary: '', location: '', open: true };

interface Props {
  authHeader: string;
  storage: { persistent: boolean; writable: boolean; dir: string };
}

/**
 * The Nuren investor site's careers admin: the position list, with search,
 * add, edit (title, description, salary, open or closed, location, tags) and
 * delete. Open positions show on /careers. Saved under INVESTOR_DATA_DIR.
 */
export function JobPositionsPanel({ authHeader, storage }: Props) {
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [editing, setEditing] = useState<JobDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JobPosition | null>(null);
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
      setJobs((await api(API)).records || []);
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Could not load the positions.' });
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const q = appliedSearch.trim().toLowerCase();
    return q ? jobs.filter((job) => job.position.toLowerCase().includes(q)) : jobs;
  }, [jobs, appliedSearch]);

  async function save(draft: JobDraft) {
    const { id, ...body } = draft;
    await api(id ? `${API}/${id}` : API, { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
    await load();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await api(`${API}/${deleteTarget.id}`, { method: 'DELETE' });
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
          ? `Job positions are saved to ${storage.dir} and survive deploys.`
          : storage.writable
          ? 'Changes are saved on the server disk, which is wiped on every deploy. Mount a Railway volume and set INVESTOR_DATA_DIR to its path to keep them.'
          : 'The server disk is not writable, so changes last only until the next restart.'}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Position List</h2>
        <div className="flex flex-wrap gap-2">
          <a href="/careers" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700">
            View Careers Page
          </a>
          <button onClick={() => setEditing({ ...EMPTY_JOB, tags: [''] })} className="rounded-lg bg-pink-500 px-3 py-2 text-sm font-medium text-white hover:bg-pink-400">
            Add New Position
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
          aria-label="Search positions"
          className="w-64 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
        />
        <button onClick={applySearch} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700">
          Search
        </button>
      </div>

      {notice && <p className={`text-sm ${notice.kind === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`}>{notice.text}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Salary</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3 w-24">Status</th>
              <th className="px-4 py-3 w-40 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading…</td></tr>
            ) : shown.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">There are no positions.</td></tr>
            ) : (
              shown.map((job) => (
                <tr key={job.id} className={job.open ? '' : 'opacity-60'}>
                  <td className="px-4 py-3">{job.position}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {job.tags.map((tag, i) => (
                        <span key={i} className="rounded bg-amber-200/10 px-2 py-0.5 text-xs text-amber-200">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">{job.salary}</td>
                  <td className="px-4 py-3">{job.location}</td>
                  <td className={`px-4 py-3 ${job.open ? 'text-emerald-400' : 'text-rose-400'}`}>{job.open ? 'Open' : 'Closed'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-4">
                      <button onClick={() => setEditing({ ...job, tags: job.tags.length ? [...job.tags] : [''] })} className="text-sky-400 hover:text-sky-300">Edit</button>
                      <button onClick={() => setDeleteTarget(job)} className="text-rose-500 hover:text-rose-400">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <Modal title="Delete job position" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-slate-300">Are you sure to delete?</p>
          <p className="mt-2 text-sm text-slate-500">{deleteTarget.position}</p>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm">Cancel</button>
            <button onClick={confirmDelete} className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-500">Delete</button>
          </div>
        </Modal>
      )}

      {editing && (
        <EditPosition
          initial={editing}
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

function EditPosition({ initial, onClose, onSave }: {
  initial: JobDraft;
  onClose: () => void;
  onSave: (draft: JobDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<JobDraft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const set = <K extends keyof JobDraft>(key: K, value: JobDraft[K]) => setDraft((prev) => ({ ...prev, [key]: value }));
  const setTag = (index: number, value: string) => set('tags', draft.tags.map((tag, i) => (i === index ? value : tag)));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const { errors: found } = validateJob(draft);
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
    <Modal title={initial.id ? 'Edit position' : 'Add New Position'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Labelled label="Position Title" error={errors.position}>
          <input className={inputCls} value={draft.position} placeholder="Position Title" onChange={(e) => set('position', e.target.value)} />
        </Labelled>

        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-slate-500">Description</span>
          <RichTextEditor value={draft.description} onChange={(html) => set('description', html)} label="Description" />
          {errors.description && <span className="text-xs text-rose-400">{errors.description}</span>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Labelled label="Salary" error={errors.salary}>
            <input className={inputCls} value={draft.salary} placeholder="eg: MYR 3000 - 4000 or MYR 4000" onChange={(e) => set('salary', e.target.value)} />
          </Labelled>
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-slate-500">Status</span>
            <Toggle
              value={draft.open ? 'open' : 'closed'}
              onChange={(v) => set('open', v === 'open')}
              options={[
                { value: 'open', label: 'Open', on: 'bg-emerald-600' },
                { value: 'closed', label: 'Closed', on: 'bg-rose-600' },
              ]}
            />
          </div>
        </div>

        <Labelled label="Location" error={errors.location}>
          <input className={inputCls} value={draft.location} placeholder="eg: Petaling Jaya, Jaya One" onChange={(e) => set('location', e.target.value)} />
        </Labelled>

        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-500">Tags</span>
          {draft.tags.map((tag, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className={inputCls} value={tag} placeholder="Tag" aria-label={`Tag ${i + 1}`} onChange={(e) => setTag(i, e.target.value)} />
              <button
                type="button"
                onClick={() => set('tags', draft.tags.filter((_, j) => j !== i))}
                aria-label={`Remove tag ${i + 1}`}
                className="rounded-full px-2 text-lg leading-none text-slate-500 hover:text-rose-400"
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" onClick={() => set('tags', [...draft.tags, ''])} className="self-start text-sm text-sky-400 underline hover:text-sky-300">
            Add Tag
          </button>
        </div>

        {saveError && <p className="text-sm text-rose-400">{saveError}</p>}

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-700 px-4 py-2 text-sm">Close</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-400 disabled:bg-slate-700">
            {saving ? 'Saving…' : 'Submit'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
