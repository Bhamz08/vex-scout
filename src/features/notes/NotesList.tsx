import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';
import type { NoteRecord } from '@/data/db';
import { useSettings } from '@/features/settings/store';
import { formatRelative } from '@/lib/format';
import { NoteEditor } from './NoteEditor';
import { deleteNote, saveNote } from './repo';

export function NotesList({ notes, showTeam = false, emptyText = 'No notes yet' }: { notes: NoteRecord[] | undefined; showTeam?: boolean; emptyText?: string }) {
  if (!notes) return null;
  if (!notes.length) return <EmptyState title={emptyText} />;
  return (
    <ul className="space-y-2">
      {notes.map((n) => (
        <NoteItem key={n.id} note={n} showTeam={showTeam} />
      ))}
    </ul>
  );
}

function NoteItem({ note, showTeam }: { note: NoteRecord; showTeam: boolean }) {
  const [editing, setEditing] = useState(false);
  const deviceId = useSettings((s) => s.deviceId);
  const fromTeammate = note.deviceId !== deviceId;

  return (
    <li className="space-y-2 rounded-md border border-line bg-surface p-3">
      {editing ? (
        <NoteEditor
          initialText={note.text}
          initialTags={note.tags}
          submitLabel="Update"
          onCancel={() => setEditing(false)}
          onSave={async (text, tags) => {
            await saveNote({ ...note, text, tags });
            setEditing(false);
          }}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            {showTeam && note.teamNumber && (
              <Link to={`/teams/${encodeURIComponent(note.teamNumber)}`} className="font-semibold text-fg hover:underline">
                {note.teamNumber}
              </Link>
            )}
            {note.kind === 'match' && note.matchName && <Badge>{note.matchName}</Badge>}
            <span>{formatRelative(note.updatedAt)}</span>
            {fromTeammate && <Badge tone="accent">From teammate</Badge>}
          </div>
          {note.text && <p className="whitespace-pre-wrap">{note.text}</p>}
          {note.tags.length > 0 && (
            <ul className="flex flex-wrap gap-1" aria-label="Tags">
              {note.tags.map((t) => (
                <li key={t}>
                  <Badge>#{t}</Badge>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (window.confirm('Delete this note?')) void deleteNote(note.id);
              }}
            >
              Delete
            </Button>
          </div>
        </>
      )}
    </li>
  );
}
