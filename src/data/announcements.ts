// Investor announcements — fetched live from Sanity (the CMS the finance team
// publishes through), NOT hardcoded like governanceDocs.ts. Finance creates each
// announcement in Sanity Studio (date, headline, document type, price-sensitive
// toggle, PDF upload) and clicks Publish — no developer, no redeploy. The browser
// reads the published list directly from Sanity's cached APICDN endpoint.
//
// projectId + dataset are PUBLIC Sanity identifiers (not secrets) and read access
// to the `production` dataset is public, so no token ships to the browser. They
// can be overridden at build time via VITE_SANITY_PROJECT_ID / VITE_SANITY_DATASET
// (set in .env or Railway build variables); the fallbacks below are filled in once
// when the Sanity project is created.

export interface Announcement {
  id: string; // Sanity _id
  date: string; // ISO datetime (releaseDate)
  headline: string;
  documentType: string;
  priceSensitive: boolean;
  pdfUrl: string; // resolved Sanity CDN asset URL ('' if no file attached)
  summary?: string;
  year: number; // derived from date
}

// Sanity project "nurengroup-cms" (org oIPHytvHX). projectId + dataset are PUBLIC
// identifiers, safe to commit. Overridable via VITE_SANITY_* at build time.
const PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID || 't0u4019v';
const DATASET = import.meta.env.VITE_SANITY_DATASET || 'production';
const API_VERSION = '2024-01-01';

const CACHE_KEY = 'nuren_announcements_cache';

// GROQ: newest-first, dereference the uploaded PDF asset to its permanent URL,
// default priceSensitive to false when the toggle was never set.
const QUERY = `*[_type == "announcement"] | order(releaseDate desc){
  "id": _id,
  "date": releaseDate,
  headline,
  documentType,
  "priceSensitive": coalesce(priceSensitive, false),
  "pdfUrl": pdf.asset->url,
  summary
}`;

// apicdn = Sanity's cached, CDN-backed read endpoint (fast, eventually-consistent
// within seconds of publish). Allowed by the server CSP connectSrc.
function endpoint(): string {
  const q = encodeURIComponent(QUERY);
  return `https://${PROJECT_ID}.apicdn.sanity.io/v${API_VERSION}/data/query/${DATASET}?query=${q}`;
}

function isConfigured(): boolean {
  return PROJECT_ID.length > 0;
}

function withYear(rows: Omit<Announcement, 'year'>[]): Announcement[] {
  return rows
    .filter((r) => r && r.id && r.headline)
    .map((r) => ({
      ...r,
      pdfUrl: r.pdfUrl || '',
      priceSensitive: Boolean(r.priceSensitive),
      year: Number.isFinite(new Date(r.date).getFullYear())
        ? new Date(r.date).getFullYear()
        : 0,
    }));
}

function readCache(): Announcement[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Announcement[]) : null;
  } catch {
    return null;
  }
}

function writeCache(rows: Announcement[]): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(rows));
  } catch {
    // sessionStorage can throw (private mode / quota) — caching is best-effort.
  }
}

export interface FetchResult {
  announcements: Announcement[];
  fromCache: boolean; // true when the live fetch failed and we fell back to cache
}

// Fetch the published announcements. On success, caches the result for the
// session. On failure, falls back to the last cached list (if any) so a transient
// CDN blip doesn't blank the page. Throws only when there is no live data AND no
// cache — the page then renders its graceful "view on NSX" error state.
export async function fetchAnnouncements(): Promise<FetchResult> {
  if (!isConfigured()) {
    const cached = readCache();
    if (cached) return { announcements: cached, fromCache: true };
    throw new Error('Sanity project is not configured.');
  }

  try {
    const res = await fetch(endpoint(), { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Sanity responded ${res.status}`);
    const body = (await res.json()) as { result?: Omit<Announcement, 'year'>[] };
    const announcements = withYear(body.result || []);
    writeCache(announcements);
    return { announcements, fromCache: false };
  } catch (err) {
    const cached = readCache();
    if (cached) return { announcements: cached, fromCache: true };
    throw err instanceof Error ? err : new Error('Failed to load announcements.');
  }
}

// Official NSX market-announcements page for Nuren Group (NRN) — the authoritative
// source, used as the graceful fallback link and in the <noscript> block.
export const NSX_ANNOUNCEMENTS_URL =
  'https://www.nsx.com.au/marketdata/company-directory/announcements/NRN/';
