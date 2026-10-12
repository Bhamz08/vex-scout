import { useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, Loading } from '@/components/ui/States';
import { useDivisionRankings, useEvent, useEventSkills, useEventTeams, useTeamAwards, useTeamsMatches } from '@/data/queries';
import type { AllianceColor, Match, Ranking, Team, TeamRef, VexEvent } from '@/data/types';
import { combineSkills, type SkillsRow } from '@/features/events/EventSkillsTable';
import { MatchNotesPanel, TeamScoutingBlock } from '@/features/notes/MatchScoutingPanels';
import { useDivisionModel } from '@/features/stats/useDivisionModel';
import { WinProbability } from '@/features/stats/WinProbability';
import { cn } from '@/lib/cn';
import { formatDayTime, formatNumber } from '@/lib/format';
import { formatRecord, teamRecord } from '@/lib/matches';
import type { TeamStats } from '@/lib/stats/opr';

export function MatchPage() {
  const params = useParams();
  const eventId = Number(params.eventId);
  const divisionId = Number(params.divisionId);
  const matchId = Number(params.matchId);
  const eventQ = useEvent(eventId);
  const event = eventQ.data?.data;

  if (eventQ.isPending) return <Loading />;
  if (!event) return <EmptyState title="Event not found" />;
  return <MatchScouting event={event} divisionId={divisionId} matchId={matchId} />;
}

function MatchScouting({ event, divisionId, matchId }: { event: VexEvent; divisionId: number; matchId: number }) {
  const division = event.divisions.find((d) => d.id === divisionId);
  const [useHistory, setUseHistory] = useState(true);
  const { model } = useDivisionModel(event, division, useHistory);
  const rankingsQ = useDivisionRankings(event.id, division?.id);
  const skillsQ = useEventSkills(event.id);
  const teamsQ = useEventTeams(event.id);

  const match = model?.matches.find((m) => m.id === matchId);
  const teamIds = useMemo(() => (match ? [...match.red.teams, ...match.blue.teams].map((t) => t.id) : []), [match]);
  const seasonMatches = useTeamsMatches(teamIds, event.seasonId);
  const skills = useMemo(() => combineSkills(skillsQ.data?.data ?? []), [skillsQ.data]);

  if (!model) return <Loading />;
  if (!match) return <EmptyState title="Match not found" />;

  const prediction = model.predict(match);
  const columns: Array<{ ref: TeamRef; color: AllianceColor }> = [
    ...match.red.teams.map((ref) => ({ ref, color: 'red' as const })),
    ...match.blue.teams.map((ref) => ({ ref, color: 'blue' as const })),
  ];

  return (
    <>
      <PageHeader
        title={`${match.name} · Pre-match scouting`}
        subtitle={
          <>
            <Link to={`/events/${event.id}?tab=matches&div=${divisionId}`} className="hover:underline">
              {event.name}
            </Link>
            {division && event.divisions.length > 1 && <> · {division.name}</>}
            {match.field && <> · {match.field}</>}
            {match.scheduled && <> · {formatDayTime(match.scheduled)}</>}
          </>
        }
      />

      <Card className="mb-4 space-y-3">
        {match.scored ? (
          <p className="tabular text-lg font-semibold">
            Final: <span className="text-red-team">Red {match.red.score}</span> – <span className="text-blue-team">{match.blue.score} Blue</span>
          </p>
        ) : null}
        <WinProbability red={prediction.redWinProbability} />
        <p className="tabular text-sm">
          Predicted score: <span className="text-red-team">Red {Math.round(prediction.redScore)}</span> –{' '}
          <span className="text-blue-team">{Math.round(prediction.blueScore)} Blue</span>
        </p>
        <Switch label="Blend in earlier events" description="Use each team's results from earlier events this season too." checked={useHistory} onChange={setUseHistory} />
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map(({ ref, color }) => (
          <TeamColumn
            key={ref.id}
            refTeam={ref}
            color={color}
            event={event}
            team={teamsQ.data?.data.find((t) => t.id === ref.id)}
            ranking={rankingsQ.data?.data.find((r) => r.team.id === ref.id)}
            stats={model.stats.get(ref.id)}
            skills={skills.find((s) => s.teamId === ref.id)}
            skillsRank={skills.findIndex((s) => s.teamId === ref.id) + 1}
            seasonMatches={seasonMatches.byTeam.get(ref.id)}
            historyMatches={model.historyMatches(ref.id)}
          />
        ))}
      </div>

      <div className="mt-6">
        <MatchNotesPanel match={match} event={event} />
      </div>
    </>
  );
}

function TeamColumn({
  refTeam,
  color,
  event,
  team,
  ranking,
  stats,
  skills,
  skillsRank,
  seasonMatches,
  historyMatches,
}: {
  refTeam: TeamRef;
  color: AllianceColor;
  event: VexEvent;
  team?: Team;
  ranking?: Ranking;
  stats?: TeamStats;
  skills?: SkillsRow;
  skillsRank: number;
  seasonMatches?: Match[];
  historyMatches: number;
}) {
  const awardsQ = useTeamAwards(refTeam.id, event.seasonId);
  const season = seasonMatches ? teamRecord(seasonMatches, refTeam.id) : null;
  const seasonEvents = seasonMatches ? new Set(seasonMatches.map((m) => m.eventId)).size : null;
  const red = color === 'red';

  return (
    <Card className={cn('space-y-3 border-t-4', red ? 'border-t-red-team' : 'border-t-blue-team')}>
      <div>
        <div className={cn('text-xs font-bold uppercase', red ? 'text-red-team' : 'text-blue-team')}>{red ? 'Red' : 'Blue'} alliance</div>
        <Link to={`/teams/${encodeURIComponent(refTeam.number)}`} className="text-xl font-bold hover:underline">
          {refTeam.number}
        </Link>
        {team && <div className="text-sm text-muted">{team.name}</div>}
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        <Item label="Rank">{ranking ? `#${ranking.rank}` : '—'}</Item>
        <Item label="W-L-T">{ranking ? formatRecord(ranking) : '—'}</Item>
        <Item label="WP / AP / SP">{ranking ? `${ranking.wp} / ${ranking.ap} / ${ranking.sp}` : '—'}</Item>
        <Item label="High score">{ranking?.highScore ?? '—'}</Item>
        <Item label="OPR">{stats ? formatNumber(stats.opr) : '—'}</Item>
        <Item label="DPR">{stats ? formatNumber(stats.dpr) : '—'}</Item>
        <Item label="CCWM">{stats ? formatNumber(stats.ccwm) : '—'}</Item>
        <Item label="Matches here">{stats?.played ?? 0}</Item>
        <Item label="Season W-L-T">{season ? formatRecord(season) : '…'}</Item>
        <Item label="Season events">{seasonEvents ?? '…'}</Item>
        <Item label="Skills (here)">{skills ? `${skills.combined} (#${skillsRank})` : '—'}</Item>
        <Item label="Drv / Prog">{skills ? `${skills.driver} / ${skills.programming}` : '—'}</Item>
      </dl>
      {historyMatches > 0 && <p className="detail text-xs text-muted">Prediction also uses {historyMatches} earlier matches.</p>}

      <div className="text-sm">
        <div className="font-medium">Season awards</div>
        {awardsQ.data ? (
          awardsQ.data.data.length ? (
            <ul className="list-inside list-disc text-muted">
              {awardsQ.data.data.map((a) => (
                <li key={a.id}>{a.title}</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">None yet</p>
          )
        ) : (
          <p className="text-muted">…</p>
        )}
      </div>

      <TeamScoutingBlock team={refTeam} event={event} />
    </Card>
  );
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="tabular text-right font-medium">{children}</dd>
    </>
  );
}
