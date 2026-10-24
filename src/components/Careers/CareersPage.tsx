import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import '@fontsource-variable/jost';
import './careers.css';
import { SEO, SITE_URL } from '../SEO';
import { isPlainClick } from '../clicks';
import { applyHref } from './apply';
import { useJobPositions, type JobPosition } from './useJobPositions';

const IMG = '/careers';
// The photo strip, in live's order.
const STRIP = ['career1.jpg', 'career2.jpg', 'career3.jpg', 'career5.jpg', 'career4.jpg'];
const COLLAPSED_HEIGHT = 70;

// Material Symbols "attach_money" and "distance" (Apache-2.0), the icons live
// loads from Google Fonts; inlined because the CSP only allows this site's fonts.
const MoneyIcon = () => (
  <svg viewBox="0 -960 960 960" width="24" height="24" fill="currentColor" aria-hidden="true">
    <path d="M441-120v-86q-53-12-91.5-46T293-348l74-30q15 48 44.5 73t77.5 25q41 0 69.5-18.5T587-356q0-35-22-55.5T463-458q-86-27-118-64.5T313-614q0-65 42-101t86-41v-84h80v84q50 8 82.5 36.5T651-650l-74 32q-12-32-34-48t-60-16q-44 0-67 19.5T393-614q0 33 30 52t104 40q69 20 104.5 63.5T667-358q0 71-42 108t-104 46v84h-80Z" />
  </svg>
);

const LocationIcon = () => (
  <svg viewBox="0 -960 960 960" width="24" height="24" fill="currentColor" aria-hidden="true">
    <path d="M307-113.5Q240-147 240-200q0-24 14.5-44.5T295-280l63 59q-9 4-19.5 9T322-200q13 16 60 28t98 12q51 0 98.5-12t60.5-28q-7-8-18-13t-21-9l62-60q28 16 43 36.5t15 45.5q0 53-67 86.5T480-80q-106 0-173-33.5ZM481-300q99-73 149-146.5T680-594q0-102-65-154t-135-52q-70 0-135 52t-65 154q0 67 49 139.5T481-300Zm-1 100Q339-304 269.5-402T200-594q0-71 25.5-124.5T291-808q40-36 90-54t99-18q49 0 99 18t90 54q40 36 65.5 89.5T760-594q0 94-69.5 192T480-200Zm0-320q33 0 56.5-23.5T560-600q0-33-23.5-56.5T480-680q-33 0-56.5 23.5T400-600q0 33 23.5 56.5T480-520Zm0-80Z" />
  </svg>
);

/**
 * A job description, cut to 70px with "Show More" / "Show Less" as on live.
 * The toggle only appears when there is more to show. The HTML comes from the
 * server, which sanitises it (server/careers/sanitize.js).
 */
function ExpandParagraph({ html, label }: { html: string; label: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (el) setOverflows(el.scrollHeight > COLLAPSED_HEIGHT);
  }, [html]);

  return (
    <div className="cr-description">
      <div
        ref={contentRef}
        className="cr-desc-content"
        style={{ height: overflows && !expanded ? `${COLLAPSED_HEIGHT}px` : 'auto' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {overflows && (
        <button
          type="button"
          className="cr-see-more"
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Show less' : 'Show more'} about ${label}`}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      )}
    </div>
  );
}

/**
 * The Nuren investor site's careers page, as live nurengroup.com shows it:
 * banner, team photo, photo strip and the open positions. APPLY opens the
 * Contact Us window as a job application (see apply.ts).
 */
export function CareersPage({ onApply }: { onApply: (position: string) => void }) {
  const jobs = useJobPositions();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const renderJob = (job: JobPosition) => (
    <article key={job.id} className="cr-pos">
      <h3 className="cr-job-title">{job.position}</h3>
      <div className="cr-tags">
        {job.tags.map((tag, i) => (
          <span key={i} className="cr-tag">{tag}</span>
        ))}
      </div>
      <ExpandParagraph html={job.description} label={job.position} />
      <div className="cr-bottom-info">
        <div className="cr-info">
          <MoneyIcon />
          <span className="sr-only">Salary: </span>
          {job.salary}
        </div>
        <div className="cr-info">
          <LocationIcon />
          <span className="sr-only">Location: </span>
          {job.location}
        </div>
      </div>
      <a
        className="cr-apply"
        href={applyHref(job.position)}
        aria-label={`Apply for ${job.position}`}
        onClick={(e) => {
          if (!isPlainClick(e)) return;
          e.preventDefault();
          onApply(job.position);
        }}
      >
        APPLY
      </a>
    </article>
  );

  return (
    <div className="cr-root">
      <SEO
        title="Careers | Nuren Group - Motherhood SuperApp, Kelabmama, Ibuencer"
        description="Careers @ Nuren Group - Motherhood Parenting SuperApp, Kelabmama.com, Ibuencer.com, Parentcraft, Superkids, Baby Fair, Motherhood Choice Award, MamaCubaTry"
        canonical={`${SITE_URL}/careers`}
        breadcrumbs={[
          { name: 'Home', url: '/home' },
          { name: 'Careers', url: '/careers' },
        ]}
      />

      <section className="cr-banner">
        <div className="cr-banner-text">
          {/* One heading on two lines; the space keeps "WORK WITH NUREN GROUP" readable to crawlers and screen readers. */}
          <h1>
            <span>WORK WITH</span>{' '}
            <span className="cr-pink">NUREN GROUP</span>
          </h1>
          <p>
            At Nuren Group, we believe in fostering innovation, collaboration, and growth. As a leading digital media and
            technology company in Malaysia, we're dedicated to empowering talents who are passionate about making an impact
            in the digital landscape.
          </p>
          <img src={`${IMG}/earth.png`} alt="" width={844} height={844} />
        </div>
      </section>

      <section className="cr-team">
        <img src={`${IMG}/team.jpg`} alt="our team" width={1563} height={1047} />
        <div className="cr-team-text">
          <h2>MEET OUR TEAM</h2>
          <p>
            Our team at Nuren Group is a dynamic blend of innovators, collaborators, experts, and passionate individuals
            dedicated to excellence. United by a shared commitment to innovation and collaboration, we thrive on pushing
            boundaries and delivering exceptional results. With diverse skills and expertise, we're shaping the future of
            digital media and technology. Join us and be part of a team that's making a difference.
          </p>
        </div>
      </section>

      <div className="cr-carousel">
        {STRIP.map((file) => (
          <img key={file} src={`${IMG}/${file}`} alt="" loading="lazy" />
        ))}
      </div>

      {jobs.length > 0 && (
        <section className="cr-positions" aria-labelledby="cr-open-positions">
          <h2 id="cr-open-positions">OPEN POSITIONS</h2>
          <div className="cr-position-list">{jobs.map(renderJob)}</div>
        </section>
      )}
    </div>
  );
}
