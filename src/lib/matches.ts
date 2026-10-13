import type { AllianceColor, Match, MatchRound } from '@/data/types';

export type MatchResult = 'W' | 'L' | 'T';

export interface WinLoss {
  wins: number;
  losses: number;
  ties: number;
  played: number;
}

export function allianceOf(match: Match, teamId: number): AllianceColor | null {
  if (match.red.teams.some((t) => t.id === teamId)) return 'red';
  if (match.blue.teams.some((t) => t.id === teamId)) return 'blue';
  return null;
}

export function opponentColor(color: AllianceColor): AllianceColor {
  return color === 'red' ? 'blue' : 'red';
}

export function matchWinner(match: Match): AllianceColor | 'tie' | null {
  if (!match.scored || match.red.score === null || match.blue.score === null) return null;
  if (match.red.score === match.blue.score) return 'tie';
  return match.red.score > match.blue.score ? 'red' : 'blue';
}

export function resultFor(match: Match, teamId: number): MatchResult | null {
  const color = allianceOf(match, teamId);
  const winner = matchWinner(match);
  if (!color || !winner) return null;
  if (winner === 'tie') return 'T';
  return winner === color ? 'W' : 'L';
}

/** Win/loss/tie record over scored, non-practice matches. */
export function teamRecord(matches: Match[], teamId: number): WinLoss {
  const rec: WinLoss = { wins: 0, losses: 0, ties: 0, played: 0 };
  for (const m of matches) {
    if (m.round === 'practice') continue;
    const r = resultFor(m, teamId);
    if (!r) continue;
    rec.played++;
    if (r === 'W') rec.wins++;
    else if (r === 'L') rec.losses++;
    else rec.ties++;
  }
  return rec;
}

export function formatRecord(r: Pick<WinLoss, 'wins' | 'losses' | 'ties'>): string {
  return `${r.wins}-${r.losses}-${r.ties}`;
}

const ROUND_ORDER: Record<MatchRound, number> = { practice: 0, qualification: 1, r16: 2, quarterfinal: 3, semifinal: 4, final: 5, other: 6 };

export function sortMatches(matches: Match[]): Match[] {
  // Round first: elimination matches often have no scheduled time and would otherwise sort ahead of quals.
  return [...matches].sort(
    (a, b) =>
      ROUND_ORDER[a.round] - ROUND_ORDER[b.round] ||
      (a.scheduled ?? '').localeCompare(b.scheduled ?? '') ||
      a.instance - b.instance ||
      a.matchnum - b.matchnum,
  );
}

const ROUND_PREFIX: Partial<Record<MatchRound, string>> = { practice: 'P', qualification: 'Q', r16: 'R16', quarterfinal: 'QF', semifinal: 'SF', final: 'F' };

/** Compact scoreboard label: "Q12", "R16 2-1", "QF 1-1", "SF 2-3", "F 1". Falls back to the API name. */
export function shortMatchName(m: Pick<Match, 'round' | 'instance' | 'matchnum' | 'name'>): string {
  const prefix = ROUND_PREFIX[m.round];
  if (!prefix) return m.name;
  if (m.round === 'practice' || m.round === 'qualification') return `${prefix}${m.matchnum}`;
  if (m.round === 'final') return `${prefix} ${m.matchnum}`;
  return `${prefix} ${m.instance}-${m.matchnum}`;
}

export const ROUND_LABELS: Record<MatchRound, string> = {
  practice: 'Practice',
  qualification: 'Qualification',
  r16: 'Round of 16',
  quarterfinal: 'Quarterfinals',
  semifinal: 'Semifinals',
  final: 'Finals',
  other: 'Other',
};
