import { describe, it, expect } from 'vitest';
import { applyHref, applicationDraft, jobFromSearch } from './apply';
import { ENQUIRY_TYPES, isCampaignType } from '../Enquiry/enquiryClient';

describe('APPLY', () => {
  it('links to /enquiry?job=<position>, as live does', () => {
    expect(applyHref('Marketing Executive (Events & Community)')).toBe('/enquiry?job=Marketing%20Executive%20(Events%20%26%20Community)');
  });

  it('round-trips the position through the link', () => {
    const position = 'Marketing Executive (Events & Community)';
    expect(jobFromSearch(applyHref(position).split('?')[1])).toBe(position);
  });

  it('opens the enquiry as a job application, named like live (“<position> Application”)', () => {
    const draft = applicationDraft('Marketing Intern');
    expect(draft).toEqual({ type: 'career', message: 'Marketing Intern Application' });
    expect(ENQUIRY_TYPES[draft.type as keyof typeof ENQUIRY_TYPES]).toBe('Job application');
    expect(isCampaignType(draft.type)).toBe(false);
  });

  it('keeps a hand-made link to a single, short line', () => {
    expect(jobFromSearch('job=a%0Ab')).toBe('a b');
    expect(jobFromSearch(`job=${'x'.repeat(500)}`)).toHaveLength(200);
    expect(jobFromSearch('other=1')).toBe('');
  });
});
