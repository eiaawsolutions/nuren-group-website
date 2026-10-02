// A deliberately small markdown subset for Nura's chat bubbles: paragraphs,
// bullet and numbered lists, **bold**, *emphasis*, and links (markdown links,
// bare https URLs, emails, and this site's own paths such as /careers).
// It returns plain data — never HTML — so React escapes every string, and
// link targets go through safeHref() so a reply can't produce javascript: links.

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'strong'; children: Inline[] }
  | { type: 'em'; children: Inline[] }
  | { type: 'link'; href: string; external: boolean; children: Inline[] };

export type Block =
  | { type: 'paragraph'; children: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] };

// Top-level site sections Nura may mention; keep in step with the routes in App.tsx.
const SITE_SECTIONS = ['home', 'ecosystem', 'products', 'investors', 'media-hub', 'board-of-directors', 'careers'];

const INLINE_RE = new RegExp(
  [
    String.raw`\*\*(?<strong>[^*\n]+?)\*\*`,
    String.raw`(?<!\*)\*(?<em>[^*\s][^*\n]*?)(?<!\s)\*(?!\*)`,
    String.raw`\[(?<linkText>[^\]\n]+)\]\((?<linkHref>[^)\s]+)\)`,
    String.raw`(?<url>https?:\/\/[^\s<>()\[\]]+)`,
    String.raw`(?<email>[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})`,
    // A site path only counts after whitespace, an opening bracket, a colon or
    // a Chinese character — so "and/or" and "RM5K/month" stay plain text.
    String.raw`(?<=^|[\s(（:：一-鿿])(?<path>\/(?:${SITE_SECTIONS.join('|')})(?:\/[a-z0-9-]+)*\/?)(?![\w/-])`,
  ].join('|'),
  'g',
);

const TRAILING_PUNCTUATION_RE = /[.,;:!?'"」』。，、！？]+$/;
const BULLET_RE = /^\s*[-*•]\s+(.*)$/;
const ORDERED_RE = /^\s*\d+[.)]\s+(.*)$/;
const HEADING_RE = /^\s*#{1,6}\s+(.*)$/;

const text = (value: string): Inline => ({ type: 'text', text: value });

/** Allow only this site's paths, http(s) and mailto; everything else is dropped. */
export function safeHref(href: string): { href: string; external: boolean } | null {
  const target = href.trim();
  if (/^\/(?!\/)/.test(target)) return { href: target, external: false };
  if (/^https?:\/\/[^\s]+$/i.test(target)) return { href: target, external: true };
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(target)) return { href: target, external: true };
  return null;
}

function parseInline(source: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  // matchAll clones the regex, so the recursive calls below don't share lastIndex.
  for (const match of source.matchAll(INLINE_RE)) {
    const groups = match.groups ?? {};
    if (match.index > last) out.push(text(source.slice(last, match.index)));

    if (groups.strong !== undefined) {
      out.push({ type: 'strong', children: parseInline(groups.strong) });
    } else if (groups.em !== undefined) {
      out.push({ type: 'em', children: parseInline(groups.em) });
    } else if (groups.linkText !== undefined) {
      const safe = safeHref(groups.linkHref);
      out.push(safe ? { type: 'link', ...safe, children: [text(groups.linkText)] } : text(groups.linkText));
    } else if (groups.url !== undefined) {
      const url = groups.url.replace(TRAILING_PUNCTUATION_RE, '');
      out.push({ type: 'link', href: url, external: true, children: [text(url)] });
      if (url.length < groups.url.length) out.push(text(groups.url.slice(url.length)));
    } else if (groups.email !== undefined) {
      out.push({ type: 'link', href: `mailto:${groups.email}`, external: true, children: [text(groups.email)] });
    } else if (groups.path !== undefined) {
      out.push({ type: 'link', href: groups.path, external: false, children: [text(groups.path)] });
    }
    last = match.index + match[0].length;
  }
  if (last < source.length) out.push(text(source.slice(last)));
  return out;
}

export function parseRichText(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: Inline[][] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', children: parseInline(paragraph.join('\n')) });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push({ type: 'list', ...list });
    list = null;
  };

  for (const line of source.replace(/\r\n?/g, '\n').split('\n')) {
    const bullet = BULLET_RE.exec(line);
    const numbered = bullet ? null : ORDERED_RE.exec(line);
    const heading = bullet || numbered ? null : HEADING_RE.exec(line);

    if (!line.trim()) {
      flushParagraph();
      flushList();
    } else if (bullet || numbered) {
      const ordered = Boolean(numbered);
      flushParagraph();
      if (list && list.ordered !== ordered) flushList();
      list ??= { ordered, items: [] };
      list.items.push(parseInline((bullet ?? numbered)![1]));
    } else if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'paragraph', children: [{ type: 'strong', children: parseInline(heading[1]) }] });
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}
