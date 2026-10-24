import { describe, it, expect } from 'vitest';
import seed from './job-positions.seed.json';
import { validateJob } from '../../../server/careers/validate.js';
import { sanitizeJobDescription } from '../../../server/careers/sanitize.js';

describe('job positions seed (imported from live nurengroup.com)', () => {
  it('has unique ids', () => {
    expect(new Set(seed.map((j) => j.id)).size).toBe(seed.length);
  });

  it('holds only valid, already-sanitised positions, since the page renders descriptions as HTML', () => {
    for (const { id, ...job } of seed) {
      const { value, errors } = validateJob(job, { sanitize: sanitizeJobDescription });
      expect(errors, id).toEqual({});
      expect(value, id).toEqual(job);
    }
  });

  it('has the four positions live shows as open, in live order', () => {
    expect(seed.filter((j) => j.open).map((j) => j.position)).toEqual([
      'Senior Digital Marketing Executive',
      'Marketing Executive (Events & Community)',
      'Senior Business Development Executive',
      'Marketing Intern',
    ]);
  });
});
