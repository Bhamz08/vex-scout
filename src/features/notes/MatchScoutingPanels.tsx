import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SelectField } from '@/components/ui/Fields';
import type { Match, TeamRef, VexEvent } from '@/data/types';
import { NoteEditor } from './NoteEditor';
import { NotesList } from './NotesList';
import { saveNote, useMatchNotes, useTeamNotes, useTeamScouting } from './repo';
import { ScoutingForm } from './ScoutingForm';
import { ScoutingSummaryView } from './ScoutingSummaryView';

/** Scouting summary + collapsible form for one team, shown in its pre-match column. */
export function TeamScoutingBlock({ team, event }: { team: TeamRef; event: VexEvent }) {
  const scouting = useTeamScouting(event.id, team.number) ?? [];
  const notes = (useTeamNotes(team.number) ?? []).filter((n) => n.eventId === event.id || n.eventId === null);
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2 border-t border-line pt-3">
      <div className="text-sm font-medium">Scouting</div>
      <ScoutingSummaryView scouting={scouting} notes={notes} />
      <Button size="sm" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? 'Close form' : 'Scout this team'}
      </Button>
      {open && <ScoutingForm eventId={event.id} teamNumber={team.number} />}
    </div>
  );
}

/** Notes about this match, optionally attached to one of its teams. */
export function MatchNotesPanel({ match, event }: { match: Match; event: VexEvent }) {
  const notes = useMatchNotes(match.id);
  const teams = [...match.red.teams, ...match.blue.teams];
  const [teamNumber, setTeamNumber] = useState('');
  return (
    <Card className="space-y-3">
      <h2 className="text-lg font-semibold">Match notes</h2>
      <SelectField label="About" value={teamNumber} onChange={(e) => setTeamNumber(e.target.value)}>
        <option value="">The whole match</option>
        {teams.map((t) => (
          <option key={t.id} value={t.number}>
            {t.number} ({match.red.teams.includes(t) ? 'red' : 'blue'})
          </option>
        ))}
      </SelectField>
      <NoteEditor
        onSave={(text, tags) =>
          saveNote({ kind: 'match', eventId: event.id, teamNumber: teamNumber || null, matchId: match.id, matchName: match.name, text, tags })
        }
      />
      <NotesList notes={notes} showTeam emptyText="No notes for this match yet" />
    </Card>
  );
}
