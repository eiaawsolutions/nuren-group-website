import { describe, it, expect } from 'vitest';
import { parseRichText, safeHref } from './markdownLite';

const text = (value: string) => ({ type: 'text', text: value });

describe('parseRichText — blocks', () => {
  it('turns plain text into one paragraph', () => {
    expect(parseRichText('Hello there')).toEqual([{ type: 'paragraph', children: [text('Hello there')] }]);
  });

  it('splits paragraphs on blank lines but keeps single line breaks inside one', () => {
    expect(parseRichText('Line one\nline two\n\nNext para')).toEqual([
      { type: 'paragraph', children: [text('Line one\nline two')] },
      { type: 'paragraph', children: [text('Next para')] },
    ]);
  });

  it('groups "- ", "* " and "• " lines into a bullet list', () => {
    expect(parseRichText('- Content\n* KOL\n• Sampling')).toEqual([
      { type: 'list', ordered: false, items: [[text('Content')], [text('KOL')], [text('Sampling')]] },
    ]);
  });

  it('groups numbered lines into an ordered list', () => {
    expect(parseRichText('1. Brief\n2) Plan')).toEqual([
      { type: 'list', ordered: true, items: [[text('Brief')], [text('Plan')]] },
    ]);
  });

  it('handles a lead-in sentence, a list, and a closing sentence', () => {
    const blocks = parseRichText('Two ideas:\n- Content\n- KOL\nWhich fits better?');
    expect(blocks.map((b) => b.type)).toEqual(['paragraph', 'list', 'paragraph']);
  });

  it('renders a stray markdown heading as a bold line instead of literal #', () => {
    expect(parseRichText('## Our platforms')).toEqual([
      { type: 'paragraph', children: [{ type: 'strong', children: [text('Our platforms')] }] },
    ]);
  });
});

describe('parseRichText — inline', () => {
  const inline = (source: string) => {
    const [block] = parseRichText(source);
    if (block.type !== 'paragraph') throw new Error('expected a paragraph');
    return block.children;
  };

  it('renders **bold**', () => {
    expect(inline('Tap **Talk to our team** below')).toEqual([
      text('Tap '),
      { type: 'strong', children: [text('Talk to our team')] },
      text(' below'),
    ]);
  });

  it('works with Chinese punctuation around bold', () => {
    expect(inline('请点击 **Talk to our team**。')).toEqual([
      text('请点击 '),
      { type: 'strong', children: [text('Talk to our team')] },
      text('。'),
    ]);
  });

  it('leaves unclosed ** as literal text', () => {
    expect(inline('Use **bold carefully')).toEqual([text('Use **bold carefully')]);
  });

  it('renders *emphasis* but not arithmetic', () => {
    expect(inline('It *really* works')).toEqual([
      text('It '),
      { type: 'em', children: [text('really')] },
      text(' works'),
    ]);
    expect(inline('5 * 3 * 2')).toEqual([text('5 * 3 * 2')]);
  });

  it('links known site paths and leaves the trailing full stop outside', () => {
    expect(inline('See /careers.')).toEqual([
      text('See '),
      { type: 'link', href: '/careers', external: false, children: [text('/careers')] },
      text('.'),
    ]);
    expect(inline('Visit /investors/governance-documents for details')[1]).toEqual({
      type: 'link',
      href: '/investors/governance-documents',
      external: false,
      children: [text('/investors/governance-documents')],
    });
  });

  it('does not link paths that are not site sections', () => {
    expect(inline('RM5K /month and and/or')).toEqual([text('RM5K /month and and/or')]);
  });

  it('links bare https URLs without swallowing trailing punctuation', () => {
    expect(inline('Try https://www.ibuencer.com.')).toEqual([
      text('Try '),
      { type: 'link', href: 'https://www.ibuencer.com', external: true, children: [text('https://www.ibuencer.com')] },
      text('.'),
    ]);
  });

  it('links email addresses', () => {
    expect(inline('Email admin@nurengroup.com.')).toEqual([
      text('Email '),
      { type: 'link', href: 'mailto:admin@nurengroup.com', external: true, children: [text('admin@nurengroup.com')] },
      text('.'),
    ]);
  });

  it('renders markdown links with safe targets', () => {
    expect(inline('[our careers page](/careers)')).toEqual([
      { type: 'link', href: '/careers', external: false, children: [text('our careers page')] },
    ]);
  });

  it('drops the link but keeps the text for unsafe targets', () => {
    expect(inline('[click](javascript:alert(1))')).toEqual([text('click'), text(')')]);
  });

  it('allows links inside bold', () => {
    expect(inline('**/careers**')).toEqual([
      {
        type: 'strong',
        children: [{ type: 'link', href: '/careers', external: false, children: [text('/careers')] }],
      },
    ]);
  });
});

describe('safeHref', () => {
  it('accepts site paths, http(s) and mailto', () => {
    expect(safeHref('/careers')).toEqual({ href: '/careers', external: false });
    expect(safeHref('https://kelabmama.com')).toEqual({ href: 'https://kelabmama.com', external: true });
    expect(safeHref('mailto:admin@nurengroup.com')).toEqual({ href: 'mailto:admin@nurengroup.com', external: true });
  });

  it('rejects script, data and protocol-relative targets', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref('data:text/html,hi')).toBeNull();
    expect(safeHref('//evil.example')).toBeNull();
  });
});
