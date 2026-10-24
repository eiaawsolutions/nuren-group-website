// The two lines in the Release Date column, as on the NSX and the investor
// site: "30-Jun-2026" over "9:10:12 AM". Release dates are stored as published
// wall-clock times with no timezone, so they are read field by field rather
// than through Date: the prerendered HTML and every visitor see the same time.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const RELEASE_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/;

function parse(value: string) {
  const m = RELEASE_RE.exec(value || '');
  if (!m) return null;
  const [, year, month, day, hour, minute, second = '00'] = m;
  const monthName = MONTHS[Number(month) - 1];
  return monthName ? { year, monthName, day, hour: Number(hour), minute, second } : null;
}

export function formatAnnouncementDate(value: string): string {
  const d = parse(value);
  return d ? `${d.day}-${d.monthName}-${d.year}` : '';
}

export function formatAnnouncementTime(value: string): string {
  const d = parse(value);
  if (!d) return '';
  const ampm = d.hour >= 12 ? 'PM' : 'AM';
  const hour12 = d.hour % 12 || 12;
  return `${hour12}:${d.minute}:${d.second} ${ampm}`;
}
