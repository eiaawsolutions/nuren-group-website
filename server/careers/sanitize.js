// Job descriptions are HTML written in the admin's rich-text editor and shown
// as HTML on the careers page, so the server keeps only the formatting that
// editor makes: paragraphs, line breaks, bold, italic, underline, lists and
// links. Scripts, event handlers, styles, images and frames are removed, and
// links may only be https, http or mailto and open in a new tab.
// Server only: the browser never sanitises, it shows what the server stored.
import sanitizeHtml from 'sanitize-html';

const OPTIONS = {
  allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['https', 'http', 'mailto'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
  },
};

export function sanitizeJobDescription(html) {
  return sanitizeHtml(String(html ?? ''), OPTIONS);
}
