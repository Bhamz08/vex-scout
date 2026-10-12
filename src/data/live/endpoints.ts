/**
 * ⚠ ASSUMED API CONTRACT — VERIFY AGAINST THE VEX EVENTS API v2 DOCS ⚠
 *
 * No API docs were available when this was written. Paths, query parameter names and program ids
 * below follow the RobotEvents API v2 (the predecessor of the VEX Events API). When you get access,
 * check each entry here and the shapes in schemas.ts; nothing else in the app knows about the wire format.
 *
 * Auth is NOT handled here: the browser calls our own proxy (/api/vex/...), which adds the key server-side.
 */
import type { EventLevel, Grade, ProgramCode } from '../types';

/** Our serverless proxy (api/vex/[...path].ts). */
export const PROXY_BASE = '/api/vex';
/** Separate proxy for the public World Skills standings (api/world-skills.ts). */
export const WORLD_SKILLS_PROXY = '/api/world-skills';

/** ASSUMED: RobotEvents program ids. */
export const PROGRAM_IDS: Record<ProgramCode, number> = { V5RC: 1, VURC: 4 };

/** ASSUMED: maximum page size accepted by the API. */
export const PAGE_SIZE = 250;

type Query = Record<string, string | number | Array<string | number> | undefined>;
export interface Endpoint {
  path: string;
  query?: Query;
}

const season = (seasonId?: number): Query => (seasonId === undefined ? {} : { 'season[]': seasonId });

export const endpoints = {
  seasons: (program: ProgramCode): Endpoint => ({ path: '/seasons', query: { 'program[]': PROGRAM_IDS[program] } }),
  teamsByNumber: (number: string, program: ProgramCode): Endpoint => ({
    path: '/teams',
    query: { 'number[]': number, 'program[]': PROGRAM_IDS[program] },
  }),
  team: (teamId: number): Endpoint => ({ path: `/teams/${teamId}` }),
  teamEvents: (teamId: number, seasonId?: number): Endpoint => ({ path: `/teams/${teamId}/events`, query: season(seasonId) }),
  teamMatches: (teamId: number, seasonId?: number): Endpoint => ({ path: `/teams/${teamId}/matches`, query: season(seasonId) }),
  teamRankings: (teamId: number, seasonId?: number): Endpoint => ({ path: `/teams/${teamId}/rankings`, query: season(seasonId) }),
  teamSkills: (teamId: number, seasonId?: number): Endpoint => ({ path: `/teams/${teamId}/skills`, query: season(seasonId) }),
  teamAwards: (teamId: number, seasonId?: number): Endpoint => ({ path: `/teams/${teamId}/awards`, query: season(seasonId) }),
  events: (seasonId: number, level?: EventLevel, region?: string): Endpoint => ({
    path: '/events',
    query: { 'season[]': seasonId, 'level[]': level, region },
  }),
  event: (eventId: number): Endpoint => ({ path: `/events/${eventId}` }),
  eventTeams: (eventId: number): Endpoint => ({ path: `/events/${eventId}/teams` }),
  divisionMatches: (eventId: number, divisionId: number): Endpoint => ({ path: `/events/${eventId}/divisions/${divisionId}/matches` }),
  divisionRankings: (eventId: number, divisionId: number): Endpoint => ({ path: `/events/${eventId}/divisions/${divisionId}/rankings` }),
  eventSkills: (eventId: number): Endpoint => ({ path: `/events/${eventId}/skills` }),
  eventAwards: (eventId: number): Endpoint => ({ path: `/events/${eventId}/awards` }),
  /** ASSUMED: the public standings page's JSON feed, proxied because it does not send CORS headers. */
  worldSkills: (seasonId: number, grade: Grade): Endpoint => ({ path: '', query: { season: seasonId, grade } }),
};

/** ASSUMED: RobotEvents round numbers. */
export const ROUND_CODES: Record<number, 'practice' | 'qualification' | 'quarterfinal' | 'semifinal' | 'final' | 'r16'> = {
  1: 'practice',
  2: 'qualification',
  3: 'quarterfinal',
  4: 'semifinal',
  5: 'final',
  6: 'r16',
};
