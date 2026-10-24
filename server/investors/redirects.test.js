import { describe, it, expect } from 'vitest';
import { legacyRedirect, LEGACY_GOVERNANCE_SLUGS } from './redirects.js';
import { allGovernanceDocs } from '../../src/data/investors/governanceDocs.js';

// The ids this site's old /investors/governance-documents/:docId pages used.
const OLD_GOVERNANCE_IDS = [
  'audit-risk-charter', 'board-charter', 'nomination-remuneration-charter',
  'anti-bribery-corruption', 'diversity-policy', 'code-of-conduct', 'ohs-policy',
  'communication-disclosure', 'risk-management', 'governance-statement',
  'securities-trading', 'delegation-authority', 'statement-values',
];

describe('legacyRedirect', () => {
  it('sends the old investors hub to corporate governance, as the investor site did', () => {
    expect(legacyRedirect('/investors')).toBe('/investors/corporate-governance');
    expect(legacyRedirect('/investors/')).toBe('/investors/corporate-governance');
  });

  it('keeps the investor site redirects', () => {
    expect(legacyRedirect('/investors/companyinformation')).toBe('/investors/company');
    expect(legacyRedirect('/investors/company-information')).toBe('/investors/company');
    expect(legacyRedirect('/investors/finance-reports')).toBe('/investors/reports');
  });

  it('matches regardless of case, like the investor site', () => {
    expect(legacyRedirect('/Investors/CompanyInformation')).toBe('/investors/company');
  });

  it('maps every old governance document page to its new slug', () => {
    expect(legacyRedirect('/investors/governance-documents')).toBe('/investors/corporate-governance');
    for (const id of OLD_GOVERNANCE_IDS) {
      const target = legacyRedirect(`/investors/governance-documents/${id}`);
      expect(target, id).toMatch(/^\/investors\/corporate-governance\/[a-z-]+$/);
    }
  });

  it('only points at governance documents that exist', () => {
    const slugs = new Set(allGovernanceDocs.map((d) => d.slug));
    expect(Object.keys(LEGACY_GOVERNANCE_SLUGS).sort()).toEqual([...OLD_GOVERNANCE_IDS].sort());
    for (const slug of Object.values(LEGACY_GOVERNANCE_SLUGS)) expect(slugs.has(slug), slug).toBe(true);
  });

  it('sends an unknown old document id to the governance list', () => {
    expect(legacyRedirect('/investors/governance-documents/nope')).toBe('/investors/corporate-governance');
  });

  it('leaves current pages alone', () => {
    for (const p of ['/investors/company', '/investors/announcements', '/investors/reports', '/investors/corporate-governance', '/investors/corporate-governance/board-charter', '/home', '/']) {
      expect(legacyRedirect(p), p).toBeNull();
    }
  });
});
