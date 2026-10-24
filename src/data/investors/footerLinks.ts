// The Nuren investor site's footer links (quicklinks.js, navSetting.js and
// social_medias.js there), as nurengroup.com shows them under every investor
// page. Labels, order and outbound URLs are the live site's (with the stray
// spaces some of its URLs carry trimmed). The live site's own pages have other
// paths here: /mediahub is /media-hub, /brands/our-brands is /products, and
// /enquiry is this site's Contact Us window. server/investors/redirects.js
// sends the live paths to the pages here.

export type FooterLink = {
  label: string;
  href: string;
  /** page: a page on this site; external: opens in a new tab; enquiry: opens the Contact Us window. */
  kind: 'page' | 'external' | 'enquiry';
};

const page = (label: string, href: string): FooterLink => ({ label, href, kind: 'page' });
const external = (label: string, href: string): FooterLink => ({ label, href, kind: 'external' });
const enquiry = (label: string): FooterLink => ({ label, href: '/enquiry', kind: 'enquiry' });

const playlist = (label: string, list: string, si: string) =>
  external(label, `https://youtube.com/playlist?list=${list}&si=${si}`);

export const QUICKLINKS: FooterLink[] = [
  page('Mediahub', '/media-hub'),
  enquiry('Enquiry'),
  external('Motherhood Surveys', 'https://www.motherhood.com.my/events/motherhood-survey'),
  external('Motherhood Parenting SuperApp', 'https://www.motherhood.com.my/superapp/'),
  external('Motherhood Instagram', 'https://www.instagram.com/motherhood.com.my/'),
  external('Motherhood Facebook', 'https://www.facebook.com/motherhood.com.my'),
  external('Motherhood TikTok', 'https://www.tiktok.com/@motherhood.com.my'),
  external('Motherhood Malaysia', 'https://www.motherhood.com.my/home/'),
  external('Parenting Guide Malaysia', 'https://story.motherhood.com.my/'),
  external('Care+ Malaysia', 'https://www.motherhood.com.my/care/'),
  external('Care+ 小红书', 'https://www.xiaohongshu.com/user/profile/6502662c0000000002010e22'),
  external('Care+ Instagram', 'https://www.instagram.com/motherhoodcare_/'),
  external('Care+ TikTok', 'https://www.tiktok.com/@motherhoodcare'),
  external('KelabMama Malaysia', 'https://www.kelabmama.com/'),
  external('KelabMama Facebook', 'https://www.facebook.com/kelabmamamy/'),
  external('KelabMama Instagram', 'https://www.instagram.com/kelab_mama/?hl=en'),
  external('KelabMama TikTok', 'https://www.tiktok.com/@kelab_mama'),
  external('Ibuencer Malaysia', 'https://www.ibuencer.com/'),
  external('Ibuencer Instagram', 'https://www.instagram.com/explore/tags/ibuencer/'),
  external('New Mom Program', 'https://www.motherhood.com.my/events/newmom'),
  external('ParentCraft Class', 'https://www.motherhood.com.my/parentcraft/dashboard'),
  external('Superkids Class', 'https://www.motherhood.com.my/superkids/main'),
  external('Motherhood Choice Awards', 'https://www.motherhood.com.my/motherhood-award'),
  external('Promotions', 'https://www.motherhood.com.my/monthly-promotions'),
  external('BabyFair', 'https://www.motherhood.com.my/babyfair'),
  external('#MamaCubaTry', 'https://www.motherhood.com.my/mamacubatry/main'),
  playlist('AskMeDoctor! Season 6', 'PL1Wnpc9qYxULLAoGt0JDJMrJ8y5jh2zRJ', '1pEX4_tFoxUqDLUy'),
  playlist('AskMeDoctor! Season 5', 'PL1Wnpc9qYxUJyvWElOP3t9novpvqAvVeD', 'XO3iVPPqwWcg8sCo'),
  playlist('AskMeDoctor! Season 4', 'PL1Wnpc9qYxULtC7hUY5WbUKAFjY8BmoeO', 'ZkRgBQ6ymGgXLHw8'),
  playlist('AskMeDoctor! Season 3', 'PL1Wnpc9qYxUI9QhkC_WqSxd8ppISOeP0t', 'bKTr1sq12esJanPU'),
  playlist('AskMeDoctor! Season 2', 'PL1Wnpc9qYxUJd91nqwlhuXOfDI8GDxYnk', 'sTdgAbftDkiOs9PG'),
  playlist('AskMeDoctor! Season 1', 'PL1Wnpc9qYxUL4cf1ovNd7inK4YwYMRQgk', 'kcfD9mR4DCWvPq1h'),
  playlist('Money-Smart Mama', 'PL1Wnpc9qYxUIW6Qwt7cG1FYnOFJEXspS9', 'xOPZYvVqVAQ4RBaN'),
  playlist('Expert Explains', 'PL1Wnpc9qYxUKwJB4vfJYoflN2GFKUQG4S', 't6-257q9ipkRcOBW'),
  playlist('Tahukah Si Manja?', 'PL1Wnpc9qYxUKYD1fb3fXKwEhfI5e9P6X-', 'MbdpQDfGNqfrIXKv'),
  playlist('Motherhood Challenge', 'PL1Wnpc9qYxUK9PZ9-1zu-15TdvttNm5ZM', '-rBzXjUGqMqUHNmx'),
  playlist('Our Untold Story', 'PL1Wnpc9qYxUKht2SJ1XjUKKjOcsI0dKfp', '5m3PqWbbdBIzdq-n'),
  playlist('Malaysia Supermom', 'PL1Wnpc9qYxULNeD60GPvT2sJEYI6wX3WS', 'dfyAx0S0DuqeO1V_'),
];

/** The bottom row's menu: the investor site's top-level navigation. */
export const FOOTER_MENU: FooterLink[] = [
  page('About', '/home'),
  page('Brands', '/products'),
  page('Investors', '/investors/corporate-governance'),
  page('Media Hub', '/media-hub'),
  enquiry('Contact Us'),
];

export const FOOTER_SOCIALS = [
  { name: 'facebook', href: 'https://www.facebook.com/NurenGroup/', icon: '/investors/icon/facebook.svg' },
  { name: 'linkedin', href: 'https://www.linkedin.com/company/nurengroup/', icon: '/investors/icon/linkedin.svg' },
];

export const FOOTER_PHONE = { label: '+603 7625 5605', href: 'tel:+60376255605' };

/** The investor section and its PDF viewer carry the investor site's footer; the rest of the site keeps its own. */
export const usesInvestorFooter = (pathname: string) => /^\/(investors|pdf-viewer)(\/|$)/i.test(pathname);
