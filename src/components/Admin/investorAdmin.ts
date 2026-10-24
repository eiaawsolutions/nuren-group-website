// Plain helpers for the admin's Announcements and Finance Reports tabs
// (InvestorRecordsPanel), kept apart from the JSX so they can be tested.
import type { InvestorCollection, InvestorRecord } from '../Investors/useInvestorList';

export type RecordDraft = Omit<InvestorRecord, 'id'> & { id?: string };

// Wording follows the Nuren investor site's admin pages.
export const ADMIN_COPY: Record<InvestorCollection, {
  title: string;
  add: string;
  view: string;
  viewHref: string;
  noun: string;
}> = {
  announcements: {
    title: 'Announcements',
    add: 'Add New Announcement',
    view: 'View Announcements Page',
    viewHref: '/investors/announcements',
    noun: 'announcement',
  },
  'financial-reports': {
    title: 'Finance Reports',
    add: 'Add New Report',
    view: 'View Finance Reports Page',
    viewHref: '/investors/reports',
    noun: 'report',
  },
};

const pad = (n: number) => String(n).padStart(2, '0');

/** `YYYY-MM-DDTHH:mm:ss` in local time, the value a datetime-local input takes. */
export function toDateTimeLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function emptyRecord(collection: InvestorCollection, now = new Date()): RecordDraft {
  const date = toDateTimeLocal(now);
  if (collection === 'announcements') {
    return { code: '', category: '', headline: '', description: '', date, priceSensitive: false, url: '', active: true };
  }
  return { code: '', category: '', title: '', description: '', date, priceSensitive: false, type: 'file', url: '', active: true };
}

/** Plain-text, case-insensitive search over the fields the investor site searched. */
export function matchesSearch(record: Partial<InvestorRecord>, collection: InvestorCollection, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const fields = collection === 'announcements'
    ? [record.headline, record.description, record.code]
    : [record.title];
  return fields.some((v) => (v || '').toLowerCase().includes(q));
}
