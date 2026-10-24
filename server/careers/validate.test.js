import { describe, it, expect } from 'vitest';
import { JOB_LIMITS, validateJob } from './validate.js';
import { sanitizeJobDescription } from './sanitize.js';

const job = {
  position: 'Marketing Intern',
  description: '<p><strong>Job Description</strong></p><ul><li>Assist the team</li></ul>',
  tags: ['Influencer Marketing'],
  salary: 'MYR 850',
  location: 'Jaya One, Petaling Jaya',
  open: true,
};

describe('validateJob', () => {
  it('accepts a position as the careers admin saves it', () => {
    const { value, errors } = validateJob(job);
    expect(errors).toEqual({});
    expect(value).toEqual(job);
  });

  it('requires a title, salary and location, as the careers admin did', () => {
    const { errors } = validateJob({ ...job, position: ' ', salary: '', location: undefined });
    expect(Object.keys(errors).sort()).toEqual(['location', 'position', 'salary']);
  });

  it('allows an empty description, as the careers admin did', () => {
    expect(validateJob({ ...job, description: '' }).errors).toEqual({});
  });

  it('keeps new positions open unless closed explicitly', () => {
    const { position, salary, location } = job;
    expect(validateJob({ position, salary, location }).value.open).toBe(true);
    expect(validateJob({ ...job, open: false }).value.open).toBe(false);
  });

  it('trims tags, drops blank ones and caps how many there are', () => {
    const tags = ['  Events ', '', '   ', 'Marketing', ...Array.from({ length: 20 }, (_, i) => `t${i}`)];
    const { value } = validateJob({ ...job, tags });
    expect(value.tags.slice(0, 2)).toEqual(['Events', 'Marketing']);
    expect(value.tags).toHaveLength(JOB_LIMITS.tags);
    expect(validateJob({ ...job, tags: 'Events' }).value.tags).toEqual([]);
  });

  it('keeps single-line fields on one line and within their limits', () => {
    const { value } = validateJob({ ...job, position: `Line one\r\nline two${'x'.repeat(500)}` });
    expect(value.position).not.toMatch(/[\r\n]/);
    expect(value.position.length).toBe(JOB_LIMITS.position);
  });

  it('refuses a description over the limit instead of cutting the HTML mid-tag', () => {
    const { errors } = validateJob({ ...job, description: `<p>${'x'.repeat(JOB_LIMITS.description)}</p>` });
    expect(errors.description).toBeTruthy();
  });

  it('runs the description through the sanitiser it is given', () => {
    const { value } = validateJob(
      { ...job, description: '<p onclick="steal()">Hi</p><script>alert(1)</script>' },
      { sanitize: sanitizeJobDescription },
    );
    expect(value.description).toBe('<p>Hi</p>');
  });
});
