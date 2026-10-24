import { Helmet } from 'react-helmet-async';

export type Breadcrumb = { name: string; url: string };

export const SITE_URL = 'https://nurengroup.com';
// TODO: replace with a 1200x630 brand-card OG image. Logo is acceptable
// fallback — most platforms will crop/letterbox to fit.
const DEFAULT_OG = `${SITE_URL}/NurenGroup.jpg`;

export const SEO = ({ title, description, keywords, canonical, ogImage, breadcrumbs }: {
  title: string,
  description: string,
  keywords?: string,
  canonical?: string,
  ogImage?: string,
  breadcrumbs?: Breadcrumb[],
}) => {
  const canonicalUrl = canonical || `${SITE_URL}/`;
  const image = ogImage || DEFAULT_OG;

  // BreadcrumbList JSON-LD — Google shows breadcrumbs in the SERP snippet
  // and AI search engines use it to understand site hierarchy.
  const breadcrumbLd = breadcrumbs && breadcrumbs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      item: b.url.startsWith('http') ? b.url : `${SITE_URL}${b.url}`,
    })),
  } : null;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* hreflang — same English content serves MY (primary), SG, and the
          x-default fallback. Add `th` once Thai-language content exists. */}
      <link rel="alternate" hrefLang="en-MY" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en-SG" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Geo */}
      <meta name="geo.region" content="MY-10" />
      <meta name="geo.placename" content="Kuala Lumpur" />
      <meta name="geo.position" content="3.1390;101.6869" />
      <meta name="ICBM" content="3.1390, 101.6869" />

      {/* Distribution */}
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Nuren Group" />
      <meta property="og:locale" content="en_MY" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {breadcrumbLd && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      )}
    </Helmet>
  );
};
