import { useEffect } from 'react';
import type { ReactNode } from 'react';
import '@fontsource-variable/jost';
import '@fontsource-variable/urbanist';
import './investors.css';

/** The investor pages' grey page with the city skyline at the foot (as on the investor site). */
export function InvestorPage({ children }: { children: ReactNode }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="ir-root ir-page">
      {children}
      <CitiesSkyline />
    </div>
  );
}

export function CitiesSkyline() {
  return <div className="ir-skyline" aria-hidden="true" />;
}

/** Breadcrumbs shared by every investor page's JSON-LD. */
export const investorCrumbs = (name: string, url: string) => [
  { name: 'Home', url: '/home' },
  { name: 'Investors', url: '/investors/corporate-governance' },
  { name, url },
];
