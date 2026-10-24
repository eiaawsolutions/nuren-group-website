import { describe, it, expect } from 'vitest';
import { matchesSearch, emptyRecord, toDateTimeLocal, ADMIN_COPY } from './investorAdmin';

const announcement = {
  id: 'a', code: '40450', category: 'NSX Major Contract Notice',
  headline: '40450 NSX Major Contract Notice - Proposed NASDAQ IPO and Appointment of Lead Adviser',
  description: 'Appointment of ZICO Evolve Capital as Lead Adviser', date: '2025-04-30T11:18:07', url: '/announcements-pdfs/a.pdf',
};
const report = { id: 'r', code: '40510', title: '40510 NSX Annual Report - 2025 Annual Report', description: '', date: '2025-06-18T09:13:41', url: '/announcements-pdfs/b.pdf' };

describe('matchesSearch', () => {
  it('matches announcements by headline, description or code, ignoring case', () => {
    expect(matchesSearch(announcement, 'announcements', 'nasdaq')).toBe(true);
    expect(matchesSearch(announcement, 'announcements', 'ZICO')).toBe(true);
    expect(matchesSearch(announcement, 'announcements', '40450')).toBe(true);
    expect(matchesSearch(announcement, 'announcements', 'dividend')).toBe(false);
  });

  it('matches reports by title, like the investor site admin', () => {
    expect(matchesSearch(report, 'financial-reports', 'annual report')).toBe(true);
    expect(matchesSearch(report, 'financial-reports', 'quarterly')).toBe(false);
  });

  it('matches everything for an empty search', () => {
    expect(matchesSearch(report, 'financial-reports', '  ')).toBe(true);
  });

  it('treats the search as plain text, not a pattern', () => {
    expect(matchesSearch(announcement, 'announcements', '.*')).toBe(false);
  });
});

describe('toDateTimeLocal', () => {
  it('formats a local date for a datetime-local input, with seconds', () => {
    expect(toDateTimeLocal(new Date(2026, 9, 24, 9, 5, 7))).toBe('2026-10-24T09:05:07');
  });
});

describe('emptyRecord', () => {
  const now = new Date(2026, 9, 24, 15, 0, 0);

  it('starts a visible announcement dated now', () => {
    expect(emptyRecord('announcements', now)).toEqual({
      code: '', category: '', headline: '', description: '', date: '2026-10-24T15:00:00',
      priceSensitive: false, url: '', active: true,
    });
  });

  it('starts a report as a file', () => {
    expect(emptyRecord('financial-reports', now)).toMatchObject({ title: '', type: 'file', active: true });
  });
});

describe('ADMIN_COPY', () => {
  it('uses the investor site admin wording', () => {
    expect(ADMIN_COPY.announcements).toMatchObject({ add: 'Add New Announcement', view: 'View Announcements Page', viewHref: '/investors/announcements' });
    expect(ADMIN_COPY['financial-reports']).toMatchObject({ add: 'Add New Report', view: 'View Finance Reports Page', viewHref: '/investors/reports' });
  });
});
