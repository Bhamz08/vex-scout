/**
 * Types for data-driven scoring rules. Every number the calculators use lives in a config object
 * (v5rc.ts, vexu.ts, skills.ts); nothing in the engine or UI hardcodes point values or durations.
 */

export type AllianceColor = 'red' | 'blue';
export type HalfColor = 'red' | 'blue' | 'yellow';
export type ToggleState = 'red' | 'blue' | 'yellow';
export type QuadrantId = 'red1' | 'red2' | 'blue1' | 'blue2';
export type GoalId = `${QuadrantId}-alliance` | `${QuadrantId}-neutral` | 'midfield';

export interface ManualRef {
  title: string;
  version: string;
  /** Release date of this version (ISO) */
  date: string;
  /** Date this version took effect (ISO) */
  effective: string;
  url: string;
  qaUrl: string;
  /** Rule numbers the config was built from */
  sections: string[];
}

/** A value we could not confirm in the manual. Shown with an UNVERIFIED flag in the UI. */
export interface UnverifiedNote {
  /** What it applies to, e.g. "quadrantSides" */
  key: string;
  note: string;
}

export interface QuadrantDef {
  id: QuadrantId;
  label: string;
  /** Quadrant color = color of the Alliance-colored Goal inside it (manual glossary, "Quadrant"). */
  color: AllianceColor;
  /** Side of the Autonomous Line the quadrant is on (used for AWP "opposing side" exclusions). */
  side: AllianceColor;
}

export interface FieldLayout {
  sizeFeet: number;
  quadrants: QuadrantDef[];
  /** Each quadrant contains one Alliance-colored Goal and one neutral Goal. */
  goalsPerQuadrant: Array<{ kind: 'alliance' | 'neutral'; label: string }>;
  midfieldGoalLabel: string;
}

export interface AwpCriteria {
  id: string;
  label: string;
  /** Minimum Pin Halves Scored for the alliance (excluding opposing-side quadrants) */
  minHalves: number;
  /** Minimum number of Goals that each hold ≥ `halvesPerGoal` halves for the alliance */
  minGoals: number;
  halvesPerGoal: number;
  /** Neither robot may touch the Field Perimeter */
  noPerimeterContact: boolean;
  /** Minimum robots at least partially in the Midfield at the end of autonomous */
  minRobotsInMidfield: number;
  /** Alliance must commit no violations during autonomous */
  noViolations: boolean;
}

export interface MatchRules {
  kind: 'match';
  id: 'v5rc' | 'vexu';
  label: string;
  manual: ManualRef;
  field: FieldLayout;
  format: {
    alliances: 2;
    teamsPerAlliance: number;
    robotsPerAlliance: number;
  };
  periods: { autonomousSeconds: number; driverSeconds: number };
  points: {
    allianceHalf: number;
    yellowHalf: number;
    robotInMidfield: number;
  };
  autonomousBonus: {
    points: number;
    /** Each alliance gets this on a tie (including 0–0) */
    tiePointsEach: number;
    /** A violation during autonomous hands the bonus to the opponent; if both violate, nobody gets it */
    violationAwardsOpponent: boolean;
    /** Whether Midfield robots and Midfield yellow-half ownership count toward the autonomous score */
    includesMidfield: boolean;
  };
  awp: AwpCriteria[];
  unverified: UnverifiedNote[];
}

export interface SkillsRules {
  kind: 'skills';
  id: 'skills-v5rc' | 'skills-vexu';
  label: string;
  manual: ManualRef;
  field: FieldLayout;
  runSeconds: number;
  robots: number;
  points: {
    /** red or blue half; only scores in a quadrant of its own color or in the Midfield Goal */
    coloredHalf: number;
    yellowHalf: number;
    robotInMidfield: number;
  };
  unverified: UnverifiedNote[];
}

export type ScoringRules = MatchRules | SkillsRules;
