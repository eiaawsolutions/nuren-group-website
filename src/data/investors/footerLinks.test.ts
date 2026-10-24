import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { FOOTER_MENU, FOOTER_SOCIALS, QUICKLINKS, usesInvestorFooter } from './footerLinks';

const sitemap = readFileSync(new URL('../../../public/sitemap.xml', import.meta.url), 'utf8');
const all = [...QUICKLINKS, ...FOOTER_MENU];

describe('investor footer links', () => {
  it('has the live site’s quicklinks, in its order', () => {
    expect(QUICKLINKS).toHaveLength(38);
    expect(QUICKLINKS.slice(0, 3).map((l) => l.label)).toEqual(['Mediahub', 'Enquiry', 'Motherhood Surveys']);
    expect(QUICKLINKS.at(-1)?.label).toBe('Malaysia Supermom');
    expect(new Set(QUICKLINKS.map((l) => l.label)).size).toBe(QUICKLINKS.length);
  });

  it('has the live site’s footer menu', () => {
    expect(FOOTER_MENU.map((l) => l.label)).toEqual(['About', 'Brands', 'Investors', 'Media Hub', 'Contact Us']);
  });

  it('only links out to clean https URLs', () => {
    const external = [...all.filter((l) => l.kind === 'external').map((l) => l.href), ...FOOTER_SOCIALS.map((s) => s.href)];
    expect(external.length).toBe(38 - 2 + 2);
    for (const href of external) {
      expect(href, href).toBe(href.trim());
      expect(new URL(href).protocol, href).toBe('https:');
    }
  });

  it('links to pages this site has (and indexes)', () => {
    for (const link of all.filter((l) => l.kind === 'page')) {
      expect(sitemap, link.href).toContain(`<loc>https://nurengroup.com${link.href}</loc>`);
    }
  });

  it('sends Enquiry and Contact Us to the Contact Us window', () => {
    const enquiry = all.filter((l) => l.kind === 'enquiry').map((l) => l.label);
    expect(enquiry).toEqual(['Enquiry', 'Contact Us']);
  });
});

describe('usesInvestorFooter', () => {
  it('is on for the investor section and its PDF viewer', () => {
    for (const p of ['/investors/company', '/investors/announcements/agm', '/investors/reports', '/investors/prospectus', '/pdf-viewer', '/investors']) {
      expect(usesInvestorFooter(p), p).toBe(true);
    }
  });

  it('is off for the rest of the site', () => {
    for (const p of ['/home', '/products', '/media-hub', '/careers', '/board-of-directors', '/investorsx', '/pdf-viewerx']) {
      expect(usesInvestorFooter(p), p).toBe(false);
    }
  });
});
