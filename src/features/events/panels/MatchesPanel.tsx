import { useMemo, useState, type ReactNode } from 'react';
import { LastUpdated } from '@/components/LastUpdated';
import { QueryView } from '@/components/QueryView';
import { SelectField, TextField } from '@/components/ui/Fields';
import { EmptyState } from '@/components/ui/States';
import { useDivisionMatches } from '@/data/queries';
import type { Division, Match, MatchRound, VexEvent } from '@/data/types';
import { MatchRow } from '@/features/matches/MatchRow';
import { ROUND_LABELS, sortMatches } from '@/lib/matches';

type Show = 'all' | 'upcoming' | 'completed';

export function MatchesPanel({ event, division, renderExtra }: { event: VexEvent; division: Division; renderExtra?: (m: Match) => ReactNode }) {
  const matchesQ = useDivisionMatches(event.id, division.id);
  const [show, setShow] = useState<Show>('all');
  const [team, setTeam] = useState('');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <TextField label="Team" placeholder="e.g. 1234A" value={team} onChange={(e) => setTeam(e.target.value)} className="w-40" />
        <SelectField label="Show" value={show} onChange={(e) => setShow(e.target.value as Show)} className="w-40">
          <option value="all">All matches</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
        </SelectField>
        <div className="ml-auto">
          <LastUpdated result={matchesQ.data} onRefresh={() => void matchesQ.refetch()} isFetching={matchesQ.isFetching} />
        </div>
      </div>
      <p className="detail text-xs text-muted">Times are shown in your time zone.</p>
      <QueryView query={matchesQ}>
        {(matches) => <MatchList event={event} matches={matches} show={show} team={team} renderExtra={renderExtra} />}
      </QueryView>
    </div>
  );
}

function MatchList({ event, matches, show, team, renderExtra }: { event: VexEvent; matches: Match[]; show: Show; team: string; renderExtra?: (m: Match) => ReactNode }) {
  const needle = team.trim().toUpperCase();
  const visible = useMemo(
    () =>
      sortMatches(matches)
        .filter((m) => show === 'all' || (show === 'completed' ? m.scored : !m.scored))
        .filter((m) => !needle || [...m.red.teams, ...m.blue.teams].some((t) => t.number.toUpperCase().includes(needle))),
    [matches, show, needle],
  );
  const highlight = needle ? [...matches.flatMap((m) => [...m.red.teams, ...m.blue.teams])].find((t) => t.number.toUpperCase() === needle)?.id : undefined;

  if (!visible.length) return <EmptyState title="No matches to show" />;

  const groups = new Map<MatchRound, Match[]>();
  for (const m of visible) groups.set(m.round, [...(groups.get(m.round) ?? []), m]);

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([round, list]) => (
        <section key={round} className="space-y-2">
          <h3 className="font-semibold">
            {ROUND_LABELS[round]} <span className="text-sm font-normal text-muted">({list.length})</span>
          </h3>
          <ul className="space-y-2">
            {list.map((m) => (
              <li key={m.id}>
                <MatchRow match={m} highlightTeamId={highlight} href={`/events/${event.id}/matches/${m.id}`} extra={renderExtra?.(m)} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
