import type { MouseEvent } from 'react';

/** A plain left click; modified clicks (new tab / window) should follow the link instead. */
export const isPlainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
