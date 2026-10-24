import { useEffect, useState } from 'react';
import { byReleaseDate } from '../../../server/investors/validate.js';
import announcementsSeed from '../../data/investors/announcements.seed.json';
import reportsSeed from '../../data/investors/financial-reports.seed.json';

export interface InvestorRecord {
  id: string;
  code?: string;
  category?: string;
  headline?: string;
  title?: string;
  description?: string;
  date: string;
  priceSensitive?: boolean;
  type?: 'file' | 'link';
  url: string;
  active?: boolean;
  sortOrder?: number;
  slug?: string;
}

export type InvestorCollection = 'announcements' | 'financial-reports';

const SOURCES: Record<InvestorCollection, { endpoint: string; seed: InvestorRecord[] }> = {
  announcements: { endpoint: '/api/getAnnouncements', seed: announcementsSeed as InvestorRecord[] },
  'financial-reports': { endpoint: '/api/getFinancialReport', seed: reportsSeed as InvestorRecord[] },
};

const visible = (rows: InvestorRecord[]) => rows.filter((r) => r.active !== false).sort(byReleaseDate);

/**
 * The public list for a collection. It starts from the seed bundled at build
 * time, so the prerendered HTML (what crawlers read) and `npm run dev` show
 * the full table, then swaps in the live list the admin edits. If the live
 * fetch fails, the seed stays on screen. `loaded` turns true once the live
 * list (or its failure) is in, so a page can tell "not found" from "not yet".
 */
export function useInvestorRecords(collection: InvestorCollection): { items: InvestorRecord[]; loaded: boolean } {
  const { endpoint, seed } = SOURCES[collection];
  const [items, setItems] = useState<InvestorRecord[]>(() => visible(seed));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(endpoint, { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.success && Array.isArray(json.data?.data)) setItems(json.data.data);
      })
      .catch(() => {
        // Keep the bundled list.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  return { items, loaded };
}

export function useInvestorList(collection: InvestorCollection): InvestorRecord[] {
  return useInvestorRecords(collection).items;
}
