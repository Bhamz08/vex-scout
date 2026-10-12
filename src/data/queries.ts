import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useSettings } from '@/features/settings/store';
import { cachedFetch, type Cached } from './cache';
import { programFilter, type DataSource } from './DataSource';
import type { EventFilter, Grade, Match, ProgramCode, Season } from './types';
import { useDataSource } from './useDataSource';

/**
 * React Query wrapper around the active DataSource. Live data goes through the IndexedDB cache
 * (network-first, offline fallback); demo data is generated in memory and needs no cache.
 * Every result carries `fetchedAt` for "last updated" labels.
 */
function dataQueryOptions<T>(ds: DataSource, key: readonly unknown[], fn: (ds: DataSource) => Promise<T>, enabled = true) {
  return {
    queryKey: [ds.kind, ...key],
    enabled,
    queryFn: async (): Promise<Cached<T>> =>
      ds.kind === 'demo' ? { data: await fn(ds), fetchedAt: Date.now(), fromCache: false } : cachedFetch(JSON.stringify(key), () => fn(ds)),
  };
}

function useDataQuery<T>(key: readonly unknown[], fn: (ds: DataSource) => Promise<T>, enabled = true): UseQueryResult<Cached<T>> {
  const ds = useDataSource();
  return useQuery(dataQueryOptions(ds, key, fn, enabled));
}

/** The season currently in effect: the user's pick, otherwise the one running today (or the newest). */
export function pickCurrentSeason(seasons: Season[], now = new Date()): Season | undefined {
  const today = now.toISOString().slice(0, 10);
  const sorted = [...seasons].sort((a, b) => b.start.localeCompare(a.start));
  return sorted.find((s) => s.start.slice(0, 10) <= today && today <= s.end.slice(0, 10)) ?? sorted[0];
}

export function useSeasons(program: ProgramCode) {
  return useDataQuery(['seasons', program], (ds) => ds.getSeasons(program));
}

export interface ActiveSeason {
  program: ProgramCode;
  grade: Grade;
  seasonId: number | undefined;
  season: Season | undefined;
  seasons: Season[];
  isLoading: boolean;
}

/** Program, grade and season derived from settings. Most screens start from this. */
export function useActiveSeason(): ActiveSeason {
  const mode = useSettings((s) => s.program);
  const chosen = useSettings((s) => s.seasonId);
  const { program, grade } = programFilter(mode);
  const q = useSeasons(program);
  const seasons = q.data?.data ?? [];
  const season = seasons.find((s) => s.id === chosen) ?? pickCurrentSeason(seasons);
  return { program, grade, seasonId: season?.id, season, seasons, isLoading: q.isLoading };
}

export const useTeamByNumber = (number: string | undefined, program: ProgramCode) =>
  useDataQuery(['team', program, number], (ds) => ds.findTeam(number ?? '', program), !!number);

export const useTeamEvents = (teamId: number | undefined, seasonId?: number) =>
  useDataQuery(['teamEvents', teamId, seasonId], (ds) => ds.getTeamEvents(teamId ?? 0, seasonId), teamId !== undefined);

export const useTeamMatches = (teamId: number | undefined, seasonId?: number) =>
  useDataQuery(['teamMatches', teamId, seasonId], (ds) => ds.getTeamMatches(teamId ?? 0, seasonId), teamId !== undefined);

export const useTeamRankings = (teamId: number | undefined, seasonId?: number) =>
  useDataQuery(['teamRankings', teamId, seasonId], (ds) => ds.getTeamRankings(teamId ?? 0, seasonId), teamId !== undefined);

export const useTeamSkills = (teamId: number | undefined, seasonId?: number) =>
  useDataQuery(['teamSkills', teamId, seasonId], (ds) => ds.getTeamSkills(teamId ?? 0, seasonId), teamId !== undefined);

export const useTeamAwards = (teamId: number | undefined, seasonId?: number) =>
  useDataQuery(['teamAwards', teamId, seasonId], (ds) => ds.getTeamAwards(teamId ?? 0, seasonId), teamId !== undefined);

export const useEventSearch = (filter: EventFilter | undefined) =>
  useDataQuery(['events', filter], (ds) => ds.searchEvents(filter as EventFilter), !!filter);

export const useEvent = (eventId: number) => useDataQuery(['event', eventId], (ds) => ds.getEvent(eventId));

export const useEventTeams = (eventId: number, enabled = true) =>
  useDataQuery(['eventTeams', eventId], (ds) => ds.getEventTeams(eventId), enabled);

export const useDivisionMatches = (eventId: number, divisionId: number | undefined) =>
  useDataQuery(['matches', eventId, divisionId], (ds) => ds.getDivisionMatches(eventId, divisionId ?? 0), divisionId !== undefined);

export const useDivisionRankings = (eventId: number, divisionId: number | undefined) =>
  useDataQuery(['rankings', eventId, divisionId], (ds) => ds.getDivisionRankings(eventId, divisionId ?? 0), divisionId !== undefined);

export const useEventSkills = (eventId: number) => useDataQuery(['eventSkills', eventId], (ds) => ds.getEventSkills(eventId));

export const useEventAwards = (eventId: number) => useDataQuery(['eventAwards', eventId], (ds) => ds.getEventAwards(eventId));

/** Season matches for several teams at once (used for historical ratings). Keyed per team so results are shared. */
export function useTeamsMatches(teamIds: number[], seasonId: number | undefined, enabled = true): { byTeam: Map<number, Match[]>; isLoading: boolean } {
  const ds = useDataSource();
  const results = useQueries({
    queries: teamIds.map((id) => dataQueryOptions(ds, ['teamMatches', id, seasonId], (d) => d.getTeamMatches(id, seasonId), enabled && seasonId !== undefined)),
  });
  // Rebuild the map only when some team's data actually changed, so consumers can memoize on it.
  const version = results.map((r) => r.dataUpdatedAt).join(',');
  const byTeam = useMemo(() => {
    const map = new Map<number, Match[]>();
    results.forEach((r, i) => {
      const id = teamIds[i];
      if (id !== undefined && r.data) map.set(id, r.data.data);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` captures every change to `results`
  }, [version, teamIds]);
  return { byTeam, isLoading: enabled && results.some((r) => r.isLoading) };
}

export const useRatingMatches = (seasonId: number | undefined) =>
  useDataQuery(['ratingMatches', seasonId], (ds) => ds.getRatingMatches(seasonId ?? 0), seasonId !== undefined);

export const useWorldSkills =(seasonId: number | undefined, grade: Grade) =>
  useDataQuery(['worldSkills', seasonId, grade], (ds) => ds.getWorldSkills(seasonId ?? 0, grade), seasonId !== undefined);
