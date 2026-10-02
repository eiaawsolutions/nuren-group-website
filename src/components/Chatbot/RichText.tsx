import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { parseRichText } from './markdownLite';
import type { Inline } from './markdownLite';

const LINK_CLS = 'font-medium text-nuren-pink underline underline-offset-2 hover:text-nuren-purple';

function renderInline(nodes: Inline[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (node.type) {
      case 'text':
        return node.text;
      case 'strong':
        return <strong key={key} className="font-semibold text-slate-900">{renderInline(node.children, key)}</strong>;
      case 'em':
        return <em key={key}>{renderInline(node.children, key)}</em>;
      case 'link':
        if (!node.external) {
          return <Link key={key} to={node.href} className={LINK_CLS}>{renderInline(node.children, key)}</Link>;
        }
        return node.href.startsWith('mailto:') ? (
          <a key={key} href={node.href} className={LINK_CLS}>{renderInline(node.children, key)}</a>
        ) : (
          <a key={key} href={node.href} target="_blank" rel="noopener noreferrer" className={LINK_CLS}>
            {renderInline(node.children, key)}
          </a>
        );
    }
  });
}

/** Renders one of Nura's replies: paragraphs, lists, bold and safe links. */
export const RichText = ({ text }: { text: string }) => {
  const blocks = useMemo(() => parseRichText(text), [text]);
  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        if (block.type === 'paragraph') {
          return <p key={i} className="whitespace-pre-wrap">{renderInline(block.children, `p${i}`)}</p>;
        }
        const items = block.items.map((item, j) => <li key={j}>{renderInline(item, `l${i}-${j}`)}</li>);
        return block.ordered ? (
          <ol key={i} className="list-decimal pl-5 space-y-1 marker:text-nuren-pink">{items}</ol>
        ) : (
          <ul key={i} className="list-disc pl-5 space-y-1 marker:text-nuren-pink">{items}</ul>
        );
      })}
    </div>
  );
};
