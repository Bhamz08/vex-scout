import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LastUpdated } from '@/components/LastUpdated';
import { QueryView } from '@/components/QueryView';
import { TextField } from '@/components/ui/Fields';
import { EmptyState } from '@/components/ui/States';
import { useEventTeams } from '@/data/queries';
import type { Team, VexEvent } from '@/data/types';
import { placeLine } from '@/lib/format';

export function TeamsPanel({ event }: { event: VexEvent }) {
  const teamsQ = useEventTeams(event.id);
  const [q, setQ] = useState('');
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <TextField label="Filter teams" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Number, name or organization" className="w-full sm:w-80" />
        <LastUpdated result={teamsQ.data} onRefresh={() => void teamsQ.refetch()} isFetching={teamsQ.isFetching} />
      </div>
      <QueryView query={teamsQ}>{(teams) => <TeamList teams={filterTeams(teams, q)} />}</QueryView>
    </div>
  );
}

function filterTeams(teams: Team[], q: string): Team[] {
  const needle = q.trim().toLowerCase();
  const sorted = [...teams].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
  if (!needle) return sorted;
  return sorted.filter((t) => [t.number, t.name, t.organization].some((s) => s.toLowerCase().includes(needle)));
}

function TeamList({ teams }: { teams: Team[] }) {
  if (!teams.length) return <EmptyState title="No teams" />;
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {teams.map((t) => (
        <li key={t.id}>
          <Link to={`/teams/${encodeURIComponent(t.number)}`} className="block rounded-xl border border-line bg-surface p-3 hover:border-accent">
            <span className="font-semibold">{t.number}</span> <span>{t.name}</span>
            <span className="detail block text-sm text-muted">
              {t.organization} · {placeLine(t.location)} · {t.grade}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
