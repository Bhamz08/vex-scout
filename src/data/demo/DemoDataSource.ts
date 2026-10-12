import type { DataSource } from '../DataSource';
import type { EventFilter, Grade, ProgramCode, VexEvent } from '../types';
import { generateDemoWorld, type DemoWorld } from './generator';

/**
 * Serves generated data from memory. Every method mirrors what LiveDataSource would return,
 * so all screens work with no API key.
 */
export class DemoDataSource implements DataSource {
  readonly kind = 'demo' as const;
  private world: DemoWorld | null = null;

  constructor(private readonly seed = 2026) {}

  /** Generated lazily so importing the module stays cheap. */
  private get w(): DemoWorld {
    this.world ??= generateDemoWorld(this.seed);
    return this.world;
  }

  private eventsInSeason(seasonId?: number): Set<number> {
    return new Set(this.w.events.filter((e) => seasonId === undefined || e.seasonId === seasonId).map((e) => e.id));
  }

  async getSeasons(program: ProgramCode) {
    return this.w.seasons.filter((s) => s.program === program);
  }

  async findTeam(number: string, program: ProgramCode) {
    const n = number.trim().toUpperCase();
    return this.w.teams.find((t) => t.program === program && t.number.toUpperCase() === n) ?? null;
  }

  async getTeam(teamId: number) {
    return this.w.teams.find((t) => t.id === teamId) ?? null;
  }

  async getTeamEvents(teamId: number, seasonId?: number) {
    return this.w.events
      .filter((e) => (seasonId === undefined || e.seasonId === seasonId) && this.w.eventTeams.get(e.id)?.includes(teamId))
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  async getTeamMatches(teamId: number, seasonId?: number) {
    const events = this.eventsInSeason(seasonId);
    return this.w.matches.filter(
      (m) => events.has(m.eventId) && [...m.red.teams, ...m.blue.teams].some((t) => t.id === teamId),
    );
  }

  async getTeamRankings(teamId: number, seasonId?: number) {
    const events = this.eventsInSeason(seasonId);
    return this.w.rankings.filter((r) => r.team.id === teamId && events.has(r.eventId));
  }

  async getTeamSkills(teamId: number, seasonId?: number) {
    const events = this.eventsInSeason(seasonId);
    return this.w.skills.filter((s) => s.team.id === teamId && events.has(s.eventId));
  }

  async getTeamAwards(teamId: number, seasonId?: number) {
    const events = this.eventsInSeason(seasonId);
    return this.w.awards.filter((a) => events.has(a.eventId) && a.teams.some((t) => t.id === teamId));
  }

  async searchEvents(filter: EventFilter): Promise<VexEvent[]> {
    const q = filter.query?.trim().toLowerCase();
    return this.w.events
      .filter((e) => e.program === filter.program && e.seasonId === filter.seasonId)
      .filter((e) => !filter.level || e.level === filter.level)
      .filter((e) => !filter.country || e.location.country === filter.country)
      .filter((e) => !filter.region || e.location.region === filter.region)
      .filter((e) => !filter.grade || this.eventHasGrade(e.id, filter.grade))
      .filter((e) => !q || [e.name, e.sku, e.location.city].some((s) => s.toLowerCase().includes(q)))
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  private eventHasGrade(eventId: number, grade: Grade): boolean {
    const ids = this.w.eventTeams.get(eventId) ?? [];
    return this.w.teams.some((t) => ids.includes(t.id) && t.grade === grade);
  }

  async getEvent(eventId: number) {
    return this.w.events.find((e) => e.id === eventId) ?? null;
  }

  async getEventTeams(eventId: number) {
    const ids = new Set(this.w.eventTeams.get(eventId) ?? []);
    return this.w.teams.filter((t) => ids.has(t.id));
  }

  async getDivisionMatches(eventId: number, divisionId: number) {
    return this.w.matches.filter((m) => m.eventId === eventId && m.divisionId === divisionId);
  }

  async getDivisionRankings(eventId: number, divisionId: number) {
    return this.w.rankings.filter((r) => r.eventId === eventId && r.divisionId === divisionId).sort((a, b) => a.rank - b.rank);
  }

  async getEventSkills(eventId: number) {
    return this.w.skills.filter((s) => s.eventId === eventId);
  }

  async getEventAwards(eventId: number) {
    return this.w.awards.filter((a) => a.eventId === eventId);
  }

  async getWorldSkills(seasonId: number, grade: Grade) {
    return (this.w.worldSkills.get(seasonId) ?? [])
      .filter((e) => e.grade === grade)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  }
}
