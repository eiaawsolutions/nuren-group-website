// Fixed-window rate limiter keyed by client IP.
//
// The window starts at a key's first request and does not move until it has
// fully passed. (The previous version re-set the cache entry on every hit,
// which restarted its TTL, so steady chatting never let the window expire:
// anyone sending a message at least once a minute was locked out after `max`
// messages for good.) The LRU only bounds memory; the window logic uses `now`.
import { LRUCache } from 'lru-cache';

/**
 * @param {{ windowMs: number, max: number, maxKeys?: number, now?: () => number }} options
 * @returns {(key: string) => boolean} true if the request is allowed
 */
export function createRateLimiter({ windowMs, max, maxKeys = 10_000, now = Date.now }) {
  const windows = new LRUCache({ max: maxKeys, ttl: windowMs });
  return (key) => {
    const time = now();
    const current = windows.get(key);
    if (!current || time - current.start >= windowMs) {
      windows.set(key, { start: time, count: 1 });
      return true;
    }
    // Mutate in place: re-setting the entry would restart its TTL.
    current.count += 1;
    return current.count <= max;
  };
}
