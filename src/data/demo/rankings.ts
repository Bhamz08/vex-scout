import type { AllianceColor, Match, Ranking } from '../types';

/** Per-match facts that the official match feed does not include, but that ranking needs. */
export interface MatchOutcomeMeta {
  autonWinner: AllianceColor | 'tie' | null;
  awp: Record<AllianceColor, boolean>;
}

interface Tally {
  team: Ranking['team'];
  divisionId: number;
  eventId: number;
  played: number;
  wins: number;
  losses: number;
  ties: number;
  wp: number;
  ap: number;
  sp: number;
  scores: number[];
}

/**
 * Qualification rankings per the Override manual glossary:
 * WP = 2 per win, 1 per tie, +1 per Autonomous Win Point; AP = 10 for the Autonomous Bonus (5 each on a tie);
 * SP = losing alliance's score (tie score on a tie). Sorted by average WP, AP, SP, then high score.
 */
export function computeRankings(matches: Match[], meta: Map<number, MatchOutcomeMeta>): Ranking[] {
  const tallies = new Map<number, Tally>();

  for (const m of matches) {
    if (m.round !== 'qualification' || !m.scored || m.red.score === null || m.blue.score === null) continue;
    const info = meta.get(m.id);
    const red = m.red.score;
    const blue = m.blue.score;
    const sp = Math.min(red, blue);

    for (const color of ['red', 'blue'] as const) {
      const own = color === 'red' ? red : blue;
      const opp = color === 'red' ? blue : red;
      for (const t of m[color].teams) {
        if (t.sitting) continue;
        let tally = tallies.get(t.id);
        if (!tally) {
          tally = { team: { id: t.id, number: t.number }, divisionId: m.divisionId, eventId: m.eventId, played: 0, wins: 0, losses: 0, ties: 0, wp: 0, ap: 0, sp: 0, scores: [] };
          tallies.set(t.id, tally);
        }
        tally.played++;
        tally.scores.push(own);
        tally.sp += sp;
        if (own > opp) {
          tally.wins++;
          tally.wp += 2;
        } else if (own < opp) {
          tally.losses++;
        } else {
          tally.ties++;
          tally.wp += 1;
        }
        if (info?.awp[color]) tally.wp += 1;
        if (info?.autonWinner === color) tally.ap += 10;
        else if (info?.autonWinner === 'tie') tally.ap += 5;
      }
    }
  }

  const avg = (n: number, t: Tally) => n / Math.max(1, t.played);
  const sorted = [...tallies.values()].sort(
    (a, b) =>
      avg(b.wp, b) - avg(a.wp, a) ||
      avg(b.ap, b) - avg(a.ap, a) ||
      avg(b.sp, b) - avg(a.sp, a) ||
      Math.max(...b.scores) - Math.max(...a.scores) ||
      a.team.number.localeCompare(b.team.number),
  );

  return sorted.map((t, i) => {
    const total = t.scores.reduce((s, x) => s + x, 0);
    return {
      eventId: t.eventId,
      divisionId: t.divisionId,
      rank: i + 1,
      team: t.team,
      wins: t.wins,
      losses: t.losses,
      ties: t.ties,
      wp: t.wp,
      ap: t.ap,
      sp: t.sp,
      highScore: Math.max(...t.scores),
      averagePoints: Math.round((total / t.played) * 100) / 100,
      totalPoints: total,
    };
  });
}
