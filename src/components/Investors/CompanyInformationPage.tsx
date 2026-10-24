import { SEO, SITE_URL } from '../SEO';
import { InvestorPage, investorCrumbs } from './InvestorLayout';
import { companyInfo, companyInfoOrder, type CompanyBlock, type CompanyField } from '../../data/investors/companyInfo';

const PATH = '/investors/company';

function renderField({ label, value, href, subValue, subHref, caption }: CompanyField, key: number) {
  const lines = Array.isArray(value) ? value : [value];

  // People block: bold name on top, role caption underneath, no label.
  if (caption) {
    return (
      <div key={key} className="ir-field">
        <span className="ir-person-name">{value}</span>
        <span className="ir-person-role">{caption}</span>
      </div>
    );
  }

  return (
    <div key={key} className="ir-field">
      <span className="ir-field-label">{label}</span>
      {href ? (
        <a className="ir-field-value ir-field-link" href={href} target="_blank" rel="noopener noreferrer">
          {lines.map((line, i) => (
            <span key={i} className="ir-field-line">{line}</span>
          ))}
        </a>
      ) : (
        lines.map((line, i) => (
          <span key={i} className="ir-field-value ir-field-line">{line}</span>
        ))
      )}
      {subValue &&
        (subHref ? (
          <a className="ir-field-value ir-field-line ir-field-link" href={subHref}>{subValue}</a>
        ) : (
          <span className="ir-field-value ir-field-line">{subValue}</span>
        ))}
    </div>
  );
}

function renderInfoBlock(block: CompanyBlock) {
  return (
    <div key={block.title} className="ir-info-block">
      <h2>{block.title}</h2>
      <div className="ir-fields">{block.fields.map(renderField)}</div>
    </div>
  );
}

export function CompanyInformationPage() {
  return (
    <InvestorPage>
      <SEO
        title="Company Information | Nuren Group Limited (NRN) - Investor Relations"
        description="Nuren Group Limited (NRN) investor relation - company information, contact information, corporate structure, board members."
        canonical={`${SITE_URL}${PATH}`}
        breadcrumbs={investorCrumbs('Company Information', PATH)}
      />
      <div className="ir-card ir-card--padded ir-card--company">
        <h1 className="ir-banner-title">COMPANY INFORMATION</h1>
        <div className="ir-ci-grid">{companyInfoOrder.map((key) => renderInfoBlock(companyInfo[key]))}</div>
      </div>
    </InvestorPage>
  );
}
