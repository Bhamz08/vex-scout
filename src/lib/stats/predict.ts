import type { Match } from '@/data/types';
import { normalCdf } from './normal';
import type { TeamStats } from './opr';

/** A team's per-match contribution estimates used for prediction. */
export interface TeamRating {
  /** expected points added to its alliance (OPR-like) */
  offense: number;
  /** expected contribution to the winning margin (CCWM-like) */
  margin: number;
}

export interface Prediction {
  redScore: number;
  blueScore: number;
  /** expected red − blue */
  margin: number;
  /** P(red wins); ties are rare and split evenly */
  redWinProbability: number;
}

/** Spread of real margins around predictions when we can't estimate it from data. */
export const DEFAULT_MARGIN_SIGMA = 18;
const MIN_SIGMA = 5;

/**
 * Margin is modelled as Normal(μ, σ²). μ averages the OPR difference and the CCWM difference, which
 * keeps one noisy estimate from dominating early in an event.
 */
export function predictMatch(red: TeamRating[], blue: TeamRating[], sigma = DEFAULT_MARGIN_SIGMA): Prediction {
  const sum = (xs: TeamRating[], k: keyof TeamRating) => xs.reduce((s, x) => s + x[k], 0);
  const redScore = Math.max(0, sum(red, 'offense'));
  const blueScore = Math.max(0, sum(blue, 'offense'));
  const margin = 0.5 * (sum(red, 'offense') - sum(blue, 'offense')) + 0.5 * (sum(red, 'margin') - sum(blue, 'margin'));
  return { redScore, blueScore, margin, redWinProbability: normalCdf(margin / Math.max(MIN_SIGMA, sigma)) };
}

/**
 * Shrinks the current-event estimate toward a historical one while the event sample is small:
 * weight on current = n / (n + k). With no history, the current estimate is used as-is.
 */
export function blendRatings(current: TeamRating | undefined, currentMatches: number, historical: TeamRating | undefined, k = 3): TeamRating {
  if (!historical) return current ?? { offense: 0, margin: 0 };
  if (!current || currentMatches === 0) return historical;
  const w = currentMatches / (currentMatches + k);
  return {
    offense: w * current.offense + (1 - w) * historical.offense,
    margin: w * current.margin + (1 - w) * historical.margin,
  };
}

export function ratingFromStats(s: TeamStats | undefined): TeamRating | undefined {
  return s ? { offense: s.opr, margin: s.ccwm } : undefined;
}

/**
 * Simple historical rating from a team's own past matches (other events): average alliance score and
 * margin, divided evenly among alliance members. Rougher than OPR, but needs only the team's matches.
 */
export function historicalRating(matches: Match[], teamId: number, excludeEventId?: number): { rating: TeamRating; matches: number } | undefined {
  let offense = 0;
  let margin = 0;
  let n = 0;
  for (const m of matches) {
    if (!m.scored || m.round === 'practice' || m.eventId === excludeEventId || m.red.score === null || m.blue.score === null) continue;
    const color = m.red.teams.some((t) => t.id === teamId) ? 'red' : m.blue.teams.some((t) => t.id === teamId) ? 'blue' : null;
    if (!color) continue;
    const mine = m[color];
    const theirs = color === 'red' ? m.blue : m.red;
    const size = Math.max(1, mine.teams.length);
    offense += (mine.score ?? 0) / size;
    margin += ((mine.score ?? 0) - (theirs.score ?? 0)) / size;
    n++;
  }
  return n ? { rating: { offense: offense / n, margin: margin / n }, matches: n } : undefined;
}

/**
 * Spread of real margins around predicted ones. The RMS error is measured on the same matches the ratings
 * were fitted to, which understates it (OPR has one parameter per team), so it is scaled by √(m / (m − p))
 * for m matches and p fitted ratings. Falls back to the default when there are too few matches.
 */
export function estimateMarginSigma(matches: Match[], ratingOf: (teamId: number) => TeamRating | undefined, parameterCount = 0): number {
  const errors: number[] = [];
  for (const m of matches) {
    if (!m.scored || m.red.score === null || m.blue.score === null) continue;
    const red = m.red.teams.map((t) => ratingOf(t.id));
    const blue = m.blue.teams.map((t) => ratingOf(t.id));
    if (red.some((r) => !r) || blue.some((r) => !r)) continue;
    const p = predictMatch(red as TeamRating[], blue as TeamRating[]);
    errors.push(m.red.score - m.blue.score - p.margin);
  }
  const m = errors.length;
  if (m < 8 || m <= parameterCount + 2) return DEFAULT_MARGIN_SIGMA;
  const rms = Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / m);
  return Math.max(MIN_SIGMA, rms * Math.sqrt(m / (m - parameterCount)));
}
