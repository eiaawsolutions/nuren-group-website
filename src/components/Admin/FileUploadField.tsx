import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { MAX_UPLOAD_BYTES } from '../../../server/investors/validate.js';
import type { InvestorCollection } from '../Investors/useInvestorList';

const SERVER_UPLOAD_PREFIX = '/api/files/';

/**
 * Optional upload beside the "paste a link" field, as on the investor site's
 * admin: the admin picks a PDF/DOC/DOCX and the returned URL fills the same
 * field a pasted link would. With S3 configured the file goes to the investor
 * bucket, named after the record's title (`title`); otherwise it is kept on
 * this server at /api/files/<id>. Remove deletes a server copy; files already
 * in S3 are left there (the record simply stops linking to them).
 */
export function FileUploadField({ value, onChange, authHeader, collection, title, label = 'Or upload a PDF / document' }: {
  value: string;
  onChange: (url: string) => void;
  authHeader: string;
  collection: InvestorCollection;
  title: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedName, setUploadedName] = useState('');
  const onServer = value.startsWith(SERVER_UPLOAD_PREFIX);
  const showChip = onServer || (uploadedName !== '' && value !== '');

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
          'X-Collection': collection,
          'X-Title': encodeURIComponent(title),
        },
        body: file,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Upload failed.');
      setUploadedName(`${json.filename || file.name}${json.storage === 's3' ? ' (in S3)' : ''}`);
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
    if (!current.startsWith(SERVER_UPLOAD_PREFIX)) return;
    try {
      await fetch(`/admin/api/files/${current.slice(SERVER_UPLOAD_PREFIX.length)}`, {
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
      {showChip ? (
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
