import type { Ranking, SkillsEntry, TeamRef } from '@/data/types';
import type { ExcellenceRules } from './rules';

export interface Criterion {
  rank: number | null;
  cutoff: number;
  pass: boolean;
}

export interface ExcellenceRow {
  team: TeamRef;
  qualification: Criterion;
  skills: Criterion;
  autonSkills: Criterion;
  bothSkills: boolean;
  /** Meets every computable criterion (the notebook is judged separately) */
  eligible: boolean;
}

export function cutoffFor(fraction: number, teamCount: number, rounding: ExcellenceRules['rounding']): number {
  return Math[rounding](fraction * teamCount);
}

/** Dense ranking by score (desc); equal scores share a rank. Teams with no score are unranked. */
function rankBy(scores: Map<number, number>): Map<number, number> {
  const sorted = [...scores.entries()].filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]);
  const ranks = new Map<number, number>();
  sorted.forEach(([id, score], i) => {
    const prev = sorted[i - 1];
    ranks.set(id, prev && prev[1] === score ? (ranks.get(prev[0]) ?? i + 1) : i + 1);
  });
  return ranks;
}

/**
 * Evaluates the computable Excellence criteria for each team in a division.
 * @param divisionTeams teams in the division (qualification cutoff uses this count)
 * @param eventTeamCount teams at the whole event (skills cutoffs use this count)
 */
export function evaluateExcellence(
  divisionTeams: TeamRef[],
  rankings: Ranking[],
  skills: SkillsEntry[],
  eventTeamCount: number,
  rules: ExcellenceRules,
): ExcellenceRow[] {
  const qualCutoff = cutoffFor(rules.qualificationTopFraction, divisionTeams.length, rules.rounding);
  const skillsCutoff = cutoffFor(rules.skillsTopFraction, eventTeamCount, rules.rounding);
  const autonCutoff = cutoffFor(rules.autonSkillsTopFraction, eventTeamCount, rules.rounding);

  const best = (type: SkillsEntry['type']) => {
    const m = new Map<number, number>();
    for (const s of skills) if (s.type === type) m.set(s.team.id, Math.max(m.get(s.team.id) ?? 0, s.score));
    return m;
  };
  const driver = best('driver');
  const programming = best('programming');
  const combined = new Map<number, number>();
  for (const id of new Set([...driver.keys(), ...programming.keys()])) combined.set(id, (driver.get(id) ?? 0) + (programming.get(id) ?? 0));

  const skillsRank = rankBy(combined);
  const autonRank = rankBy(programming);
  const qualRank = new Map(rankings.map((r) => [r.team.id, r.rank]));

  const criterion = (rank: number | undefined, cutoff: number): Criterion => ({ rank: rank ?? null, cutoff, pass: rank !== undefined && rank <= cutoff });

  return divisionTeams
    .map((team) => {
      const qualification = criterion(qualRank.get(team.id), qualCutoff);
      const skillsC = criterion(skillsRank.get(team.id), skillsCutoff);
      const autonSkills = criterion(autonRank.get(team.id), autonCutoff);
      const bothSkills = (driver.get(team.id) ?? 0) > 0 && (programming.get(team.id) ?? 0) > 0;
      return {
        team,
        qualification,
        skills: skillsC,
        autonSkills,
        bothSkills,
        eligible: qualification.pass && skillsC.pass && autonSkills.pass && (!rules.requireBothSkillsTypes || bothSkills),
      };
    })
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || (a.qualification.rank ?? 999) - (b.qualification.rank ?? 999));
}
