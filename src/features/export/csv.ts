export type CsvValue = string | number | boolean | null | undefined;

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => CsvValue;
}

/**
 * RFC 4180 CSV: CRLF line endings, fields quoted when they contain a comma, quote or newline,
 * quotes doubled. Text starting with = + - @ is prefixed with an apostrophe so spreadsheet apps
 * don't run it as a formula (CSV injection). Numbers are written as-is, so negatives stay numeric.
 */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [columns.map((c) => escapeCell(c.header)), ...rows.map((r) => columns.map((c) => escapeCell(c.value(r))))];
  return lines.map((cells) => cells.join(',')).join('\r\n') + '\r\n';
}

export function escapeCell(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
