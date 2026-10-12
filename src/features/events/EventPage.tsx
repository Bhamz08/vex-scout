import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { LastUpdated } from '@/components/LastUpdated';
import { QueryView } from '@/components/QueryView';
import { Badge } from '@/components/ui/Badge';
import { TextField } from '@/components/ui/Fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import type { Division, Team, VexEvent } from '@/data/types';
import { useEvent, useEventAwards, useEventSkills, useEventTeams } from '@/data/queries';
import { FavoriteButton } from '@/features/favorites/FavoriteButton';
import { AwardsList } from '@/features/awards/AwardsList';
import { formatDateRange, placeLine } from '@/lib/format';
import { EventSkillsTable } from './EventSkillsTable';

type TabId = 'teams' | 'skills' | 'awards';

const TABS: { id: TabId; label: string }[] = [
  { id: 'teams', label: 'Teams' },
  { id: 'skills', label: 'Skills' },
  { id: 'awards', label: 'Awards' },
];

export function EventPage() {
  const eventId = Number(useParams().eventId);
  const eventQ = useEvent(eventId);
  return (
    <QueryView query={eventQ} loadingLabel="Loading event…">
      {(event) => (event ? <EventDetail event={event} /> : <EmptyState title="Event not found" />)}
    </QueryView>
  );
}

function EventDetail({ event }: { event: VexEvent }) {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'teams') as TabId;
  const division: Division | undefined = event.divisions.find((d) => String(d.id) === params.get('div')) ?? event.divisions[0];

  const update = (key: string, value: string) =>
    setParams(
      (p) => {
        p.set(key, value);
        return p;
      },
      { replace: true },
    );

  return (
    <>
      <PageHeader
        title={event.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>{formatDateRange(event.start, event.end)}</span>
            <span>·</span>
            <span>{event.location.venue ? `${event.location.venue}, ` : ''}{placeLine(event.location)}</span>
            <Badge>{event.level}</Badge>
            <Badge className="detail">{event.sku}</Badge>
          </span>
        }
        actions={<FavoriteButton kind="event" refId={String(event.id)} label={event.name} subtitle={formatDateRange(event.start, event.end)} />}
      />

      {event.divisions.length > 1 && division && (
        <div className="mb-3">
          <Tabs
            label="Division"
            value={String(division.id)}
            onChange={(id) => update('div', id)}
            items={event.divisions.map((d) => ({ id: String(d.id), label: d.name }))}
          />
        </div>
      )}

      <Tabs<TabId> label="Event sections" value={tab} onChange={(id) => update('tab', id)} items={TABS} />

      <div className="mt-4" role="tabpanel">
        {tab === 'teams' && <TeamsPanel event={event} />}
        {tab === 'skills' && <SkillsPanel event={event} />}
        {tab === 'awards' && <AwardsPanel event={event} />}
      </div>
    </>
  );
}

function TeamsPanel({ event }: { event: VexEvent }) {
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
              {t.organization} · {placeLine(t.location)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SkillsPanel({ event }: { event: VexEvent }) {
  const skillsQ = useEventSkills(event.id);
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <LastUpdated result={skillsQ.data} onRefresh={() => void skillsQ.refetch()} isFetching={skillsQ.isFetching} />
      </div>
      <QueryView query={skillsQ}>{(skills) => <EventSkillsTable skills={skills} />}</QueryView>
    </div>
  );
}

function AwardsPanel({ event }: { event: VexEvent }) {
  const awardsQ = useEventAwards(event.id);
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <LastUpdated result={awardsQ.data} onRefresh={() => void awardsQ.refetch()} isFetching={awardsQ.isFetching} />
      </div>
      <QueryView query={awardsQ}>{(awards) => <AwardsList awards={awards} showTeams />}</QueryView>
    </div>
  );
}
