import type { Match } from '@/data/types';

/** Builds a qualification match between team ids; team numbers are `${id}A`. Scores null = unplayed. */
export function makeMatch(id: number, red: number[], blue: number[], score: [number | null, number | null]): Match {
  const ref = (n: number) => ({ id: n, number: `${n}A`, sitting: false });
  return {
    id,
    eventId: 1,
    divisionId: 1,
    round: 'qualification',
    instance: 1,
    matchnum: id,
    name: `Q${id}`,
    scheduled: null,
    started: null,
    field: null,
    scored: score[0] !== null && score[1] !== null,
    red: { color: 'red', score: score[0], teams: red.map(ref) },
    blue: { color: 'blue', score: score[1], teams: blue.map(ref) },
  };
}
