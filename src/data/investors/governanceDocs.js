// Corporate governance documents (from the Nuren investor site's docsInfo.js).
// The PDFs live where the investor site keeps them, in its S3 bucket at
// corporate-governance/pdf/<slug>.pdf; the slug is also the page URL
// (/investors/corporate-governance/<slug>). Plain JS so the server redirects
// and the prerender script can import it too.
import { s3PdfUrl } from '../../../server/investors/validate.js';

const doc = (label, slug) => ({ label, slug, pdflink: s3PdfUrl('corporate-governance', slug) });

export const committeeCharters = [
  doc('Audit and Risk Committee Charter', 'audit-and-risk-committee-charter'),
  doc('Board Charter', 'board-charter'),
  doc('Nomination and Remuneration Committee Charter', 'nomination-and-remuneration-committee-charter'),
];

export const governanceDocs = [
  doc('Anti Bribery and Corruption Policy', 'anti-bribery-and-corruption-policy'),
  doc('Diversity Policy', 'diversity-policy'),
  doc('Code of Conduct', 'code-of-conduct'),
  doc('OH & S Policy', 'oh-and-s-policy'),
  doc('Communication and Disclosure Policy', 'communication-and-disclosure-policy'),
  doc('Risk Management Policy', 'risk-management-policy'),
  doc('Corporate Governance Statement', 'corporate-governance-statement'),
  doc('Securities Trading Policy', 'securities-trading-policy'),
  doc('Delegation of Authority Policy', 'delegation-of-authority-policy'),
  doc('Statement of Values', 'statement-of-values'),
];

export const allGovernanceDocs = [...committeeCharters, ...governanceDocs];

export function findGovernanceDoc(slug) {
  return allGovernanceDocs.find((d) => d.slug === slug) ?? null;
}
