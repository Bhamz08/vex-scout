import type {
  Award,
  EventFilter,
  Grade,
  Match,
  ProgramCode,
  Ranking,
  Season,
  SkillsEntry,
  Team,
  VexEvent,
  WorldSkillsEntry,
} from './types';

/**
 * Everything the UI needs from a data provider. Two implementations:
 *  - DemoDataSource: deterministic generated data, no network.
 *  - LiveDataSource: VEX Events API v2 through our serverless proxy.
 *
 * Methods return domain types (see types.ts), never raw API payloads.
 */
export interface DataSource {
  readonly kind: 'demo' | 'live';

  getSeasons(program: ProgramCode): Promise<Season[]>;

  /** Exact lookup by team number, e.g. "1234A". Returns null if no such team. */
  findTeam(number: string, program: ProgramCode): Promise<Team | null>;
  getTeam(teamId: number): Promise<Team | null>;
  getTeamEvents(teamId: number, seasonId?: number): Promise<VexEvent[]>;
  getTeamMatches(teamId: number, seasonId?: number): Promise<Match[]>;
  getTeamRankings(teamId: number, seasonId?: number): Promise<Ranking[]>;
  getTeamSkills(teamId: number, seasonId?: number): Promise<SkillsEntry[]>;
  getTeamAwards(teamId: number, seasonId?: number): Promise<Award[]>;

  searchEvents(filter: EventFilter): Promise<VexEvent[]>;
  getEvent(eventId: number): Promise<VexEvent | null>;
  getEventTeams(eventId: number): Promise<Team[]>;
  getDivisionMatches(eventId: number, divisionId: number): Promise<Match[]>;
  getDivisionRankings(eventId: number, divisionId: number): Promise<Ranking[]>;
  getEventSkills(eventId: number): Promise<SkillsEntry[]>;
  getEventAwards(eventId: number): Promise<Award[]>;

  getWorldSkills(seasonId: number, grade: Grade): Promise<WorldSkillsEntry[]>;

  /**
   * Matches to compute season-wide ratings (TrueSkill) from. There is no API endpoint for "every match
   * in a season", so the live source returns the matches cached on this device; the demo returns all.
   */
  getRatingMatches(seasonId: number): Promise<Match[]>;
}

/** Program mode → API program + grade filter. */
export function programFilter(mode: 'V5RC_HS' | 'V5RC_MS' | 'VEXU'): { program: ProgramCode; grade: Grade } {
  switch (mode) {
    case 'V5RC_HS':
      return { program: 'V5RC', grade: 'High School' };
    case 'V5RC_MS':
      return { program: 'V5RC', grade: 'Middle School' };
    case 'VEXU':
      return { program: 'VURC', grade: 'College' };
  }
}
