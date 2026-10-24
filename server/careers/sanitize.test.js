import { describe, it, expect } from 'vitest';
import { sanitizeJobDescription } from './sanitize.js';

describe('sanitizeJobDescription', () => {
  it('keeps the formatting the careers editor produces', () => {
    const html = '<p><strong>Job Responsibilities</strong></p><ul><li>Plan<ul><li>Execute</li></ul></li></ul><p>Line<br />two <i>now</i></p><ol><li>One</li></ol>';
    expect(sanitizeJobDescription(html)).toBe(html);
  });

  it('keeps non-breaking spaces (written as the character, which renders the same)', () => {
    expect(sanitizeJobDescription('<p>Requirements&nbsp;</p><p>&nbsp;</p>')).toBe('<p>Requirements </p><p> </p>');
  });

  it('removes scripts, event handlers and inline styles', () => {
    expect(sanitizeJobDescription('<p style="margin-left:0px;" onclick="x()">Hi</p><script>alert(1)</script>')).toBe('<p>Hi</p>');
    expect(sanitizeJobDescription('<img src=x onerror="alert(1)"><iframe src="https://evil.example"></iframe>')).toBe('');
  });

  it('keeps https and mailto links, opening in a new tab without the opener', () => {
    expect(sanitizeJobDescription('<a href="mailto:admin@nurengroup.com">Email</a>')).toBe(
      '<a href="mailto:admin@nurengroup.com" target="_blank" rel="noopener noreferrer">Email</a>',
    );
    expect(sanitizeJobDescription('<a href="https://nurengroup.com" target="_self" rel="opener">Site</a>')).toBe(
      '<a href="https://nurengroup.com" target="_blank" rel="noopener noreferrer">Site</a>',
    );
  });

  it('drops javascript: and data: links', () => {
    expect(sanitizeJobDescription('<a href="javascript:alert(1)">x</a>')).toBe('<a target="_blank" rel="noopener noreferrer">x</a>');
    expect(sanitizeJobDescription('<a href="data:text/html,<script>alert(1)</script>">x</a>')).toBe('<a target="_blank" rel="noopener noreferrer">x</a>');
  });

  it('is stable when run twice', () => {
    const once = sanitizeJobDescription('<p>Tom &amp; Jerry’s <b>job</b> – “quotes”</p><p>&nbsp;</p>');
    expect(sanitizeJobDescription(once)).toBe(once);
  });

  it('treats a missing description as empty', () => {
    expect(sanitizeJobDescription(undefined)).toBe('');
  });
});
