import { describe, expect, it } from 'vitest';
import { makeMatch } from '@/test/fixtures';
import { resultFor, teamRecord } from './matches';

describe('match helpers', () => {
  const matches = [
    makeMatch(1, [1, 2], [3, 4], [50, 40]),
    makeMatch(2, [1, 3], [2, 4], [30, 30]),
    makeMatch(3, [2, 3], [1, 4], [70, 10]),
    makeMatch(4, [1, 2], [3, 4], [null, null]),
  ];

  it('derives per-team results', () => {
    expect(matches.map((m) => resultFor(m, 1))).toEqual(['W', 'T', 'L', null]);
  });

  it('counts a win/loss/tie record over scored matches only', () => {
    expect(teamRecord(matches, 1)).toEqual({ wins: 1, losses: 1, ties: 1, played: 3 });
  });
});
