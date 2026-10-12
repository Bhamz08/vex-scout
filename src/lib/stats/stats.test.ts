import { describe, expect, it } from 'vitest';
import { makeMatch } from '@/test/fixtures';
import { choleskySolve, gaussianSolve, leastSquares } from './linalg';
import { normalCdf, normalInverseCdf } from './normal';
import { computeTeamStats } from './opr';
import { blendRatings, DEFAULT_MARGIN_SIGMA, estimateMarginSigma, historicalRating, predictMatch } from './predict';
import { computeTrueSkill, rateTwoTeams } from './trueskill';

describe('linear solvers', () => {
  const m = [
    [4, 2],
    [2, 3],
  ];
  const b = [10, 8];
  // 4x + 2y = 10, 2x + 3y = 8  →  x = 1.75, y = 1.5
  it('Cholesky solves an SPD system', () => {
    const x = choleskySolve(m, b);
    expect(x?.[0]).toBeCloseTo(1.75, 10);
    expect(x?.[1]).toBeCloseTo(1.5, 10);
  });

  it('Gaussian elimination agrees and needs pivoting for a zero diagonal', () => {
    expect(gaussianSolve(m, b)?.[0]).toBeCloseTo(1.75, 10);
    const x = gaussianSolve(
      [
        [0, 1],
        [1, 0],
      ],
      [3, 4],
    );
    expect(x).toEqual([4, 3]);
  });

  it('reports singular systems', () => {
    const singular = [
      [1, 1],
      [1, 1],
    ];
    expect(choleskySolve(singular, [1, 1])).toBeNull();
    expect(gaussianSolve(singular, [1, 1])).toBeNull();
  });

  it('least squares recovers an exact fit', () => {
    // y = 2a + 3b, three observations
    const x = leastSquares(
      [
        [1, 0],
        [0, 1],
        [1, 1],
      ],
      [2, 3, 5],
      2,
    );
    expect(x[0]).toBeCloseTo(2, 5);
    expect(x[1]).toBeCloseTo(3, 5);
  });
});

/**
 * Hand-checked example. Four teams (ids 1–4 = A–D) play every pairing once:
 *   Q1: AB 10 vs CD 20     Q2: AC 30 vs BD 0     Q3: AD 15 vs BC 25
 * Each team is in 3 alliances and partners each other team once, so AᵀA = 2I + J (J = all-ones), and
 * (AᵀA)⁻¹ = ½(I − J/6). Hence rating_i = ½(s_i − S/6), where s_i is the sum of the targets of team i's alliances.
 *
 * OPR targets (own score):  s = A 55, B 35, C 75, D 35; S = 200 → OPR = 10.833, 0.833, 20.833, 0.833
 * DPR targets (opp. score): s = A 45, B 65, C 25, D 65; S = 200 → DPR = 5.833, 15.833, −4.167, 15.833
 * CCWM = OPR − DPR = 5, −15, 25, −15
 */
describe('computeTeamStats (OPR / DPR / CCWM)', () => {
  const matches = [makeMatch(1, [1, 2], [3, 4], [10, 20]), makeMatch(2, [1, 3], [2, 4], [30, 0]), makeMatch(3, [1, 4], [2, 3], [15, 25])];
  const stats = computeTeamStats(matches);

  it.each([
    [1, 10.8333, 5.8333, 5],
    [2, 0.8333, 15.8333, -15],
    [3, 20.8333, -4.1667, 25],
    [4, 0.8333, 15.8333, -15],
  ])('team %i', (id, opr, dpr, ccwm) => {
    const s = stats.get(id);
    expect(s?.opr).toBeCloseTo(opr, 3);
    expect(s?.dpr).toBeCloseTo(dpr, 3);
    expect(s?.ccwm).toBeCloseTo(ccwm, 3);
    expect(s?.played).toBe(3);
  });

  it('recovers exact contributions when scores are perfectly additive', () => {
    // True OPRs A=10, B=20, C=30, D=40
    const exact = computeTeamStats([
      makeMatch(1, [1, 2], [3, 4], [30, 70]),
      makeMatch(2, [1, 3], [2, 4], [40, 60]),
      makeMatch(3, [1, 4], [2, 3], [50, 50]),
    ]);
    expect([1, 2, 3, 4].map((id) => exact.get(id)?.opr)).toEqual([10, 20, 30, 40].map((v) => expect.closeTo(v, 4)));
  });

  it('ignores unplayed matches', () => {
    const withFuture = computeTeamStats([...matches, makeMatch(4, [1, 2], [3, 4], [null, null])]);
    expect(withFuture.get(1)?.opr).toBeCloseTo(10.8333, 3);
    expect(withFuture.get(1)?.played).toBe(3);
  });

  it('handles 1v1 (VEX U) matches', () => {
    const s = computeTeamStats([makeMatch(1, [1], [2], [40, 10]), makeMatch(2, [1], [2], [60, 20])]);
    expect(s.get(1)?.opr).toBeCloseTo(50, 3);
    expect(s.get(2)?.ccwm).toBeCloseTo(-35, 3);
  });
});

describe('normal distribution', () => {
  it('matches known values of Φ', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 7);
    expect(normalCdf(1)).toBeCloseTo(0.841345, 5);
    expect(normalCdf(-1.96)).toBeCloseTo(0.024998, 5);
  });

  it('inverts Φ', () => {
    expect(normalInverseCdf(0.841345)).toBeCloseTo(1, 4);
  });
});

describe('predictMatch', () => {
  const equal = { offense: 20, margin: 0 };

  it('gives 50% for identical alliances', () => {
    const p = predictMatch([equal, equal], [equal, equal]);
    expect(p.redWinProbability).toBeCloseTo(0.5, 6);
    expect(p.redScore).toBe(40);
  });

  it('turns the expected margin into a win probability', () => {
    // OPR diff = 20, CCWM diff = 16 → μ = 18; σ = 18 → Φ(1) ≈ 0.8413
    const p = predictMatch([{ offense: 30, margin: 8 }, equal], [{ offense: 10, margin: -8 }, equal], 18);
    expect(p.margin).toBeCloseTo(18, 6);
    expect(p.redWinProbability).toBeCloseTo(0.8413, 3);
  });

  it('is symmetric', () => {
    const a = [{ offense: 25, margin: 5 }];
    const b = [{ offense: 15, margin: -2 }];
    expect(predictMatch(a, b).redWinProbability + predictMatch(b, a).redWinProbability).toBeCloseTo(1, 6);
  });
});

describe('estimateMarginSigma', () => {
  const zero = () => ({ offense: 0, margin: 0 });

  it('uses the default with too few matches', () => {
    expect(estimateMarginSigma([makeMatch(1, [1], [2], [10, 0])], zero)).toBe(DEFAULT_MARGIN_SIGMA);
  });

  it('inflates the in-sample RMS error by √(m / (m − p))', () => {
    // 10 matches, every actual margin is 10 and every prediction 0 → RMS 10; p = 5 → 10·√2
    const matches = Array.from({ length: 10 }, (_, i) => makeMatch(i + 1, [1], [2], [20, 10]));
    expect(estimateMarginSigma(matches, zero, 0)).toBeCloseTo(10, 6);
    expect(estimateMarginSigma(matches, zero, 5)).toBeCloseTo(10 * Math.SQRT2, 6);
  });
});

describe('blendRatings / historicalRating', () => {
  it('weights the current event by n / (n + k)', () => {
    const r = blendRatings({ offense: 40, margin: 10 }, 3, { offense: 20, margin: 0 }, 3);
    expect(r).toEqual({ offense: 30, margin: 5 });
  });

  it('falls back to whichever estimate exists', () => {
    expect(blendRatings(undefined, 0, { offense: 5, margin: 1 })).toEqual({ offense: 5, margin: 1 });
    expect(blendRatings({ offense: 7, margin: 2 }, 4, undefined)).toEqual({ offense: 7, margin: 2 });
  });

  it('averages a team’s share of alliance score and margin, excluding one event', () => {
    const m1 = makeMatch(1, [1, 2], [3, 4], [40, 20]);
    const m2 = { ...makeMatch(2, [3, 1], [2, 4], [10, 30]), eventId: 2 };
    expect(historicalRating([m1, m2], 1)).toEqual({ rating: { offense: 12.5, margin: 0 }, matches: 2 });
    expect(historicalRating([m1, m2], 1, 2)?.matches).toBe(1);
  });
});

describe('TrueSkill', () => {
  it('matches the reference 1v1 update (draw probability 10%)', () => {
    // Reference values from the original TrueSkill paper / trueskill.org for two new players.
    const [[w], [l]] = rateTwoTeams([{ mu: 25, sigma: 25 / 3 }], [{ mu: 25, sigma: 25 / 3 }], false, {
      mu: 25,
      sigma: 25 / 3,
      beta: 25 / 6,
      tau: 25 / 300,
      drawProbability: 0.1,
    });
    expect(w?.mu).toBeCloseTo(29.396, 2);
    expect(l?.mu).toBeCloseTo(20.604, 2);
    expect(w?.sigma).toBeCloseTo(7.171, 2);
  });

  it('a draw between equals keeps means and shrinks uncertainty', () => {
    const [[a], [b]] = rateTwoTeams([{ mu: 25, sigma: 8 }], [{ mu: 25, sigma: 8 }], true);
    expect(a?.mu).toBeCloseTo(25, 6);
    expect(b?.mu).toBeCloseTo(25, 6);
    expect(a?.sigma ?? 99).toBeLessThan(8);
  });

  it('ranks a team that keeps winning first', () => {
    const matches = [1, 2, 3, 4, 5, 6].map((i) => makeMatch(i, [1, 2 + (i % 3)], [5, 6], [50, 20]));
    expect(computeTrueSkill(matches)[0]?.team.id).toBe(1);
  });
});
