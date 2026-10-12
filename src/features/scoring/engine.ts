import type { AllianceColor, AwpCriteria, FieldLayout, MatchRules, QuadrantDef, QuadrantId, SkillsRules, ToggleState } from './rules/types';

/**
 * Pure scoring functions. All point values come from the rules config passed in.
 *
 * Inputs are counts of *Scored* Pin Halves per Goal: halves of Placed Pins that are visible
 * (a half nested inside a Goal or inside the opaque half of a Cup is not visible and never scores, <SC3>).
 * Cups themselves are not worth points.
 */

export interface GoalHalves {
  red: number;
  blue: number;
  yellow: number;
}

export interface QuadrantState {
  toggle: ToggleState;
  allianceGoal: GoalHalves;
  neutralGoal: GoalHalves;
}

export interface FieldState {
  quadrants: Record<QuadrantId, QuadrantState>;
  midfieldGoal: GoalHalves;
  /** Robots at least partially within the Midfield (at the end of the period being scored) */
  robotsInMidfield: Record<AllianceColor, number>;
}

const emptyGoal = (): GoalHalves => ({ red: 0, blue: 0, yellow: 0 });

export function emptyField(layout: FieldLayout): FieldState {
  const quadrants = Object.fromEntries(
    layout.quadrants.map((q) => [q.id, { toggle: 'yellow' as ToggleState, allianceGoal: emptyGoal(), neutralGoal: emptyGoal() }]),
  ) as Record<QuadrantId, QuadrantState>;
  return { quadrants, midfieldGoal: emptyGoal(), robotsInMidfield: { red: 0, blue: 0 } };
}

export interface LineItem {
  count: number;
  points: number;
}

export interface AllianceBreakdown {
  allianceHalves: LineItem;
  yellowQuadrantHalves: LineItem;
  yellowMidfieldHalves: LineItem;
  robotsInMidfield: LineItem;
  autonomousBonus: number;
  total: number;
}

export type Phase = 'autonomous' | 'final';

/** Who Owns the Midfield Goal's yellow halves: more robots in the Midfield; a tie means nobody (<SC5b>). */
export function midfieldOwner(robots: Record<AllianceColor, number>): AllianceColor | null {
  if (robots.red === robots.blue) return null;
  return robots.red > robots.blue ? 'red' : 'blue';
}

/**
 * Field points for both alliances (no Autonomous Bonus).
 * In the autonomous phase, Midfield robots and Midfield yellow ownership count only if the rules say so (<SC7a> vs <VUG5>).
 */
export function scoreField(rules: MatchRules, state: FieldState, phase: Phase): Record<AllianceColor, AllianceBreakdown> {
  const p = rules.points;
  const midfieldCounts = phase === 'final' || rules.autonomousBonus.includesMidfield;
  const owner = midfieldCounts ? midfieldOwner(state.robotsInMidfield) : null;

  const out = {} as Record<AllianceColor, AllianceBreakdown>;
  for (const color of ['red', 'blue'] as const) {
    let own = state.midfieldGoal[color];
    let yellowQuadrant = 0;
    for (const q of rules.field.quadrants) {
      const qs = state.quadrants[q.id];
      own += qs.allianceGoal[color] + qs.neutralGoal[color];
      // <SC5a>: quadrant yellow halves belong to the alliance whose color the Toggle shows.
      if (qs.toggle === color) yellowQuadrant += qs.allianceGoal.yellow + qs.neutralGoal.yellow;
    }
    const yellowMidfield = owner === color ? state.midfieldGoal.yellow : 0;
    const robots = midfieldCounts ? state.robotsInMidfield[color] : 0;

    const b: AllianceBreakdown = {
      allianceHalves: { count: own, points: own * p.allianceHalf },
      yellowQuadrantHalves: { count: yellowQuadrant, points: yellowQuadrant * p.yellowHalf },
      yellowMidfieldHalves: { count: yellowMidfield, points: yellowMidfield * p.yellowHalf },
      robotsInMidfield: { count: robots, points: robots * p.robotInMidfield },
      autonomousBonus: 0,
      total: 0,
    };
    b.total = b.allianceHalves.points + b.yellowQuadrantHalves.points + b.yellowMidfieldHalves.points + b.robotsInMidfield.points;
    out[color] = b;
  }
  return out;
}

export interface AutonomousResult {
  red: number;
  blue: number;
  winner: AllianceColor | 'tie' | 'none';
  reason: string;
}

/** <SC7>: higher autonomous score wins the bonus; tie splits it; violations hand it to the opponent. */
export function autonomousBonus(rules: MatchRules, scores: Record<AllianceColor, number>, violations: Record<AllianceColor, boolean>): AutonomousResult {
  const { points, tiePointsEach, violationAwardsOpponent } = rules.autonomousBonus;
  if (violationAwardsOpponent && violations.red && violations.blue) return { red: 0, blue: 0, winner: 'none', reason: 'Both alliances committed autonomous violations' };
  if (violationAwardsOpponent && violations.red) return { red: 0, blue: points, winner: 'blue', reason: 'Red committed an autonomous violation' };
  if (violationAwardsOpponent && violations.blue) return { red: points, blue: 0, winner: 'red', reason: 'Blue committed an autonomous violation' };
  if (scores.red === scores.blue) return { red: tiePointsEach, blue: tiePointsEach, winner: 'tie', reason: `Tied ${scores.red}–${scores.blue}` };
  return scores.red > scores.blue
    ? { red: points, blue: 0, winner: 'red', reason: `Red led ${scores.red}–${scores.blue}` }
    : { red: 0, blue: points, winner: 'blue', reason: `Blue led ${scores.blue}–${scores.red}` };
}

export interface MatchResult {
  autonomous: { field: Record<AllianceColor, AllianceBreakdown>; bonus: AutonomousResult };
  final: Record<AllianceColor, AllianceBreakdown>;
}

/** Full match: end-of-autonomous state decides the bonus, end-of-match state gives the rest. */
export function scoreMatch(
  rules: MatchRules,
  autonomousState: FieldState,
  finalState: FieldState,
  violations: Record<AllianceColor, boolean>,
): MatchResult {
  const autonField = scoreField(rules, autonomousState, 'autonomous');
  const bonus = autonomousBonus(rules, { red: autonField.red.total, blue: autonField.blue.total }, violations);
  const final = scoreField(rules, finalState, 'final');
  for (const color of ['red', 'blue'] as const) {
    final[color].autonomousBonus = bonus[color];
    final[color].total += bonus[color];
  }
  return { autonomous: { field: autonField, bonus }, final };
}

/* ───────────────────────── Autonomous Win Point (informational) ───────────────────────── */

export interface AwpChecks {
  noPerimeterContact: boolean;
  noViolations: boolean;
}

export interface AwpCondition {
  label: string;
  met: boolean;
  detail: string;
}

/** Halves Scored for `color` in one goal, given who Owns its yellow halves. */
function halvesFor(goal: GoalHalves, color: AllianceColor, yellowOwner: AllianceColor | null): number {
  return goal[color] + (yellowOwner === color ? goal.yellow : 0);
}

/**
 * Checks <SC8>/<VUG6> against the end-of-autonomous field. Goals in Quadrants on the opposing side of the
 * Autonomous Line are excluded. The Midfield Goal is not in a Quadrant, so it counts; its yellow halves count
 * only where Midfield ownership applies during autonomous (VEX U).
 */
export function evaluateAwp(rules: MatchRules, criteria: AwpCriteria, autonState: FieldState, color: AllianceColor, checks: AwpChecks): AwpCondition[] {
  const midOwner = rules.autonomousBonus.includesMidfield ? midfieldOwner(autonState.robotsInMidfield) : null;
  const ownSide = rules.field.quadrants.filter((q: QuadrantDef) => q.side === color);
  const goalCounts: number[] = [halvesFor(autonState.midfieldGoal, color, midOwner)];
  for (const q of ownSide) {
    const qs = autonState.quadrants[q.id];
    const owner = qs.toggle === 'yellow' ? null : qs.toggle;
    goalCounts.push(halvesFor(qs.allianceGoal, color, owner), halvesFor(qs.neutralGoal, color, owner));
  }
  const halves = goalCounts.reduce((s, n) => s + n, 0);
  const goals = goalCounts.filter((n) => n >= criteria.halvesPerGoal).length;
  const robots = autonState.robotsInMidfield[color];

  const conditions: AwpCondition[] = [
    { label: `At least ${criteria.minHalves} Pin Halves Scored (own side + Midfield)`, met: halves >= criteria.minHalves, detail: `${halves} scored` },
    { label: `At least ${criteria.minGoals} Goals with ${criteria.halvesPerGoal}+ halves`, met: goals >= criteria.minGoals, detail: `${goals} goals` },
  ];
  if (criteria.noPerimeterContact) conditions.push({ label: 'Neither robot touching the Field Perimeter', met: checks.noPerimeterContact, detail: checks.noPerimeterContact ? 'Confirmed' : 'Not confirmed' });
  if (criteria.minRobotsInMidfield > 0) conditions.push({ label: `At least ${criteria.minRobotsInMidfield} robot in the Midfield`, met: robots >= criteria.minRobotsInMidfield, detail: `${robots} in Midfield` });
  if (criteria.noViolations) conditions.push({ label: 'No violations during autonomous', met: checks.noViolations, detail: checks.noViolations ? 'Confirmed' : 'Violation' });
  return conditions;
}

/* ───────────────────────── Robot Skills ───────────────────────── */

export interface SkillsBreakdown {
  coloredHalves: LineItem;
  yellowQuadrantHalves: LineItem;
  yellowMidfieldHalves: LineItem;
  robotsInMidfield: LineItem;
  /** Colored halves that were entered but can't score where they are (wrong-colored quadrant) */
  nonScoringHalves: number;
  total: number;
}

/** <RSC3> scoring for one Robot Skills Match. Uses `robotsInMidfield.red` as the robot count. */
export function scoreSkills(rules: SkillsRules, state: FieldState): SkillsBreakdown {
  const p = rules.points;
  const robots = Math.min(rules.robots, state.robotsInMidfield.red);
  let colored = state.midfieldGoal.red + state.midfieldGoal.blue;
  let nonScoring = 0;
  let yellowQuadrant = 0;
  for (const q of rules.field.quadrants) {
    const qs = state.quadrants[q.id];
    const other: AllianceColor = q.color === 'red' ? 'blue' : 'red';
    colored += qs.allianceGoal[q.color] + qs.neutralGoal[q.color];
    nonScoring += qs.allianceGoal[other] + qs.neutralGoal[other];
    if (qs.toggle === q.color) yellowQuadrant += qs.allianceGoal.yellow + qs.neutralGoal.yellow;
  }
  const yellowMidfield = robots >= 1 ? state.midfieldGoal.yellow : 0;
  const b: SkillsBreakdown = {
    coloredHalves: { count: colored, points: colored * p.coloredHalf },
    yellowQuadrantHalves: { count: yellowQuadrant, points: yellowQuadrant * p.yellowHalf },
    yellowMidfieldHalves: { count: yellowMidfield, points: yellowMidfield * p.yellowHalf },
    robotsInMidfield: { count: robots, points: robots * p.robotInMidfield },
    nonScoringHalves: nonScoring,
    total: 0,
  };
  b.total = b.coloredHalves.points + b.yellowQuadrantHalves.points + b.yellowMidfieldHalves.points + b.robotsInMidfield.points;
  return b;
}

/** <T22> point 1: best Autonomous Coding Skills score + best Driving Skills score. */
export function combinedSkills(runs: Array<{ type: 'driver' | 'programming'; score: number }>): { driver: number; programming: number; combined: number } {
  const best = (t: 'driver' | 'programming') => Math.max(0, ...runs.filter((r) => r.type === t).map((r) => r.score));
  const driver = best('driver');
  const programming = best('programming');
  return { driver, programming, combined: driver + programming };
}
