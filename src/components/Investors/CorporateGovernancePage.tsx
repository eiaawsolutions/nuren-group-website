import { Link, useParams } from 'react-router-dom';
import { SEO, SITE_URL } from '../SEO';
import { InvestorPage, investorCrumbs } from './InvestorLayout';
import { InlinePdfViewer } from './PdfViewer';
import { viewerHref } from './pdfSrc';
import { committeeCharters, governanceDocs, findGovernanceDoc } from '../../data/investors/governanceDocs.js';

const PATH = '/investors/corporate-governance';

type GovernanceDoc = { label: string; slug: string; pdflink: string };

function LinkBox({ heading, docs }: { heading: string; docs: GovernanceDoc[] }) {
  return (
    <div className="ir-linkbox">
      <h2>{heading}</h2>
      <div className="ir-links">
        {docs.map((doc) => (
          <Link key={doc.slug} to={viewerHref(doc.pdflink)}>
            {doc.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CorporateGovernancePage() {
  return (
    <InvestorPage>
      <SEO
        title="Corporate Governance | Nuren Group - Motherhood SuperApp, Kelabmama, Ibuencer"
        description="Investor Relations & Corporate Governance. Nuren Group provides parenting education and maternity wellness services"
        canonical={`${SITE_URL}${PATH}`}
        breadcrumbs={investorCrumbs('Corporate Governance', PATH)}
      />
      <div className="ir-card ir-card--governance">
        <h1>INVESTMENT &amp; GOVERNANCE</h1>
        {/* Heading text is verbatim from the investor site. */}
        <LinkBox heading="COMMITTE CHARTERS" docs={committeeCharters} />
        <LinkBox heading="CORPORATE GOVERNANCE DOCUMENTS" docs={governanceDocs} />
      </div>
    </InvestorPage>
  );
}

/** /investors/corporate-governance/:slug — the document in the same inline viewer. */
export function GovernanceDocPage() {
  const { slug = '' } = useParams();
  const doc = findGovernanceDoc(slug);
  const path = `${PATH}/${slug}`;
  const title = doc ? `Corporate Governance | Nuren Group - ${doc.label}` : 'Corporate Governance | Nuren Group';

  return (
    <>
      <SEO
        title={title}
        description={title}
        canonical={`${SITE_URL}${doc ? path : PATH}`}
        breadcrumbs={doc ? investorCrumbs(doc.label, path) : undefined}
        noindex={!doc}
      />
      <InlinePdfViewer src={doc ? doc.pdflink : ''} />
    </>
  );
}
