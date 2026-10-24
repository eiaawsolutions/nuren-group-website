// Constant-time comparison for secrets such as the admin password.
// Both sides are hashed first so the comparison always runs over 32 bytes:
// comparing the raw strings would return early on a length mismatch and let
// response timing reveal how long the password is.
import crypto from 'node:crypto';

const digest = (value) => crypto.createHash('sha256').update(value, 'utf8').digest();

export function secretsMatch(supplied, expected) {
  if (typeof supplied !== 'string' || typeof expected !== 'string') return false;
  return crypto.timingSafeEqual(digest(supplied), digest(expected));
}
