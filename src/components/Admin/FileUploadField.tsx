import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { MAX_UPLOAD_BYTES } from '../../../server/investors/validate.js';

const UPLOAD_PREFIX = '/api/files/';

/**
 * Optional upload beside the "paste a link" field, as on the investor site's
 * admin: the admin picks a PDF/DOC/DOCX, it uploads to /admin/api/files, and
 * the returned /api/files/<id> URL fills the same field a pasted link would.
 * Remove deletes the stored file.
 */
export function FileUploadField({ value, onChange, authHeader, label = 'Or upload a PDF / document' }: {
  value: string;
  onChange: (url: string) => void;
  authHeader: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedName, setUploadedName] = useState('');
  const isUploaded = value.startsWith(UPLOAD_PREFIX);

  const pick = () => {
    setError('');
    inputRef.current?.click();
  };

  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // picking the same file again should still fire
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setError('The file is too large. The limit is 25 MB.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const res = await fetch('/admin/api/files', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': file.type || 'application/octet-stream',
          'X-Filename': encodeURIComponent(file.name),
        },
        body: file,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Upload failed.');
      setUploadedName(json.filename || file.name);
      onChange(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    const current = value;
    onChange('');
    setUploadedName('');
    try {
      await fetch(`/admin/api/files/${current.slice(UPLOAD_PREFIX.length)}`, {
        method: 'DELETE',
        headers: { Authorization: authHeader },
      });
    } catch {
      // The field is already cleared; a leftover file is harmless.
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-wide text-slate-500">
        {label} <em className="normal-case text-slate-600">(PDF/DOC/DOCX, optional)</em>
      </span>
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,application/pdf" className="hidden" onChange={upload} />
      {isUploaded ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm">
          <a href={value} target="_blank" rel="noopener noreferrer" className="truncate text-pink-400 underline hover:text-pink-300">
            {uploadedName || 'View uploaded file'}
          </a>
          <div className="flex shrink-0 gap-3 text-xs">
            <button type="button" onClick={pick} className="text-sky-400 hover:text-sky-300">Replace</button>
            <button type="button" onClick={remove} className="text-rose-400 hover:text-rose-300">Remove</button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={uploading}
          className="self-start rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700 disabled:opacity-60"
        >
          {uploading ? 'Uploading…' : 'Upload File'}
        </button>
      )}
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  );
}
