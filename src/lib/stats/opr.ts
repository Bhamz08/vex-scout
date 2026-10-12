import type { Match, TeamRef } from '@/data/types';
import { leastSquares } from './linalg';

export interface TeamStats {
  team: TeamRef;
  /** Offensive Power Rating: least-squares estimate of points the team adds to its alliance */
  opr: number;
  /** Defensive Power Rating: points the team "allows" the opposing alliance */
  dpr: number;
  /** Calculated Contribution to Winning Margin (= OPR − DPR) */
  ccwm: number;
  /** Scored matches used */
  played: number;
}

/**
 * OPR / DPR / CCWM by least squares over scored matches.
 *
 * Each alliance in each match gives one equation: the sum of its teams' ratings ≈ a target.
 *   OPR: target = own score          DPR: target = opponent score         CCWM: target = own − opponent
 * Solving the three systems separately gives CCWM = OPR − DPR exactly, since the targets are linear.
 * Practice matches and sitting teams are excluded.
 */
export function computeTeamStats(matches: Match[]): Map<number, TeamStats> {
  const scored = matches.filter((m) => m.scored && m.round !== 'practice' && m.red.score !== null && m.blue.score !== null);

  const index = new Map<number, number>();
  const teams: TeamRef[] = [];
  const played = new Map<number, number>();
  for (const m of scored) {
    for (const t of [...m.red.teams, ...m.blue.teams]) {
      if (t.sitting) continue;
      if (!index.has(t.id)) {
        index.set(t.id, teams.length);
        teams.push({ id: t.id, number: t.number });
      }
      played.set(t.id, (played.get(t.id) ?? 0) + 1);
    }
  }

  const n = teams.length;
  const rows: number[][] = [];
  const own: number[] = [];
  const opp: number[] = [];
  for (const m of scored) {
    for (const [mine, theirs] of [
      [m.red, m.blue],
      [m.blue, m.red],
    ] as const) {
      const row = new Array<number>(n).fill(0);
      for (const t of mine.teams) {
        const i = index.get(t.id);
        if (i !== undefined && !t.sitting) row[i] = 1;
      }
      rows.push(row);
      own.push(mine.score ?? 0);
      opp.push(theirs.score ?? 0);
    }
  }

  const out = new Map<number, TeamStats>();
  if (n === 0) return out;

  const opr = leastSquares(rows, own, n);
  const dpr = leastSquares(rows, opp, n);
  teams.forEach((team, i) => {
    const o = opr[i] ?? 0;
    const d = dpr[i] ?? 0;
    out.set(team.id, { team, opr: o, dpr: d, ccwm: o - d, played: played.get(team.id) ?? 0 });
  });
  return out;
}
