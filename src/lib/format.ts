/** Locale-aware formatting. All times are shown in the viewer's own time zone. */

const dateFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const shortDateFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dayTimeFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (start.toDateString() === end.toDateString()) return dateFmt.format(start);
  return `${shortDateFmt.format(start)} – ${dateFmt.format(end)}`;
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

export function formatDayTime(iso: string): string {
  return dayTimeFmt.format(new Date(iso));
}

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

export function formatRelative(epochMs: number, now = Date.now()): string {
  const seconds = Math.round((epochMs - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return 'just now';
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
  return rtf.format(Math.round(seconds / 86400), 'day');
}

export function formatNumber(n: number, digits = 1): string {
  return Number.isFinite(n) ? n.toFixed(digits) : '–';
}

export function formatPercent(p: number): string {
  return `${Math.round(p * 100)}%`;
}

export function placeLine(loc: { city: string; region: string; country: string }): string {
  return [loc.city, loc.region, loc.country].filter((s, i, arr) => s && arr.indexOf(s) === i).join(', ');
}
