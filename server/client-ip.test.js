import { describe, it, expect } from 'vitest';
import { clientIp } from './client-ip.js';

const req = ({ realIp, xff, socketIp = '10.0.0.5' } = {}) => ({
  headers: {
    ...(realIp !== undefined ? { 'x-real-ip': realIp } : {}),
    ...(xff !== undefined ? { 'x-forwarded-for': xff } : {}),
  },
  socket: { remoteAddress: socketIp },
});

describe('clientIp', () => {
  it("uses Railway's X-Real-IP, the visitor's address", () => {
    expect(clientIp(req({ realIp: '113.211.110.89' }))).toBe('113.211.110.89');
    expect(clientIp(req({ realIp: '2001:db8::1' }))).toBe('2001:db8::1');
  });

  it('ignores X-Forwarded-For, which can carry a visitor-typed or proxy address', () => {
    expect(clientIp(req({ realIp: '113.211.110.89', xff: '203.0.113.7, 152.233.15.120' }))).toBe('113.211.110.89');
  });

  it('falls back to the socket address when X-Real-IP is missing (local runs)', () => {
    expect(clientIp(req({ socketIp: '127.0.0.1' }))).toBe('127.0.0.1');
  });

  it('falls back when X-Real-IP is not a valid IP', () => {
    expect(clientIp(req({ realIp: 'not-an-ip' }))).toBe('10.0.0.5');
    expect(clientIp(req({ realIp: '1.2.3.4, 5.6.7.8' }))).toBe('10.0.0.5');
  });

  it('never returns an empty key', () => {
    expect(clientIp({ headers: {}, socket: {} })).toBe('unknown');
  });
});
