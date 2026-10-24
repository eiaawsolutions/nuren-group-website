import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SEO, SITE_URL } from '../SEO';
import { InvestorPage, investorCrumbs } from './InvestorLayout';
import { formatAnnouncementDate, formatAnnouncementTime } from './format';
import { InlinePdfViewer } from './PdfViewer';
import { RECORD_PATHS, recordHref } from './pdfSrc';
import { useInvestorList, useInvestorRecords, type InvestorCollection, type InvestorRecord } from './useInvestorList';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Reports store their heading in `title`, announcements in `headline`.
const headingOf = (item: InvestorRecord) => item.title || item.headline || '';

function PdfIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 2h8l4 4v16H6V2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 2v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function renderRow(collection: InvestorCollection, item: InvestorRecord) {
  const heading = headingOf(item);
  const { href, external } = recordHref(collection, item);
  const content = (
    <>
      <PdfIcon />
      <span>{heading}</span>
    </>
  );
  return (
    <div key={item.id} className="ir-row">
      <div className="ir-code">
        <span className="ir-ticker">NRN</span>
      </div>
      <div className="ir-body">
        {external ? (
          <a className="ir-headline" href={href} target="_blank" rel="noopener noreferrer">{content}</a>
        ) : (
          <Link className="ir-headline" to={href}>{content}</Link>
        )}
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
            rows.map((item) => renderRow(collection, item))
          )}
        </div>
      </div>
    </InvestorPage>
  );
}

// Titles and descriptions follow the live investor site (nurengroup.com).
export function AnnouncementsPage() {
  return (
    <RecordsPage
      collection="announcements"
      heading="ANNOUNCEMENTS"
      title="Announcements | Nuren Group Limited (NRN) - Investor Relations"
      description="Nuren Group Limited (NRN) investor relation - announcements to shareholders."
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
      title="Financial Reports | Nuren Group Limited (NRN) - Investor Relations"
      description="Nuren Group Limited (NRN) investor relation - annual reports, audited financial statement, interim management account."
      path="/investors/reports"
      crumb="Financial Reports"
    />
  );
}

/**
 * /investors/announcements/:slug and /investors/reports/:slug: one document
 * in the inline viewer, as on the investor site. Records added in the admin
 * after the build are found once the live list has loaded.
 */
function RecordDocPage({ collection, listName }: { collection: InvestorCollection; listName: string }) {
  const { slug = '' } = useParams();
  const { items, loaded } = useInvestorRecords(collection);
  const record = items.find((r) => r.slug === slug);
  const path = `${RECORD_PATHS[collection]}/${slug}`;

  if (!record) {
    return (
      <>
        <SEO title={`${listName} | Nuren Group Limited (NRN)`} description={listName} canonical={`${SITE_URL}${RECORD_PATHS[collection]}`} noindex />
        {loaded ? <InlinePdfViewer src="" /> : <div className="ir-root ir-pdf-viewer" />}
      </>
    );
  }

  const heading = headingOf(record);
  return (
    <>
      <SEO
        title={`${heading} | Nuren Group Limited (NSX:NRN)`}
        description={record.description || heading}
        canonical={`${SITE_URL}${path}`}
        breadcrumbs={[...investorCrumbs(listName, RECORD_PATHS[collection]), { name: heading, url: path }]}
      />
      <InlinePdfViewer src={record.url} title={heading} />
    </>
  );
}

export function AnnouncementDocPage() {
  return <RecordDocPage collection="announcements" listName="Announcements" />;
}

export function FinancialReportDocPage() {
  return <RecordDocPage collection="financial-reports" listName="Financial Reports" />;
}
