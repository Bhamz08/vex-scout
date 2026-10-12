import { z } from 'zod';
import type { DataSource } from '../DataSource';
import { db } from '../db';
import type { EventFilter, Grade, Match, ProgramCode, SkillsEntry, VexEvent } from '../types';
import { ApiError, getAll, getOne } from './client';
import { endpoints, FALLBACK_PROGRAM_IDS, WORLD_SKILLS_PROXY } from './endpoints';
import { toAward, toEvent, toMatch, toRanking, toSeason, toSkills, toTeam, toWorldSkills } from './mappers';
import { AwardSchema, EventSchema, ProgramSchema, MatchSchema, RankingSchema, SeasonSchema, SkillsSchema, TeamSchema, WorldSkillsRowSchema } from './schemas';

/** VEX Events API v2 via our proxy. See endpoints.ts for the wire contract. */
export class LiveDataSource implements DataSource {
  readonly kind = 'live' as const;
  private programIds: Promise<Record<ProgramCode, number>> | null = null;

  /** Program ids aren't fixed by the spec, so look them up once by abbreviation ("V5RC", "VURC"). */
  private async programId(code: ProgramCode): Promise<number> {
    this.programIds ??= getAll(ProgramSchema, endpoints.programs(), 2)
      .then((programs) => {
        const find = (abbr: string) => programs.find((p) => p.abbr?.toUpperCase() === abbr)?.id;
        return { V5RC: find('V5RC') ?? FALLBACK_PROGRAM_IDS.V5RC, VURC: find('VURC') ?? FALLBACK_PROGRAM_IDS.VURC };
      })
      .catch(() => {
        this.programIds = null; // retry next time
        return FALLBACK_PROGRAM_IDS;
      });
    return (await this.programIds)[code];
  }

  async getSeasons(program: ProgramCode) {
    return (await getAll(SeasonSchema, endpoints.seasons(await this.programId(program)))).map(toSeason);
  }

  async findTeam(number: string, program: ProgramCode) {
    const rows = await getAll(TeamSchema, endpoints.teamsByNumber(number.trim().toUpperCase(), await this.programId(program)), 1);
    const team = rows[0];
    return team ? toTeam(team) : null;
  }

  async getTeam(teamId: number) {
    try {
      return toTeam(await getOne(TeamSchema, endpoints.team(teamId)));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }

  async getTeamEvents(teamId: number, seasonId?: number) {
    return (await getAll(EventSchema, endpoints.teamEvents(teamId, seasonId))).map(toEvent);
  }

  async getTeamMatches(teamId: number, seasonId?: number) {
    return (await getAll(MatchSchema, endpoints.teamMatches(teamId, seasonId))).map(toMatch);
  }

  async getTeamRankings(teamId: number, seasonId?: number) {
    return (await getAll(RankingSchema, endpoints.teamRankings(teamId, seasonId))).map(toRanking);
  }

  async getTeamSkills(teamId: number, seasonId?: number) {
    return (await getAll(SkillsSchema, endpoints.teamSkills(teamId, seasonId))).map(toSkills).filter((s): s is SkillsEntry => s !== null);
  }

  async getTeamAwards(teamId: number, seasonId?: number) {
    return (await getAll(AwardSchema, endpoints.teamAwards(teamId, seasonId))).map(toAward);
  }

  async searchEvents(filter: EventFilter) {
    const events = (await getAll(EventSchema, endpoints.events(filter.seasonId, filter.level, filter.region))).map(toEvent);
    const q = filter.query?.trim().toLowerCase();
    // Country and text filters are applied client-side (not known to be supported by the API).
    // Grade is not part of the event payload, so it can't be filtered here.
    return events
      .filter((e) => e.program === filter.program)
      .filter((e) => !filter.country || e.location.country === filter.country)
      .filter((e) => !q || [e.name, e.sku, e.location.city].some((s) => s.toLowerCase().includes(q)))
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  async getEvent(eventId: number) {
    try {
      return toEvent(await getOne(EventSchema, endpoints.event(eventId)));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }

  async getEventTeams(eventId: number) {
    return (await getAll(TeamSchema, endpoints.eventTeams(eventId))).map(toTeam);
  }

  async getDivisionMatches(eventId: number, divisionId: number) {
    return (await getAll(MatchSchema, endpoints.divisionMatches(eventId, divisionId))).map(toMatch);
  }

  async getDivisionRankings(eventId: number, divisionId: number) {
    return (await getAll(RankingSchema, endpoints.divisionRankings(eventId, divisionId))).map(toRanking).sort((a, b) => a.rank - b.rank);
  }

  async getEventSkills(eventId: number) {
    return (await getAll(SkillsSchema, endpoints.eventSkills(eventId))).map(toSkills).filter((s): s is SkillsEntry => s !== null);
  }

  async getEventAwards(eventId: number) {
    return (await getAll(AwardSchema, endpoints.eventAwards(eventId))).map(toAward);
  }

  /** Every match list cached on this device (division and team match lists), de-duplicated, for one season. */
  async getRatingMatches(seasonId: number) {
    const rows = await db.cache.toArray();
    const seasonEvents = new Set<number>();
    for (const r of rows) {
      const key = JSON.parse(r.key) as unknown[];
      const event = r.data as VexEvent | null;
      if (key[0] === 'event' && event?.seasonId === seasonId) seasonEvents.add(event.id);
    }
    const matches = new Map<number, Match>();
    for (const r of rows) {
      const key = JSON.parse(r.key) as unknown[];
      if (key[0] !== 'matches' && key[0] !== 'teamMatches') continue;
      for (const m of r.data as Match[]) if (seasonEvents.has(m.eventId)) matches.set(m.id, m);
    }
    return [...matches.values()];
  }

  async getWorldSkills(seasonId: number, grade: Grade) {
    const rows = await getOne(z.array(WorldSkillsRowSchema), endpoints.worldSkills(seasonId, grade), WORLD_SKILLS_PROXY);
    return rows.map(toWorldSkills);
  }
}
