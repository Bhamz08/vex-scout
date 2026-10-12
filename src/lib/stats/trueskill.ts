import type { Match, TeamRef } from '@/data/types';
import { normalCdf, normalInverseCdf, normalPdf } from './normal';

/**
 * TrueSkill (Herbrich, Minka & Graepel, 2006) for two-team games, computed from match history.
 *
 * This is an approximation of a full TrueSkill system: it uses the closed-form two-team update
 * (no factor-graph message passing), processes matches once in chronological order, and treats every
 * alliance as the sum of its teams' skills. Good enough for a relative leaderboard.
 */

export interface Rating {
  mu: number;
  sigma: number;
}

export interface TrueSkillParams {
  mu: number;
  sigma: number;
  /** performance noise per player */
  beta: number;
  /** dynamics: skill drift added before each match */
  tau: number;
  drawProbability: number;
}

export const DEFAULT_PARAMS: TrueSkillParams = {
  mu: 25,
  sigma: 25 / 3,
  beta: 25 / 6,
  tau: 25 / 300,
  drawProbability: 0.02,
};

function vWin(t: number, eps: number): number {
  const denom = normalCdf(t - eps);
  return denom < 1e-12 ? -(t - eps) : normalPdf(t - eps) / denom;
}

function wWin(t: number, eps: number): number {
  const v = vWin(t, eps);
  return v * (v + t - eps);
}

function vDraw(t: number, eps: number): number {
  const denom = normalCdf(eps - t) - normalCdf(-eps - t);
  if (denom < 1e-12) return t < 0 ? -t - eps : -t + eps;
  return (normalPdf(-eps - t) - normalPdf(eps - t)) / denom;
}

function wDraw(t: number, eps: number): number {
  const denom = normalCdf(eps - t) - normalCdf(-eps - t);
  if (denom < 1e-12) return 1;
  const v = vDraw(t, eps);
  return v * v + ((eps - t) * normalPdf(eps - t) + (eps + t) * normalPdf(eps + t)) / denom;
}

/**
 * Updates ratings after one game. `a` beat `b`, unless `draw` is true.
 * Returns new arrays; inputs are not mutated.
 */
export function rateTwoTeams(a: Rating[], b: Rating[], draw: boolean, p: TrueSkillParams = DEFAULT_PARAMS): [Rating[], Rating[]] {
  const players = a.length + b.length;
  const withDrift = (r: Rating) => ({ mu: r.mu, sigma: Math.sqrt(r.sigma * r.sigma + p.tau * p.tau) });
  const ta = a.map(withDrift);
  const tb = b.map(withDrift);

  const sumVar = [...ta, ...tb].reduce((s, r) => s + r.sigma * r.sigma, 0);
  const c = Math.sqrt(sumVar + players * p.beta * p.beta);
  const muA = ta.reduce((s, r) => s + r.mu, 0);
  const muB = tb.reduce((s, r) => s + r.mu, 0);
  const drawMargin = normalInverseCdf((p.drawProbability + 1) / 2) * Math.sqrt(players) * p.beta;

  const t = (muA - muB) / c;
  const eps = drawMargin / c;
  const v = draw ? vDraw(t, eps) : vWin(t, eps);
  const w = draw ? wDraw(t, eps) : wWin(t, eps);

  const update = (r: Rating, sign: 1 | -1): Rating => {
    const variance = r.sigma * r.sigma;
    return {
      mu: r.mu + sign * (variance / c) * v,
      sigma: Math.sqrt(variance * Math.max(1 - (variance / (c * c)) * w, 1e-6)),
    };
  };
  return [ta.map((r) => update(r, 1)), tb.map((r) => update(r, -1))];
}

export interface TrueSkillRow {
  team: TeamRef;
  rating: Rating;
  /** μ − 3σ: a conservative skill estimate used for ranking */
  conservative: number;
  matches: number;
}

/** Runs TrueSkill over all scored matches (oldest first) and returns a leaderboard. */
export function computeTrueSkill(matches: Match[], params: TrueSkillParams = DEFAULT_PARAMS): TrueSkillRow[] {
  const ratings = new Map<number, Rating>();
  const teams = new Map<number, TeamRef>();
  const counts = new Map<number, number>();
  const get = (t: TeamRef) => {
    teams.set(t.id, { id: t.id, number: t.number });
    return ratings.get(t.id) ?? { mu: params.mu, sigma: params.sigma };
  };

  const ordered = matches
    .filter((m) => m.scored && m.round !== 'practice' && m.red.score !== null && m.blue.score !== null)
    .sort((x, y) => (x.started ?? x.scheduled ?? '').localeCompare(y.started ?? y.scheduled ?? '') || x.id - y.id);

  for (const m of ordered) {
    const red = m.red.teams.filter((t) => !t.sitting);
    const blue = m.blue.teams.filter((t) => !t.sitting);
    if (!red.length || !blue.length) continue;
    const redWon = (m.red.score ?? 0) >= (m.blue.score ?? 0);
    const draw = m.red.score === m.blue.score;
    const [winners, losers] = redWon ? [red, blue] : [blue, red];
    const [newW, newL] = rateTwoTeams(winners.map(get), losers.map(get), draw, params);
    winners.forEach((t, i) => ratings.set(t.id, newW[i] as Rating));
    losers.forEach((t, i) => ratings.set(t.id, newL[i] as Rating));
    for (const t of [...red, ...blue]) counts.set(t.id, (counts.get(t.id) ?? 0) + 1);
  }

  return [...ratings.entries()]
    .map(([id, rating]) => ({
      team: teams.get(id) as TeamRef,
      rating,
      conservative: rating.mu - 3 * rating.sigma,
      matches: counts.get(id) ?? 0,
    }))
    .sort((a, b) => b.conservative - a.conservative);
}
