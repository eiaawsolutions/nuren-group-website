import { useEffect, useRef } from 'react';

// The formatting job descriptions use (and the server keeps; see
// server/careers/sanitize.js): bold, italic, bulleted and numbered lists.
const COMMANDS = [
  { command: 'bold', label: 'B', title: 'Bold', className: 'font-bold' },
  { command: 'italic', label: 'I', title: 'Italic', className: 'italic' },
  { command: 'insertUnorderedList', label: '• List', title: 'Bulleted list', className: '' },
  { command: 'insertOrderedList', label: '1. List', title: 'Numbered list', className: '' },
];

/**
 * A small rich-text box for the careers admin, standing in for the CKEditor the
 * investor site used. It edits HTML in place (contentEditable); whatever it
 * produces is sanitised by the server before it is stored.
 */
export function RichTextEditor({ value, onChange, label }: {
  value: string;
  onChange: (html: string) => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Load the HTML when a different record opens, but not after each keystroke
  // (the box already shows what was typed, and resetting it moves the caret).
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
  }, [value]);

  const emit = () => onChange(ref.current?.innerHTML ?? '');

  return (
    <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800 focus-within:border-pink-500">
      <div className="flex gap-1 border-b border-slate-700 bg-slate-900/60 p-1" role="toolbar" aria-label={`${label} formatting`}>
        {COMMANDS.map((c) => (
          <button
            type="button"
            key={c.command}
            title={c.title}
            aria-label={c.title}
            // Keep the text selection: act on mousedown, before the box loses focus.
            onMouseDown={(e) => {
              e.preventDefault();
              document.execCommand(c.command);
              emit();
            }}
            className={`rounded px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 ${c.className}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        className="min-h-40 max-h-96 overflow-y-auto px-3 py-2 text-sm leading-relaxed focus:outline-none [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-6"
      />
    </div>
  );
}
