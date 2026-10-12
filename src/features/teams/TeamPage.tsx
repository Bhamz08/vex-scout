import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LastUpdated } from '@/components/LastUpdated';
import { QueryView } from '@/components/QueryView';
import { Card } from '@/components/ui/Card';
import { SelectField } from '@/components/ui/Fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, Loading } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import type { Award, Match, Ranking, SkillsEntry, Team, VexEvent } from '@/data/types';
import {
  useActiveSeason,
  useTeamAwards,
  useTeamByNumber,
  useTeamEvents,
  useTeamMatches,
  useTeamRankings,
  useTeamSkills,
} from '@/data/queries';
import { FavoriteButton } from '@/features/favorites/FavoriteButton';
import { AwardsList } from '@/features/awards/AwardsList';
import { MatchRow } from '@/features/matches/MatchRow';
import { TeamNotesPanel } from '@/features/notes/TeamNotesPanel';
import { formatDateRange, placeLine } from '@/lib/format';
import { formatRecord, sortMatches, teamRecord } from '@/lib/matches';

type TabId = 'overview' | 'events' | 'matches' | 'awards' | 'skills' | 'notes';

export function TeamPage() {
  const { number = '' } = useParams();
  const { program, seasonId, seasons } = useActiveSeason();
  const teamQ = useTeamByNumber(number, program);

  return (
    <QueryView query={teamQ} loadingLabel={`Looking up ${number}…`}>
      {(team) =>
        team ? (
          <TeamDetail team={team} seasons={seasons} defaultSeason={seasonId} />
        ) : (
          <EmptyState title={`No team ${number.toUpperCase()} found`}>
            Check the number and the program in <Link to="/settings" className="text-accent underline">Settings</Link>.
          </EmptyState>
        )
      }
    </QueryView>
  );
}

function TeamDetail({
  team,
  seasons,
  defaultSeason,
}: {
  team: Team;
  seasons: { id: number; name: string }[];
  defaultSeason: number | undefined;
}) {
  const [seasonChoice, setSeasonChoice] = useState<number | 'all' | undefined>(undefined);
  const season = seasonChoice === 'all' ? undefined : (seasonChoice ?? defaultSeason);
  const [tab, setTab] = useState<TabId>('overview');

  const eventsQ = useTeamEvents(team.id, season);
  const matchesQ = useTeamMatches(team.id, season);
  const rankingsQ = useTeamRankings(team.id, season);
  const skillsQ = useTeamSkills(team.id, season);
  const awardsQ = useTeamAwards(team.id, season);

  const refreshAll = () => {
    void eventsQ.refetch();
    void matchesQ.refetch();
    void rankingsQ.refetch();
    void skillsQ.refetch();
    void awardsQ.refetch();
  };
  const fetching = [eventsQ, matchesQ, rankingsQ, skillsQ, awardsQ].some((q) => q.isFetching);

  return (
    <>
      <PageHeader
        title={
          <>
            {team.number} <span className="font-normal text-muted">{team.name}</span>
          </>
        }
        subtitle={
          <>
            {team.organization} · {placeLine(team.location)} · {team.grade}
            {team.robotName && <span className="detail"> · Robot “{team.robotName}”</span>}
          </>
        }
        actions={<FavoriteButton kind="team" refId={team.number} label={team.number} subtitle={team.name} />}
      />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <SelectField
          label="Season"
          className="w-full sm:w-72"
          value={seasonChoice === undefined ? String(defaultSeason ?? 'all') : String(seasonChoice)}
          onChange={(e) => setSeasonChoice(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
          <option value="all">All seasons</option>
        </SelectField>
        <LastUpdated result={matchesQ.data} onRefresh={refreshAll} isFetching={fetching} />
      </div>

      <Tabs<TabId>
        label="Team sections"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'overview', label: 'Overview' },
          { id: 'events', label: 'Events' },
          { id: 'matches', label: 'Matches' },
          { id: 'awards', label: 'Awards' },
          { id: 'skills', label: 'Skills' },
          { id: 'notes', label: 'Notes' },
        ]}
      />

      <div className="mt-4" role="tabpanel">
        {tab === 'overview' && (
          <Overview
            team={team}
            matches={matchesQ.data?.data}
            events={eventsQ.data?.data}
            skills={skillsQ.data?.data}
            awards={awardsQ.data?.data}
            rankings={rankingsQ.data?.data}
          />
        )}
        {tab === 'events' && (
          <QueryView query={eventsQ}>{(events) => <EventsList events={events} rankings={rankingsQ.data?.data ?? []} />}</QueryView>
        )}
        {tab === 'matches' && (
          <QueryView query={matchesQ}>{(matches) => <MatchesByEvent team={team} matches={matches} events={eventsQ.data?.data ?? []} />}</QueryView>
        )}
        {tab === 'awards' && <QueryView query={awardsQ}>{(awards) => <AwardsList awards={awards} events={eventsQ.data?.data ?? []} />}</QueryView>}
        {tab === 'notes' && <TeamNotesPanel teamNumber={team.number} />}
        {tab === 'skills' && <QueryView query={skillsQ}>{(skills) => <SkillsByEvent skills={skills} events={eventsQ.data?.data ?? []} />}</QueryView>}
      </div>
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="p-3">
      <div className="text-xs font-medium text-muted uppercase">{label}</div>
      <div className="tabular text-2xl font-bold">{value}</div>
      {hint && <div className="detail text-xs text-muted">{hint}</div>}
    </Card>
  );
}

function Overview({
  team,
  matches,
  events,
  skills,
  awards,
  rankings,
}: {
  team: Team;
  matches?: Match[];
  events?: VexEvent[];
  skills?: SkillsEntry[];
  awards?: Award[];
  rankings?: Ranking[];
}) {
  const record = useMemo(() => (matches ? teamRecord(matches, team.id) : null), [matches, team.id]);
  if (!matches || !events || !skills || !awards || !rankings) return <Loading />;

  const bestDriver = Math.max(0, ...skills.filter((s) => s.type === 'driver').map((s) => s.score));
  const bestProg = Math.max(0, ...skills.filter((s) => s.type === 'programming').map((s) => s.score));
  const bestCombined = Math.max(
    0,
    ...events.map((e) => {
      const at = skills.filter((s) => s.eventId === e.id);
      return Math.max(0, ...at.filter((s) => s.type === 'driver').map((s) => s.score)) + Math.max(0, ...at.filter((s) => s.type === 'programming').map((s) => s.score));
    }),
  );
  const winRate = record && record.played ? Math.round((record.wins / record.played) * 100) : null;
  const bestRank = rankings.length ? Math.min(...rankings.map((r) => r.rank)) : null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat label="Record (W-L-T)" value={record ? formatRecord(record) : '–'} hint={winRate !== null ? `${winRate}% wins` : undefined} />
      <Stat label="Events" value={events.length} />
      <Stat label="Awards" value={awards.length} />
      <Stat label="Best qual rank" value={bestRank ?? '–'} />
      <Stat label="Best skills (combined)" value={bestCombined} hint="Best driver + programming at one event" />
      <Stat label="Best driver" value={bestDriver} />
      <Stat label="Best programming" value={bestProg} />
      <Stat label="Matches played" value={record?.played ?? 0} />
    </div>
  );
}

function EventsList({ events, rankings }: { events: VexEvent[]; rankings: Ranking[] }) {
  if (!events.length) return <EmptyState title="No events this season" />;
  return (
    <ul className="space-y-2">
      {events.map((e) => {
        const r = rankings.find((x) => x.eventId === e.id);
        return (
          <li key={e.id}>
            <Link to={`/events/${e.id}`} className="block rounded-xl border border-line bg-surface p-3 hover:border-accent">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold">{e.name}</span>
                {r && (
                  <span className="tabular text-sm">
                    Rank {r.rank} · {formatRecord(r)}
                  </span>
                )}
              </div>
              <div className="text-sm text-muted">
                {formatDateRange(e.start, e.end)} · {placeLine(e.location)}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function MatchesByEvent({ team, matches, events }: { team: Team; matches: Match[]; events: VexEvent[] }) {
  if (!matches.length) return <EmptyState title="No matches yet" />;
  const byEvent = new Map<number, Match[]>();
  for (const m of sortMatches(matches)) byEvent.set(m.eventId, [...(byEvent.get(m.eventId) ?? []), m]);
  return (
    <div className="space-y-6">
      {[...byEvent.entries()].map(([eventId, list]) => {
        const event = events.find((e) => e.id === eventId);
        return (
          <section key={eventId} className="space-y-2">
            <h3 className="font-semibold">
              <Link to={`/events/${eventId}`} className="hover:underline">
                {event?.name ?? `Event ${eventId}`}
              </Link>{' '}
              <span className="text-sm font-normal text-muted">{formatRecord(teamRecord(list, team.id))}</span>
            </h3>
            <ul className="space-y-2">
              {list.map((m) => (
                <li key={m.id}>
                  <MatchRow match={m} highlightTeamId={team.id} href={`/events/${m.eventId}/divisions/${m.divisionId}/matches/${m.id}`} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function SkillsByEvent({ skills, events }: { skills: SkillsEntry[]; events: VexEvent[] }) {
  if (!skills.length) return <EmptyState title="No skills runs yet" />;
  const eventIds = [...new Set(skills.map((s) => s.eventId))];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-muted">
          <tr>
            <th className="py-2 pr-3 font-medium">Event</th>
            <th className="py-2 pr-3 text-right font-medium">Driver</th>
            <th className="py-2 pr-3 text-right font-medium">Programming</th>
            <th className="py-2 text-right font-medium">Combined</th>
          </tr>
        </thead>
        <tbody>
          {eventIds.map((id) => {
            const driver = skills.find((s) => s.eventId === id && s.type === 'driver')?.score ?? 0;
            const prog = skills.find((s) => s.eventId === id && s.type === 'programming')?.score ?? 0;
            return (
              <tr key={id} className="border-t border-line">
                <td className="py-2 pr-3">
                  <Link to={`/events/${id}`} className="hover:underline">
                    {events.find((e) => e.id === id)?.name ?? `Event ${id}`}
                  </Link>
                </td>
                <td className="tabular py-2 pr-3 text-right">{driver}</td>
                <td className="tabular py-2 pr-3 text-right">{prog}</td>
                <td className="tabular py-2 text-right font-semibold">{driver + prog}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
