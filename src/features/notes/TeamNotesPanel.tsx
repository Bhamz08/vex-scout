import { Card } from '@/components/ui/Card';
import { NoteEditor } from './NoteEditor';
import { NotesList } from './NotesList';
import { saveNote, useTeamNotes } from './repo';

/** All notes about one team (any event), plus a quick general note. Used on the team page. */
export function TeamNotesPanel({ teamNumber }: { teamNumber: string }) {
  const notes = useTeamNotes(teamNumber);
  return (
    <div className="space-y-4">
      <Card>
        <h3 className="mb-2 font-semibold">Add a note about {teamNumber}</h3>
        <NoteEditor onSave={(text, tags) => saveNote({ kind: 'team', eventId: null, teamNumber, matchId: null, matchName: null, text, tags })} />
      </Card>
      <NotesList notes={notes} />
    </div>
  );
}
