// The careers page's APPLY buttons. On live nurengroup.com they link to
// /enquiry?job=<position>, where the enquiry form opens as a "Job Application"
// with the subject "<position> Application" and a resume upload. Here the same
// link opens the Contact Us window as a job application with that line as the
// message; the form's attachment takes the resume.
import type { EnquiryValues } from '../Enquiry/enquiryClient';
import { JOB_LIMITS } from '../../../server/careers/validate.js';

export const applyHref = (position: string) => `/enquiry?job=${encodeURIComponent(position)}`;

export const applicationDraft = (position: string): Partial<EnquiryValues> => ({
  type: 'career',
  message: `${position} Application`,
});

/** The position named in a /enquiry?job= link (anyone can make one, so: one short line). */
export function jobFromSearch(search: string): string {
  return (new URLSearchParams(search).get('job') ?? '').replace(/\s+/g, ' ').trim().slice(0, JOB_LIMITS.position);
}
