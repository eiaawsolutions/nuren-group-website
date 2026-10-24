// The visitor's IP, which rate limits and the admin lockout key on.
//
// Railway's edge sets X-Real-IP to the visitor's address on every request,
// replacing any copy the visitor sent (docs.railway.com/networking/
// public-networking/specs-and-limits). X-Forwarded-For is no good here: its
// last entry is a Railway address that changes between requests (verified
// 2026-10-24), so keying on it puts unrelated visitors in one bucket, and
// only Railway's rewriting keeps its first entry honest.
//
// Without X-Real-IP (a local run) the socket address is used. If a proxy is
// ever put in front of Railway (Cloudflare, say), X-Real-IP becomes that
// proxy's address; check "Your IP, as rate limits see it" on /admin after.
import net from 'node:net';

export function clientIp(req) {
  const realIp = String(req.headers?.['x-real-ip'] ?? '').trim();
  if (net.isIP(realIp)) return realIp;
  return req.socket?.remoteAddress || 'unknown';
}
