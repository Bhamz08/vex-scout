import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SelectField, TextField } from '@/components/ui/Fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, Loading } from '@/components/ui/States';
import { exportBundle, importBundle, parseBundle } from '@/features/export/bundle';
import { downloadText } from '@/features/export/download';
import { useSettings } from '@/features/settings/store';
import { NotesList } from './NotesList';
import { useAllNotes } from './repo';

export function NotesPage() {
  const notes = useAllNotes();
  const deviceId = useSettings((s) => s.deviceId);
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [status, setStatus] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const tags = useMemo(() => [...new Set((notes ?? []).flatMap((n) => n.tags))].sort(), [notes]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (notes ?? []).filter(
      (n) => (!tag || n.tags.includes(tag)) && (!needle || n.text.toLowerCase().includes(needle) || (n.teamNumber ?? '').toLowerCase().includes(needle)),
    );
  }, [notes, q, tag]);

  const byTeam = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const n of filtered) {
      const key = n.teamNumber ?? 'General';
      map.set(key, [...(map.get(key) ?? []), n]);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
  }, [filtered]);

  const doExport = async () => {
    const bundle = await exportBundle(deviceId);
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    downloadText(`vex-scout-notes-${stamp}.json`, JSON.stringify(bundle, null, 2), 'application/json');
    setStatus({ tone: 'ok', text: `Exported ${bundle.notes.length} notes and ${bundle.scouting.length} scouting forms.` });
  };

  const doImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const result = await importBundle(parseBundle(await file.text()));
      setStatus({ tone: 'ok', text: `Imported: ${result.added} new, ${result.updated} updated, ${result.unchanged} already up to date.` });
    } catch (err) {
      setStatus({ tone: 'bad', text: err instanceof Error ? err.message : 'Import failed.' });
    }
  };

  return (
    <>
      <PageHeader title="Notes" subtitle="Everything you've written, grouped by team. Stored on this device." />

      <Card className="mb-6 space-y-3">
        <h2 className="font-semibold">Share with teammates</h2>
        <p className="text-sm text-muted">
          Export a file and send it to a teammate; they import it here. Importing merges notes: newer edits win and nothing is duplicated. For a scouting
          spreadsheet, use the Scouting tab on an event.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => void doExport()}>
            Export notes (JSON)
          </Button>
          <Button onClick={() => fileRef.current?.click()}>Import notes…</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => void doImport(e)} aria-label="Import notes file" />
        </div>
        {status && (
          <p role="status" className={status.tone === 'ok' ? 'text-sm text-ok' : 'text-sm text-bad'}>
            {status.text}
          </p>
        )}
      </Card>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <TextField label="Search notes" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Text or team number" />
        <SelectField label="Tag" value={tag} onChange={(e) => setTag(e.target.value)}>
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              #{t}
            </option>
          ))}
        </SelectField>
      </div>

      {!notes ? (
        <Loading />
      ) : !byTeam.length ? (
        <EmptyState title={notes.length ? 'No notes match' : 'No notes yet'}>Add notes from a team page, a match page or an event’s Scouting tab.</EmptyState>
      ) : (
        <div className="space-y-6">
          {byTeam.map(([team, list]) => (
            <section key={team} className="space-y-2">
              <h2 className="font-semibold">
                {team === 'General' ? (
                  'General'
                ) : (
                  <Link to={`/teams/${encodeURIComponent(team)}`} className="hover:underline">
                    {team}
                  </Link>
                )}{' '}
                <span className="text-sm font-normal text-muted">({list.length})</span>
              </h2>
              <NotesList notes={list} />
            </section>
          ))}
        </div>
      )}
    </>
  );
}
