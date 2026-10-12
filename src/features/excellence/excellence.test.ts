import { describe, expect, it } from 'vitest';
import type { Ranking, SkillsEntry } from '@/data/types';
import { cutoffFor, evaluateExcellence } from './excellence';
import { excellenceRules } from './rules';

const team = (id: number) => ({ id, number: `${id}A` });
const ranking = (id: number, rank: number): Ranking => ({
  eventId: 1, divisionId: 1, rank, team: team(id), wins: 0, losses: 0, ties: 0, wp: 0, ap: 0, sp: 0, highScore: 0, averagePoints: 0, totalPoints: 0,
});
const run = (id: number, type: SkillsEntry['type'], score: number): SkillsEntry => ({ eventId: 1, team: team(id), type, score, attempts: 1, rank: 0 });

describe('Excellence eligibility', () => {
  it('rounds the top-40% cutoff up by default', () => {
    expect(cutoffFor(0.4, 10, 'ceil')).toBe(4);
    expect(cutoffFor(0.4, 11, 'ceil')).toBe(5);
  });

  it('requires qualification, skills and autonomous skills rankings plus both skills types', () => {
    const teams = [1, 2, 3, 4, 5].map(team); // cutoffs: ceil(0.4 × 5) = 2
    const rankings = [ranking(1, 1), ranking(2, 2), ranking(3, 3), ranking(4, 4), ranking(5, 5)];
    const skills = [
      run(1, 'driver', 50), run(1, 'programming', 40), // combined 90 (1st), auton 1st → eligible
      run(2, 'driver', 80), // combined 80 (2nd) but no programming → fails auton + both-types
      run(3, 'driver', 10), run(3, 'programming', 30), // auton 2nd, combined 40 (3rd) → fails combined + qual
    ];
    const rows = evaluateExcellence(teams, rankings, skills, 5, excellenceRules);
    const byId = new Map(rows.map((r) => [r.team.id, r]));

    expect(byId.get(1)?.eligible).toBe(true);
    expect(byId.get(2)).toMatchObject({ eligible: false, bothSkills: false, autonSkills: { pass: false, rank: null } });
    expect(byId.get(3)).toMatchObject({ eligible: false, qualification: { pass: false }, skills: { rank: 3, pass: false }, autonSkills: { rank: 2, pass: true } });
    expect(rows[0]?.team.id).toBe(1);
  });
});
