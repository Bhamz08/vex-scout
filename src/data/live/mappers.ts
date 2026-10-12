import type { z } from 'zod';
import type { Award, EventLevel, Grade, Location, Match, ProgramCode, Ranking, Season, SkillsEntry, Team, VexEvent, WorldSkillsEntry } from '../types';
import { PROGRAM_IDS, ROUND_CODES } from './endpoints';
import type { AwardSchema, EventSchema, LocationSchema, MatchSchema, RankingSchema, SeasonSchema, SkillsSchema, TeamSchema, WorldSkillsRowSchema } from './schemas';

/** Wire format → domain model. Pure functions, so they're easy to adjust once the real API is verified. */

const LEVELS: EventLevel[] = ['World', 'National', 'Signature', 'State', 'Regional', 'Other'];
const GRADES: Grade[] = ['Middle School', 'High School', 'College'];

function programCode(id: number): ProgramCode {
  return id === PROGRAM_IDS.VURC ? 'VURC' : 'V5RC';
}

function location(loc: z.infer<typeof LocationSchema>): Location {
  return {
    venue: loc?.venue ?? undefined,
    city: loc?.city ?? '',
    region: loc?.region ?? '',
    country: loc?.country ?? '',
  };
}

function ref(r: { id: number; name?: string | null }) {
  return { id: r.id, number: r.name ?? String(r.id) };
}

export function toSeason(s: z.infer<typeof SeasonSchema>): Season {
  return { id: s.id, name: s.name, program: programCode(s.program.id), start: s.start, end: s.end };
}

export function toTeam(t: z.infer<typeof TeamSchema>): Team {
  const program = programCode(t.program.id);
  const grade = GRADES.find((g) => g === t.grade) ?? (program === 'VURC' ? 'College' : 'High School');
  return {
    id: t.id,
    number: t.number,
    name: t.team_name ?? '',
    robotName: t.robot_name ?? undefined,
    organization: t.organization ?? '',
    location: location(t.location),
    grade,
    program,
    registered: t.registered ?? false,
  };
}

export function toEvent(e: z.infer<typeof EventSchema>): VexEvent {
  return {
    id: e.id,
    sku: e.sku,
    name: e.name,
    start: e.start,
    end: e.end,
    seasonId: e.season.id,
    program: programCode(e.program.id),
    level: LEVELS.find((l) => l === e.level) ?? 'Other',
    location: location(e.location),
    divisions: [...(e.divisions ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((d) => ({ id: d.id, name: d.name })),
  };
}

export function toMatch(m: z.infer<typeof MatchSchema>): Match {
  const alliance = (color: 'red' | 'blue') => {
    const a = m.alliances.find((x) => x.color === color);
    const played = m.scored || (a?.score ?? 0) > 0;
    return {
      color,
      score: played ? (a?.score ?? 0) : null,
      teams: (a?.teams ?? []).map((t) => ({ ...ref(t.team), sitting: t.sitting ?? false })),
    };
  };
  const red = alliance('red');
  const blue = alliance('blue');
  return {
    id: m.id,
    eventId: m.event.id,
    divisionId: m.division.id,
    round: ROUND_CODES[m.round] ?? 'other',
    instance: m.instance,
    matchnum: m.matchnum,
    name: m.name,
    scheduled: m.scheduled ?? null,
    started: m.started ?? null,
    field: m.field ?? null,
    scored: red.score !== null && blue.score !== null,
    red,
    blue,
  };
}

export function toRanking(r: z.infer<typeof RankingSchema>): Ranking {
  return {
    eventId: r.event.id,
    divisionId: r.division.id,
    rank: r.rank,
    team: ref(r.team),
    wins: r.wins,
    losses: r.losses,
    ties: r.ties,
    wp: r.wp,
    ap: r.ap,
    sp: r.sp,
    highScore: r.high_score ?? 0,
    averagePoints: r.average_points ?? 0,
    totalPoints: r.total_points ?? 0,
  };
}

/** Returns null for skills types we don't model (e.g. legacy "package_running_time"). */
export function toSkills(s: z.infer<typeof SkillsSchema>): SkillsEntry | null {
  if (s.type !== 'driver' && s.type !== 'programming') return null;
  return { eventId: s.event.id, team: ref(s.team), type: s.type, score: s.score, attempts: s.attempts ?? 0, rank: s.rank ?? 0 };
}

export function toAward(a: z.infer<typeof AwardSchema>): Award {
  return {
    id: a.id,
    eventId: a.event.id,
    title: a.title.replace(/\s*\(.*\)\s*$/, ''),
    qualifications: a.qualifications ?? [],
    teams: (a.teamWinners ?? []).map((w) => ({ ...ref(w.team), divisionId: w.division?.id })),
    individuals: a.individualWinners ?? [],
  };
}

export function toWorldSkills(row: z.infer<typeof WorldSkillsRowSchema>): WorldSkillsEntry {
  return {
    rank: row.rank,
    team: { id: row.team.id, number: row.team.team, name: row.team.teamName ?? '' },
    location: { city: row.team.city ?? '', region: row.team.region ?? '', country: row.team.country ?? '' },
    grade: GRADES.find((g) => g === row.team.gradeLevel) ?? 'High School',
    combined: row.scores.score,
    driver: row.scores.driver,
    programming: row.scores.programming,
  };
}
