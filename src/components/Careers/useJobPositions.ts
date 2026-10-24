import { useEffect, useState } from 'react';
import seed from '../../data/careers/job-positions.seed.json';

export interface JobPosition {
  id: string;
  position: string;
  /** HTML, sanitised by the server (server/careers/sanitize.js) and in the seed. */
  description: string;
  tags: string[];
  salary: string;
  location: string;
  open: boolean;
}

const openOnly = (jobs: JobPosition[]) => jobs.filter((job) => job.open);

/**
 * The open positions. Starts from the seed bundled at build time, so the
 * prerendered HTML and `npm run dev` show them, then swaps in the list the
 * admin edits. If that fetch fails, the seed stays on screen.
 */
export function useJobPositions(): JobPosition[] {
  const [jobs, setJobs] = useState<JobPosition[]>(() => openOnly(seed as JobPosition[]));

  useEffect(() => {
    let cancelled = false;
    fetch('/api/getJobPosition', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.success && Array.isArray(json.data?.data)) setJobs(openOnly(json.data.data));
      })
      .catch(() => {
        // Keep the bundled list.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return jobs;
}
