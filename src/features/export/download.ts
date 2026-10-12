/** Byte-order mark: makes Excel open UTF-8 CSVs (accented names) correctly. */
const BOM = String.fromCharCode(0xfeff);

/** Triggers a browser download of generated text. */
export function downloadText(filename: string, content: string, mime: string): void {
  const body = mime.startsWith('text/csv') ? `${BOM}${content}` : content;
  const url = URL.createObjectURL(new Blob([body], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}
