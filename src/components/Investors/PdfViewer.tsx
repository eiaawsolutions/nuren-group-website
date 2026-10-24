import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SEO, SITE_URL } from '../SEO';
import { pdfEmbedSrc } from './pdfSrc';
import './investors.css';

/**
 * The investor site's inline PDF viewer: the document is embedded with the
 * browser viewer's toolbar hidden (#toolbar=0&navpanes=0), and right-click and
 * Ctrl/Cmd+P / +S are suppressed on the page. This discourages but cannot
 * prevent saving or printing. Only this site's own PDFs are embedded.
 */
export function InlinePdfViewer({ src }: { src: string }) {
  useEffect(() => {
    window.scrollTo(0, 0);
    const blockMenu = (e: MouseEvent) => e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => {
      const key = (e.key || '').toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (key === 'p' || key === 's')) e.preventDefault();
    };
    document.addEventListener('contextmenu', blockMenu);
    document.addEventListener('keydown', blockKeys);
    return () => {
      document.removeEventListener('contextmenu', blockMenu);
      document.removeEventListener('keydown', blockKeys);
    };
  }, []);

  const embedSrc = pdfEmbedSrc(src);

  return (
    <div className="ir-root ir-pdf-viewer">
      <div className="ir-pv-frame">
        {embedSrc ? (
          <iframe className="ir-pv-document" src={embedSrc} title="Document viewer" />
        ) : (
          <p className="ir-pv-fallback">Document not found.</p>
        )}
      </div>
    </div>
  );
}

/** /pdf-viewer?src=/announcements-pdfs/<file>.pdf — used by the announcement and report tables. */
export function PdfViewerPage() {
  const [params] = useSearchParams();
  return (
    <>
      <SEO
        title="Document | Nuren Group Limited (NSX:NRN) - Investor Relations"
        description="Nuren Group Limited (NSX:NRN) investor document."
        canonical={`${SITE_URL}/pdf-viewer`}
        noindex
      />
      <InlinePdfViewer src={params.get('src') || ''} />
    </>
  );
}
