import { Rng } from '@/lib/random';
import type {
  AllianceColor,
  Award,
  Division,
  EventLevel,
  Grade,
  Location,
  Match,
  ProgramCode,
  Ranking,
  Season,
  SkillsEntry,
  Team,
  TeamRef,
  VexEvent,
  WorldSkillsEntry,
} from '../types';
import { AWARD_TITLES, ORGANIZATIONS, PLACES, TEAM_NAMES, UNIVERSITIES } from './names';
import { computeRankings, type MatchOutcomeMeta } from './rankings';

/** Fixed ids so links and tests are stable. */
export const DEMO_SEASONS = {
  V5RC_CURRENT: 9101,
  V5RC_PREVIOUS: 9001,
  VURC_CURRENT: 9104,
  VURC_PREVIOUS: 9004,
} as const;

/** The headline demo event: 40 teams, 2 divisions, qualifications in progress. */
export const DEMO_EVENT_ID = 50001;
export const DEMO_VEXU_EVENT_ID = 60001;

export interface DemoWorld {
  seasons: Season[];
  teams: Team[];
  events: VexEvent[];
  /** eventId → registered team ids */
  eventTeams: Map<number, number[]>;
  matches: Match[];
  rankings: Ranking[];
  skills: SkillsEntry[];
  awards: Award[];
  worldSkills: Map<number, WorldSkillsEntry[]>;
}

interface HiddenStrength {
  /** Mean points this team contributes to its alliance */
  offense: number;
  /** 0..1: how good its autonomous routine is */
  auton: number;
}

interface EventSpec {
  id: number;
  name: string;
  seasonId: number;
  program: ProgramCode;
  level: EventLevel;
  /** Local date of day 1 (YYYY-MM-DD) */
  date: string;
  /** UTC offset of the venue, e.g. "-05:00" */
  utcOffset: string;
  place: Location & { venue: string };
  divisions: string[];
  teamCount: number;
  teamsPerAlliance: 1 | 2;
  matchesPerTeam: number;
  /** 0 = upcoming, 1 = completed, in between = qualifications in progress */
  playedFraction: number;
  /** Use these teams instead of a random sample */
  allTeams?: boolean;
}

const SPECS: EventSpec[] = [
  {
    id: DEMO_EVENT_ID,
    name: 'Override Signature Event (Demo)',
    seasonId: DEMO_SEASONS.V5RC_CURRENT,
    program: 'V5RC',
    level: 'Signature',
    date: '2026-10-17',
    utcOffset: '-05:00',
    place: { venue: 'Demo Convention Center', city: 'Austin', region: 'Texas', country: 'United States' },
    divisions: ['Science', 'Technology'],
    teamCount: 40,
    teamsPerAlliance: 2,
    matchesPerTeam: 8,
    playedFraction: 0.7,
    allTeams: true,
  },
  {
    id: 50002,
    name: 'Fall Kickoff Tournament (Demo)',
    seasonId: DEMO_SEASONS.V5RC_CURRENT,
    program: 'V5RC',
    level: 'Other',
    date: '2026-09-19',
    utcOffset: '-04:00',
    place: { venue: 'Maple Ridge Secondary Gym', city: 'Toronto', region: 'Ontario', country: 'Canada' },
    divisions: ['Division 1'],
    teamCount: 24,
    teamsPerAlliance: 2,
    matchesPerTeam: 6,
    playedFraction: 1,
  },
  {
    id: 50003,
    name: 'Regional Qualifier (Demo)',
    seasonId: DEMO_SEASONS.V5RC_CURRENT,
    program: 'V5RC',
    level: 'Regional',
    date: '2026-10-03',
    utcOffset: '-06:00',
    place: { venue: 'Centro de Robótica Demo', city: 'Monterrey', region: 'Nuevo León', country: 'Mexico' },
    divisions: ['Division 1'],
    teamCount: 24,
    teamsPerAlliance: 2,
    matchesPerTeam: 6,
    playedFraction: 1,
  },
  {
    id: 50004,
    name: 'Winter Classic (Demo)',
    seasonId: DEMO_SEASONS.V5RC_CURRENT,
    program: 'V5RC',
    level: 'Other',
    date: '2026-12-05',
    utcOffset: '+13:00',
    place: { venue: 'Harbor Prep Hall', city: 'Auckland', region: 'Auckland', country: 'New Zealand' },
    divisions: ['Division 1'],
    teamCount: 16,
    teamsPerAlliance: 2,
    matchesPerTeam: 6,
    playedFraction: 0,
  },
  {
    id: 50005,
    name: 'Shenzhen Invitational (Demo)',
    seasonId: DEMO_SEASONS.V5RC_CURRENT,
    program: 'V5RC',
    level: 'National',
    date: '2027-01-16',
    utcOffset: '+08:00',
    place: { venue: 'Demo Science Park', city: 'Shenzhen', region: 'Guangdong', country: 'China' },
    divisions: ['Division 1'],
    teamCount: 16,
    teamsPerAlliance: 2,
    matchesPerTeam: 6,
    playedFraction: 0,
  },
  {
    id: 40001,
    name: 'Push Back State Championship (Demo)',
    seasonId: DEMO_SEASONS.V5RC_PREVIOUS,
    program: 'V5RC',
    level: 'State',
    date: '2026-03-07',
    utcOffset: '-05:00',
    place: { venue: 'Demo Expo Hall', city: 'Columbus', region: 'Ohio', country: 'United States' },
    divisions: ['Division 1'],
    teamCount: 32,
    teamsPerAlliance: 2,
    matchesPerTeam: 8,
    playedFraction: 1,
  },
  {
    id: DEMO_VEXU_EVENT_ID,
    name: 'VEX U Override Invitational (Demo)',
    seasonId: DEMO_SEASONS.VURC_CURRENT,
    program: 'VURC',
    level: 'Signature',
    date: '2026-10-24',
    utcOffset: '-07:00',
    place: { venue: 'Demo Engineering Pavilion', city: 'San Jose', region: 'California', country: 'United States' },
    divisions: ['Division 1'],
    teamCount: 12,
    teamsPerAlliance: 1,
    matchesPerTeam: 8,
    playedFraction: 0.6,
    allTeams: true,
  },
  {
    id: 60002,
    name: 'VEX U Fall Scrimmage (Demo)',
    seasonId: DEMO_SEASONS.VURC_CURRENT,
    program: 'VURC',
    level: 'Other',
    date: '2026-09-26',
    utcOffset: '-07:00',
    place: { venue: 'Maple Leaf Polytechnic Arena', city: 'Vancouver', region: 'British Columbia', country: 'Canada' },
    divisions: ['Division 1'],
    teamCount: 10,
    teamsPerAlliance: 1,
    matchesPerTeam: 6,
    playedFraction: 1,
  },
];

const MATCH_MINUTES = 4;

/** Builds the whole demo world. Deterministic for a given seed. */
export function generateDemoWorld(seed = 2026): DemoWorld {
  const rng = new Rng(seed);
  const seasons = makeSeasons();
  const { teams, strength } = makeTeams(rng);

  const events: VexEvent[] = [];
  const eventTeams = new Map<number, number[]>();
  const matches: Match[] = [];
  const rankings: Ranking[] = [];
  const skills: SkillsEntry[] = [];
  const awards: Award[] = [];
  const ids = { match: 1, division: 1, award: 1 };

  for (const spec of SPECS) {
    const pool = teams.filter((t) => t.program === spec.program);
    const entrants = (spec.allTeams ? pool : rng.shuffle(pool).slice(0, spec.teamCount)).sort((a, b) =>
      a.number.localeCompare(b.number, undefined, { numeric: true }),
    );
    const divisions: Division[] = spec.divisions.map((name) => ({ id: ids.division++, name }));
    const event: VexEvent = {
      id: spec.id,
      sku: `RE-${spec.program}-${spec.seasonId === DEMO_SEASONS.V5RC_PREVIOUS || spec.seasonId === DEMO_SEASONS.VURC_PREVIOUS ? '25' : '26'}-${String(spec.id).slice(-4)}`,
      name: spec.name,
      start: `${spec.date}T08:00:00${spec.utcOffset}`,
      end: `${addDays(spec.date, divisions.length > 1 ? 1 : 0)}T18:00:00${spec.utcOffset}`,
      seasonId: spec.seasonId,
      program: spec.program,
      level: spec.level,
      location: spec.place,
      divisions,
    };
    events.push(event);
    eventTeams.set(event.id, entrants.map((t) => t.id));

    // Divisions are filled in team-number order, alternating (the manual requires sequential assignment).
    const byDivision = divisions.map((_, d) => entrants.filter((_, i) => i % divisions.length === d));
    const meta = new Map<number, MatchOutcomeMeta>();

    divisions.forEach((division, d) => {
      const divisionTeams = byDivision[d] ?? [];
      const divisionMatches = scheduleDivision(rng, spec, event, division, divisionTeams, ids, strength, meta);
      matches.push(...divisionMatches);
      rankings.push(...computeRankings(divisionMatches, meta));
    });

    if (spec.playedFraction > 0) skills.push(...makeSkills(rng, event, entrants, strength));
    if (spec.playedFraction >= 1) {
      awards.push(...makeAwards(rng, event, entrants, rankings.filter((r) => r.eventId === event.id), skills, ids));
    }
  }

  const worldSkills = makeWorldSkills(teams, events, skills);
  return { seasons, teams, events, eventTeams, matches, rankings, skills, awards, worldSkills };
}

function makeSeasons(): Season[] {
  return [
    { id: DEMO_SEASONS.V5RC_CURRENT, name: 'V5RC 2026-2027: Override', program: 'V5RC', start: '2026-04-25', end: '2027-04-30' },
    { id: DEMO_SEASONS.V5RC_PREVIOUS, name: 'V5RC 2025-2026: Push Back', program: 'V5RC', start: '2025-04-26', end: '2026-04-30' },
    { id: DEMO_SEASONS.VURC_CURRENT, name: 'VURC 2026-2027: Override', program: 'VURC', start: '2026-04-25', end: '2027-04-30' },
    { id: DEMO_SEASONS.VURC_PREVIOUS, name: 'VURC 2025-2026: Push Back', program: 'VURC', start: '2025-04-26', end: '2026-04-30' },
  ];
}

function makeTeams(rng: Rng): { teams: Team[]; strength: Map<number, HiddenStrength> } {
  const teams: Team[] = [];
  const strength = new Map<number, HiddenStrength>();
  const usedNumbers = new Set<string>();
  const names = rng.shuffle(TEAM_NAMES);
  let id = 1001;

  // 40 V5RC teams: 28 high school, 12 middle school. Some clubs field several lettered teams.
  for (let i = 0; i < 40; i++) {
    let number: string;
    do {
      number = `${rng.int(1, 99999)}${rng.pick(['A', 'A', 'B', 'C', 'D', 'X', 'Z'])}`;
    } while (usedNumbers.has(number));
    usedNumbers.add(number);
    const grade: Grade = i < 28 ? 'High School' : 'Middle School';
    const place = rng.pick(PLACES);
    const team: Team = {
      id: id++,
      number,
      name: names[i] ?? `Team ${i}`,
      robotName: rng.chance(0.5) ? rng.pick(['Atlas', 'Bolt', 'Comet', 'Dynamo', 'Echo', 'Fang', 'Gizmo', 'Halo']) : undefined,
      organization: rng.pick(ORGANIZATIONS.filter((o) => o.includes('Middle') === (grade === 'Middle School'))),
      location: { city: place.city, region: place.region, country: place.country },
      grade,
      program: 'V5RC',
      registered: true,
    };
    teams.push(team);
    strength.set(team.id, {
      offense: clamp(rng.normal(grade === 'High School' ? 34 : 27, 11), 6, 70),
      auton: clamp(rng.normal(0.5, 0.22), 0.05, 0.98),
    });
  }

  // 12 VEX U teams (team "numbers" are letters, e.g. NFU1).
  for (let i = 0; i < 12; i++) {
    const uni = UNIVERSITIES[i % UNIVERSITIES.length] ?? 'Demo University';
    const acronym = uni
      .split(/\s+/)
      .filter((w) => /^[A-Z]/.test(w) && !['of', 'del'].includes(w))
      .map((w) => w[0])
      .join('');
    const number = `${acronym}${Math.floor(i / UNIVERSITIES.length) + 1}`;
    const place = rng.pick(PLACES);
    const team: Team = {
      id: id++,
      number,
      name: names[40 + i] ?? `VEX U ${i}`,
      organization: uni,
      location: { city: place.city, region: place.region, country: place.country },
      grade: 'College',
      program: 'VURC',
      registered: true,
    };
    teams.push(team);
    strength.set(team.id, { offense: clamp(rng.normal(70, 18), 25, 130), auton: clamp(rng.normal(0.6, 0.2), 0.1, 0.98) });
  }

  return { teams, strength };
}

function scheduleDivision(
  rng: Rng,
  spec: EventSpec,
  event: VexEvent,
  division: Division,
  divisionTeams: Team[],
  ids: { match: number },
  strength: Map<number, HiddenStrength>,
  meta: Map<number, MatchOutcomeMeta>,
): Match[] {
  const perMatch = spec.teamsPerAlliance * 2;
  const perRound = Math.floor(divisionTeams.length / perMatch);
  const out: Match[] = [];
  if (perRound === 0) return out;

  const totalMatches = perRound * spec.matchesPerTeam;
  const playedCount = Math.round(totalMatches * spec.playedFraction);
  const dayStart = Date.parse(`${spec.date}T09:00:00${spec.utcOffset}`);
  const fieldNames = spec.divisions.length > 1 ? [`${division.name} 1`, `${division.name} 2`] : ['Field 1', 'Field 2'];

  let matchnum = 1;
  for (let round = 0; round < spec.matchesPerTeam; round++) {
    const order = rng.shuffle(divisionTeams);
    for (let k = 0; k < perRound; k++) {
      const group = order.slice(k * perMatch, (k + 1) * perMatch);
      const redTeams = group.slice(0, spec.teamsPerAlliance);
      const blueTeams = group.slice(spec.teamsPerAlliance);
      const scheduled = new Date(dayStart + (matchnum - 1) * MATCH_MINUTES * 60_000).toISOString();
      const played = matchnum <= playedCount;
      const id = ids.match++;

      let redScore: number | null = null;
      let blueScore: number | null = null;
      if (played) {
        redScore = simulateScore(rng, redTeams, strength);
        blueScore = simulateScore(rng, blueTeams, strength);
        meta.set(id, simulateAuton(rng, redTeams, blueTeams, strength));
      }

      out.push({
        id,
        eventId: event.id,
        divisionId: division.id,
        round: 'qualification',
        instance: 1,
        matchnum,
        name: `Q${matchnum}`,
        scheduled,
        started: played ? scheduled : null,
        field: fieldNames[(matchnum - 1) % fieldNames.length] ?? null,
        scored: played,
        red: { color: 'red', score: redScore, teams: redTeams.map((t) => ({ id: t.id, number: t.number, sitting: false })) },
        blue: { color: 'blue', score: blueScore, teams: blueTeams.map((t) => ({ id: t.id, number: t.number, sitting: false })) },
      });
      matchnum++;
    }
  }
  return out;
}

function simulateScore(rng: Rng, alliance: Team[], strength: Map<number, HiddenStrength>): number {
  const power = alliance.reduce((sum, t) => sum + (strength.get(t.id)?.offense ?? 20), 0);
  return Math.max(0, Math.round(power * rng.range(0.8, 1.15) + rng.normal(0, 6)));
}

function simulateAuton(rng: Rng, red: Team[], blue: Team[], strength: Map<number, HiddenStrength>): MatchOutcomeMeta {
  const autonOf = (alliance: Team[]) => alliance.reduce((s, t) => s + (strength.get(t.id)?.auton ?? 0.3), 0) / alliance.length;
  const r = autonOf(red) + rng.normal(0, 0.15);
  const b = autonOf(blue) + rng.normal(0, 0.15);
  const winner: AllianceColor | 'tie' = Math.abs(r - b) < 0.03 ? 'tie' : r > b ? 'red' : 'blue';
  return {
    autonWinner: winner,
    awp: { red: rng.chance(autonOf(red) * 0.55), blue: rng.chance(autonOf(blue) * 0.55) },
  };
}

function makeSkills(rng: Rng, event: VexEvent, entrants: Team[], strength: Map<number, HiddenStrength>): SkillsEntry[] {
  const runs: SkillsEntry[] = [];
  for (const team of entrants) {
    const s = strength.get(team.id);
    if (!s) continue;
    const ref: TeamRef = { id: team.id, number: team.number };
    if (rng.chance(0.9)) {
      runs.push({ eventId: event.id, team: ref, type: 'driver', score: Math.max(0, Math.round(s.offense * 2.1 + rng.normal(0, 8))), attempts: rng.int(1, 3), rank: 0 });
    }
    if (rng.chance(0.72)) {
      runs.push({ eventId: event.id, team: ref, type: 'programming', score: Math.max(0, Math.round(s.offense * s.auton * 2.2 + rng.normal(0, 6))), attempts: rng.int(1, 3), rank: 0 });
    }
  }
  for (const type of ['driver', 'programming'] as const) {
    runs
      .filter((r) => r.type === type)
      .sort((a, b) => b.score - a.score)
      .forEach((r, i) => (r.rank = i + 1));
  }
  return runs;
}

function makeAwards(rng: Rng, event: VexEvent, entrants: Team[], rankings: Ranking[], allSkills: SkillsEntry[], ids: { award: number }): Award[] {
  const ref = (t: TeamRef) => ({ id: t.id, number: t.number });
  const byRank = [...rankings].sort((a, b) => a.rank - b.rank);
  const eventSkills = allSkills.filter((s) => s.eventId === event.id);
  const combined = new Map<number, number>();
  for (const s of eventSkills) combined.set(s.team.id, (combined.get(s.team.id) ?? 0) + s.score);
  const skillsChamp = [...combined.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const qualifies = event.level === 'Signature' ? ['World Championship'] : ['Event Region Championship'];

  const used = new Set<number>();
  const take = (team: TeamRef | undefined): TeamRef[] => {
    if (!team) return [];
    used.add(team.id);
    return [ref(team)];
  };
  const randomUnused = () => {
    const pool = entrants.filter((t) => !used.has(t.id));
    return pool.length ? rng.pick(pool) : undefined;
  };

  const champions = [...take(byRank[0]?.team), ...take(byRank[3]?.team)];
  const finalists = [...take(byRank[1]?.team), ...take(byRank[2]?.team)];
  // Excellence: strongest all-rounder among the top third that isn't already a champion.
  const excellencePool = byRank.slice(0, Math.ceil(byRank.length / 3)).filter((r) => !used.has(r.team.id) && combined.has(r.team.id));
  const excellence = excellencePool.sort((a, b) => (combined.get(b.team.id) ?? 0) - (combined.get(a.team.id) ?? 0))[0]?.team;

  const list: Array<[string, TeamRef[], string[]]> = [
    [AWARD_TITLES.excellence, take(excellence), qualifies],
    [AWARD_TITLES.champions, champions, qualifies],
    [AWARD_TITLES.finalists, finalists, []],
    [AWARD_TITLES.skills, skillsChamp ? take(entrants.find((t) => t.id === skillsChamp)) : [], qualifies],
    [AWARD_TITLES.design, take(randomUnused()), qualifies],
    [AWARD_TITLES.think, take(randomUnused()), []],
    [AWARD_TITLES.innovate, take(randomUnused()), []],
    [AWARD_TITLES.amaze, take(randomUnused()), []],
    [AWARD_TITLES.judges, take(randomUnused()), []],
  ];

  return list
    .filter(([, teams]) => teams.length > 0)
    .map(([title, teams, qualifications]) => ({
      id: ids.award++,
      eventId: event.id,
      title,
      qualifications,
      teams: teams.map((t) => ({ ...t, divisionId: event.divisions[0]?.id })),
      individuals: [],
    }));
}

/** Global skills: best combined score from a single event (manual rule T24), current seasons only. */
function makeWorldSkills(teams: Team[], events: VexEvent[], skills: SkillsEntry[]): Map<number, WorldSkillsEntry[]> {
  const out = new Map<number, WorldSkillsEntry[]>();
  for (const seasonId of [DEMO_SEASONS.V5RC_CURRENT, DEMO_SEASONS.VURC_CURRENT]) {
    const seasonEvents = new Set(events.filter((e) => e.seasonId === seasonId).map((e) => e.id));
    const best = new Map<number, { driver: number; programming: number }>();
    for (const eventId of seasonEvents) {
      const perTeam = new Map<number, { driver: number; programming: number }>();
      for (const s of skills.filter((x) => x.eventId === eventId)) {
        const cur = perTeam.get(s.team.id) ?? { driver: 0, programming: 0 };
        cur[s.type] = Math.max(cur[s.type], s.score);
        perTeam.set(s.team.id, cur);
      }
      for (const [teamId, sc] of perTeam) {
        const prev = best.get(teamId);
        if (!prev || sc.driver + sc.programming > prev.driver + prev.programming) best.set(teamId, sc);
      }
    }
    const entries: WorldSkillsEntry[] = [];
    for (const [teamId, sc] of best) {
      const team = teams.find((t) => t.id === teamId);
      if (!team) continue;
      entries.push({
        rank: 0,
        team: { id: team.id, number: team.number, name: team.name },
        location: team.location,
        grade: team.grade,
        combined: sc.driver + sc.programming,
        driver: sc.driver,
        programming: sc.programming,
      });
    }
    entries.sort((a, b) => b.combined - a.combined || b.programming - a.programming).forEach((e, i) => (e.rank = i + 1));
    out.set(seasonId, entries);
  }
  return out;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
