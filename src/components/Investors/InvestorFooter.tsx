import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import '@fontsource-variable/jost';
import '@fontsource-variable/urbanist';
import './investors.css';
import { FOOTER_MENU, FOOTER_PHONE, FOOTER_SOCIALS, QUICKLINKS } from '../../data/investors/footerLinks';
import type { FooterLink } from '../../data/investors/footerLinks';

/**
 * The Nuren investor site's footer, as nurengroup.com shows it under every
 * investor page: the Quicklinks pills, then logo, menu and copyright, and the
 * social icons and phone number. Enquiry and Contact Us open this site's
 * Contact Us window; their href (/enquiry) does the same when opened directly.
 */
export function InvestorFooter({ onContactClick }: { onContactClick: () => void }) {
  const openEnquiry = (e: MouseEvent<HTMLAnchorElement>) => {
    // Let modified clicks (new tab / window) follow the href.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onContactClick();
  };

  const renderLink = (link: FooterLink) => {
    if (link.kind === 'external') {
      return (
        <a key={link.label} className="ir-urban" href={link.href} target="_blank" rel="noopener noreferrer">
          {link.label}
        </a>
      );
    }
    if (link.kind === 'enquiry') {
      return (
        <a key={link.label} className="ir-urban" href={link.href} onClick={openEnquiry}>
          {link.label}
        </a>
      );
    }
    return (
      <Link key={link.label} className="ir-urban" to={link.href}>
        {link.label}
      </Link>
    );
  };

  return (
    <footer className="ir-root ir-footer">
      <h3>Quicklinks</h3>
      <div className="ir-quicklinks">{QUICKLINKS.map(renderLink)}</div>

      <div className="ir-footer-bottom">
        <img className="ir-footer-logo" src="/investors/logo.svg" alt="NurenGroup logo" width={1295} height={438} />
        <div className="ir-footer-middle">
          <nav aria-label="Footer">{FOOTER_MENU.map(renderLink)}</nav>
          <p className="ir-urban">© {new Date().getFullYear()} Nuren Group | All Rights Reserved</p>
        </div>
        <div className="ir-footer-right">
          <div className="ir-footer-social">
            {FOOTER_SOCIALS.map((s) => (
              <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`Nuren Group on ${s.name}`}>
                <img src={s.icon} alt={s.name} width={20} height={20} />
              </a>
            ))}
          </div>
          <a href={FOOTER_PHONE.href}>{FOOTER_PHONE.label}</a>
        </div>
      </div>
    </footer>
  );
}
