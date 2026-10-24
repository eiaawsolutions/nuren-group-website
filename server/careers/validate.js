// Job positions on the careers page, as the Nuren investor site's careers admin
// stored them (its MongoDB collection "job-position"): a title, an HTML
// description from the admin's rich-text editor, tags, salary, location and
// whether the position is open. Shared by the admin form in the browser and the
// server, so the two cannot drift. The server is the authority: it re-validates
// everything and also sanitises the description (sanitize.js, server only).

export const JOB_LIMITS = {
  position: 200,
  description: 20000,
  salary: 100,
  location: 200,
  tag: 60,
  tags: 12,
};

const oneLine = (value, max) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);

/**
 * @param {unknown} raw  the request body (or a seed row)
 * @param {{ sanitize?: (html: string) => string }} [options]
 * @returns {{ value: { position: string, description: string, tags: string[], salary: string, location: string, open: boolean }, errors: Record<string, string> }}
 */
export function validateJob(raw, { sanitize = (html) => html } = {}) {
  const body = raw && typeof raw === 'object' ? raw : {};
  const description = String(body.description ?? '').trim();

  const value = {
    position: oneLine(body.position, JOB_LIMITS.position),
    description: description.length > JOB_LIMITS.description ? '' : sanitize(description),
    tags: (Array.isArray(body.tags) ? body.tags : [])
      .map((tag) => oneLine(tag, JOB_LIMITS.tag))
      .filter(Boolean)
      .slice(0, JOB_LIMITS.tags),
    salary: oneLine(body.salary, JOB_LIMITS.salary),
    location: oneLine(body.location, JOB_LIMITS.location),
    open: body.open !== false,
  };

  const errors = {};
  if (!value.position) errors.position = 'Please enter the position title.';
  if (description.length > JOB_LIMITS.description) errors.description = 'The description is too long. Please shorten it.';
  if (!value.salary) errors.salary = 'Please enter the salary.';
  if (!value.location) errors.location = 'Please enter the location.';

  return { value, errors };
}
