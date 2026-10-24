import { describe, it, expect } from 'vitest';
import { formatAnnouncementDate, formatAnnouncementTime } from './format';

describe('formatAnnouncementDate', () => {
  it('formats like the NSX table: DD-Mon-YYYY', () => {
    expect(formatAnnouncementDate('2026-06-30T09:10:12')).toBe('30-Jun-2026');
    expect(formatAnnouncementDate('2024-08-02T11:36:23')).toBe('02-Aug-2024');
    expect(formatAnnouncementDate('2025-12-11T09:08:12')).toBe('11-Dec-2025');
  });

  it('never shifts the day for the viewer timezone', () => {
    // Stored values are wall-clock release times; 23:59 must stay on the same day.
    expect(formatAnnouncementDate('2025-01-31T23:59:59')).toBe('31-Jan-2025');
    expect(formatAnnouncementDate('2025-02-01T00:00:00')).toBe('01-Feb-2025');
  });

  it('returns an empty string for anything that is not a release date', () => {
    expect(formatAnnouncementDate('')).toBe('');
    expect(formatAnnouncementDate('not a date')).toBe('');
  });
});

describe('formatAnnouncementTime', () => {
  it('formats a 12-hour clock with seconds and no leading zero', () => {
    expect(formatAnnouncementTime('2026-06-30T09:10:12')).toBe('9:10:12 AM');
    expect(formatAnnouncementTime('2026-06-25T14:30:43')).toBe('2:30:43 PM');
  });

  it('handles midnight and noon', () => {
    expect(formatAnnouncementTime('2026-01-01T00:05:00')).toBe('12:05:00 AM');
    expect(formatAnnouncementTime('2026-01-01T12:00:00')).toBe('12:00:00 PM');
  });

  it('treats a missing seconds field as :00', () => {
    expect(formatAnnouncementTime('2026-01-01T08:30')).toBe('8:30:00 AM');
  });

  it('returns an empty string for anything that is not a release date', () => {
    expect(formatAnnouncementTime('soon')).toBe('');
  });
});
