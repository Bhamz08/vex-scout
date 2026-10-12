import { useMemo } from 'react';
import { useDivisionMatches, useTeamsMatches } from '@/data/queries';
import type { Division, Match, VexEvent } from '@/data/types';
import { computeTeamStats, type TeamStats } from '@/lib/stats/opr';
import { blendRatings, estimateMarginSigma, historicalRating, predictMatch, ratingFromStats, type Prediction, type TeamRating } from '@/lib/stats/predict';

export interface DivisionModel {
  matches: Match[];
  stats: Map<number, TeamStats>;
  /** Blended rating (current event + history when enabled) */
  ratingOf: (teamId: number) => TeamRating;
  /** Matches of history behind each team's rating */
  historyMatches: (teamId: number) => number;
  sigma: number;
  predict: (match: Match) => Prediction;
}

/**
 * Everything computed from one division's match list: OPR/DPR/CCWM and a prediction model.
 * With `useHistory`, each team's ratings are blended with its results at earlier events this season.
 */
export function useDivisionModel(event: VexEvent, division: Division | undefined, useHistory = false) {
  const matchesQ = useDivisionMatches(event.id, division?.id);
  const matches = matchesQ.data?.data;

  const teamIds = useMemo(() => [...new Set((matches ?? []).flatMap((m) => [...m.red.teams, ...m.blue.teams].map((t) => t.id)))], [matches]);
  const history = useTeamsMatches(teamIds, event.seasonId, useHistory);

  const model = useMemo<DivisionModel | undefined>(() => {
    if (!matches) return undefined;
    const stats = computeTeamStats(matches);
    const hist = new Map<number, ReturnType<typeof historicalRating>>();
    if (useHistory) for (const [id, list] of history.byTeam) hist.set(id, historicalRating(list, id, event.id));

    const ratingOf = (teamId: number) => {
      const s = stats.get(teamId);
      return blendRatings(ratingFromStats(s), s?.played ?? 0, hist.get(teamId)?.rating);
    };
    const sigma = estimateMarginSigma(matches, ratingOf, stats.size);
    return {
      matches,
      stats,
      ratingOf,
      historyMatches: (id) => hist.get(id)?.matches ?? 0,
      sigma,
      predict: (m) => predictMatch(m.red.teams.map((t) => ratingOf(t.id)), m.blue.teams.map((t) => ratingOf(t.id)), sigma),
    };
  }, [matches, history.byTeam, useHistory, event.id]);

  return { model, query: matchesQ, historyLoading: history.isLoading };
}
