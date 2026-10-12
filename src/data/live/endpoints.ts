/**
 * VEX Events API v2 endpoint contract.
 *
 * ✔ VERIFIED against the official OpenAPI spec ("Public VEX Events API", swagger v1.0.21):
 *   - base URL https://events.vex.com/api/v2, HTTP Bearer auth (added server-side by api/vex/[...path].ts)
 *   - pagination via `page` / `per_page` (default 25, max 250); responses are { meta: PageMeta, data: [...] }
 *   - every path and query parameter below, array params as `name[]` (form style, exploded)
 *   - match round codes (1 practice, 2 qualification, 3 QF, 4 SF, 5 F, 6 R16)
 *
 * ⚠ NOT IN THE SPEC (still assumptions):
 *   - program ids: resolved at runtime from GET /programs by abbreviation; FALLBACK_PROGRAM_IDS is only used
 *     if that call fails
 *   - World Skills standings: the API has no endpoint for them, see api/world-skills.ts
 *   - rate limits and CORS are not documented; the proxy passes 429s through and the browser never calls
 *     the API directly, so CORS does not matter
 */
import type { EventLevel, Grade, ProgramCode } from '../types';

/** Our serverless proxy (api/vex/[...path].ts). */
export const PROXY_BASE = '/api/vex';
/** Separate proxy for the public World Skills standings (api/world-skills.ts). */
export const WORLD_SKILLS_PROXY = '/api/world-skills';

/** Used only if GET /programs fails. These are the long-standing RobotEvents ids. */
export const FALLBACK_PROGRAM_IDS: Record<ProgramCode, number> = { V5RC: 1, VURC: 4 };
/** Kept for mapping embedded program refs that lack a `code`. */
export const PROGRAM_IDS = FALLBACK_PROGRAM_IDS;

/** Maximum page size accepted by the API (spec: "per_page default is 25 with a maximum of 250"). */
export const PAGE_SIZE = 250;

type Query = Record<string, string | number | Array<string | number> | undefined>;
export interface Endpoint {
  path: string;
  query?: Query;
}

const season = (seasonId?: number): Query => (seasonId === undefined ? {} : { 'season[]': seasonId });

export const endpoints = {
  programs: (): Endpoint => ({ path: '/programs' }),
  seasons: (programId: number): Endpoint => ({ path: '/seasons', query: { 'program[]': programId } }),
  teamsByNumber: (number: string, programId: number): Endpoint => ({
    path: '/teams',
    query: { 'number[]': number, 'program[]': programId },
  }),
  team: (teamId: number): Endpoint => ({ path: `/teams/${teamId}` }),
  teamEvents: (teamId: number, seasonId?: number): Endpoint => ({ path: `/teams/${teamId}/events`, query: season(seasonId) }),
  teamMatches: (teamId: number, seasonId?: number): Endpoint => ({ path: `/teams/${teamId}/matches`, query: season(seasonId) }),
  teamRankings: (teamId: number, seasonId?: number): Endpoint => ({ path: `/teams/${teamId}/rankings`, query: season(seasonId) }),
  teamSkills: (teamId: number, seasonId?: number): Endpoint => ({ path: `/teams/${teamId}/skills`, query: season(seasonId) }),
  teamAwards: (teamId: number, seasonId?: number): Endpoint => ({ path: `/teams/${teamId}/awards`, query: season(seasonId) }),
  /** The spec notes that more than one `level[]` value matches nothing, so at most one is sent. */
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
  /** ⚠ Not part of the API; served by our own api/world-skills.ts function. */
  worldSkills: (seasonId: number, grade: Grade): Endpoint => ({ path: '', query: { season: seasonId, grade } }),
};

/** Match `round` codes from the spec. Anything else (e.g. higher elimination rounds) maps to "other". */
export const ROUND_CODES: Record<number, 'practice' | 'qualification' | 'quarterfinal' | 'semifinal' | 'final' | 'r16'> = {
  1: 'practice',
  2: 'qualification',
  3: 'quarterfinal',
  4: 'semifinal',
  5: 'final',
  6: 'r16',
};
