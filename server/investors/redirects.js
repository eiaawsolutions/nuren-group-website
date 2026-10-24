// Permanent redirects for URLs that moved when this site took over the Nuren
// investor site's pages. Three sources of old links:
//   - the investor site's own next.config redirects (company-information etc.)
//   - this site's previous investor hub and governance-documents pages
//   - live nurengroup.com pages this site has under another path.
// Shared with the React router so client-side navigation lands in the same
// place as the server's 301. No Node imports: the browser bundles this file.

// Old /investors/governance-documents/:docId ids → investor-site slugs.
export const LEGACY_GOVERNANCE_SLUGS = {
  'audit-risk-charter': 'audit-and-risk-committee-charter',
  'board-charter': 'board-charter',
  'nomination-remuneration-charter': 'nomination-and-remuneration-committee-charter',
  'anti-bribery-corruption': 'anti-bribery-and-corruption-policy',
  'diversity-policy': 'diversity-policy',
  'code-of-conduct': 'code-of-conduct',
  'ohs-policy': 'oh-and-s-policy',
  'communication-disclosure': 'communication-and-disclosure-policy',
  'risk-management': 'risk-management-policy',
  'governance-statement': 'corporate-governance-statement',
  'securities-trading': 'securities-trading-policy',
  'delegation-authority': 'delegation-of-authority-policy',
  'statement-values': 'statement-of-values',
};

const GOVERNANCE = '/investors/corporate-governance';

const EXACT = {
  '/investors': GOVERNANCE,
  '/investors/companyinformation': '/investors/company',
  '/investors/company-information': '/investors/company',
  '/investors/finance-reports': '/investors/reports',
  '/investors/governance-documents': GOVERNANCE,
  // The live nurengroup.com (the investor site's codebase) has these pages
  // under other paths; its investor footer links to them.
  '/mediahub': '/media-hub',
  '/brands/our-brands': '/products',
};

const OLD_DOC_PREFIX = '/investors/governance-documents/';

/** The new path for a legacy investor URL, or null if the path is current. */
export function legacyRedirect(pathname) {
  const p = String(pathname || '').toLowerCase().replace(/\/+$/, '') || '/';
  if (EXACT[p]) return EXACT[p];
  if (p.startsWith(OLD_DOC_PREFIX)) {
    const slug = LEGACY_GOVERNANCE_SLUGS[p.slice(OLD_DOC_PREFIX.length)];
    return slug ? `${GOVERNANCE}/${slug}` : GOVERNANCE;
  }
  return null;
}
