import { useMemo, useState } from 'react';
import { SEO, SITE_URL } from '../SEO';
import { InvestorPage, investorCrumbs } from './InvestorLayout';
import { formatAnnouncementDate, formatAnnouncementTime } from './format';
import { viewerHref } from './pdfSrc';
import { useInvestorList, type InvestorCollection, type InvestorRecord } from './useInvestorList';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function PdfIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 2h8l4 4v16H6V2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 2v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function renderRow(item: InvestorRecord) {
  // Reports store their heading in `title`, announcements in `headline`.
  const heading = item.title || item.headline || '';
  return (
    <div key={item.id} className="ir-row">
      <div className="ir-code">
        <span className="ir-ticker">NRN</span>
      </div>
      <div className="ir-body">
        <a className="ir-headline" href={viewerHref(item.url)} target="_blank" rel="noopener noreferrer">
          <PdfIcon />
          <span>{heading}</span>
        </a>
        {item.description && <p className="ir-desc">{item.description}</p>}
      </div>
      <div className="ir-date">
        <span className="ir-date-main">{formatAnnouncementDate(item.date)}</span>
        <span className="ir-time">{formatAnnouncementTime(item.date)}</span>
      </div>
    </div>
  );
}

function Pager({ page, totalPages, onPage, pageSize, onPageSize }: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  pageSize: number;
  onPageSize: (size: number) => void;
}) {
  const atStart = page <= 1;
  const atEnd = page >= totalPages;
  return (
    <div className="ir-pager">
      <button className="ir-pg-btn" onClick={() => onPage(1)} disabled={atStart} aria-label="First page">&#9198;</button>
      <button className="ir-pg-btn" onClick={() => onPage(page - 1)} disabled={atStart} aria-label="Previous page">&#9664;</button>
      <span className="ir-pg-count">{page}/{totalPages}</span>
      <button className="ir-pg-btn" onClick={() => onPage(page + 1)} disabled={atEnd} aria-label="Next page">&#9654;</button>
      <button className="ir-pg-btn" onClick={() => onPage(totalPages)} disabled={atEnd} aria-label="Last page">&#9199;</button>
      <select
        className="ir-pg-size"
        value={pageSize}
        onChange={(e) => onPageSize(Number(e.target.value))}
        aria-label="Rows per page"
      >
        {PAGE_SIZE_OPTIONS.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </div>
  );
}

/** The NSX-style Code / Headline / Release Date table with its pager. */
function RecordsPage({ collection, heading, title, description, path, crumb }: {
  collection: InvestorCollection;
  heading: string;
  title: string;
  description: string;
  path: string;
  crumb: string;
}) {
  const items = useInvestorList(collection);
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const rows = useMemo(() => items.slice((current - 1) * pageSize, current * pageSize), [items, current, pageSize]);

  return (
    <InvestorPage>
      <SEO title={title} description={description} canonical={`${SITE_URL}${path}`} breadcrumbs={investorCrumbs(crumb, path)} />
      <div className="ir-card ir-card--padded ir-card--wide">
        <h1 className="ir-banner-title">{heading}</h1>

        <Pager
          page={current}
          totalPages={totalPages}
          onPage={(p) => setPage(Math.min(Math.max(1, p), totalPages))}
          pageSize={pageSize}
          onPageSize={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />

        <div className="ir-table">
          <div className="ir-head">
            <span className="ir-code">Code</span>
            <span className="ir-body">Headline</span>
            <span className="ir-date">Release Date</span>
          </div>
          {rows.length === 0 ? (
            <p className="ir-empty">There are no records available.</p>
          ) : (
            rows.map(renderRow)
          )}
        </div>
      </div>
    </InvestorPage>
  );
}

export function AnnouncementsPage() {
  return (
    <RecordsPage
      collection="announcements"
      heading="ANNOUNCEMENTS"
      title="Announcements | Nuren Group Limited (NSX:NRN) - Investor Relations"
      description="Announcements for Nuren Group Limited (NSX:NRN). Market announcements and disclosures filed with the NSX."
      path="/investors/announcements"
      crumb="Announcements"
    />
  );
}

export function FinancialReportsPage() {
  return (
    <RecordsPage
      collection="financial-reports"
      heading="FINANCIAL REPORTS"
      title="Financial Reports | Nuren Group Limited (NSX:NRN) - Investor Relations"
      description="Financial Reports for Nuren Group Limited (NSX:NRN). Quarterly, half-yearly, preliminary and annual reports filed with the NSX."
      path="/investors/reports"
      crumb="Financial Reports"
    />
  );
}
