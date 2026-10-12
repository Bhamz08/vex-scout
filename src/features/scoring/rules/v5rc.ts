import { OVERRIDE_FIELD, OVERRIDE_MANUAL, QUADRANT_SIDE_NOTE } from './manual';
import type { MatchRules } from './types';

/**
 * V5RC Head-to-Head Match rules – Override Game Manual v2.1.
 * Sources: Primer (p.7), Scoring table and <SC1>–<SC8> (pp.14–18).
 */
export const v5rcRules: MatchRules = {
  kind: 'match',
  id: 'v5rc',
  label: 'V5RC Match',
  manual: { ...OVERRIDE_MANUAL, sections: ['Primer', 'Scoring', 'SC1–SC8'] },
  field: OVERRIDE_FIELD,
  format: { alliances: 2, teamsPerAlliance: 2, robotsPerAlliance: 2 },
  periods: { autonomousSeconds: 15, driverSeconds: 105 },
  points: {
    allianceHalf: 5, // Scoring table: each Scored Alliance-colored Pin Half
    yellowHalf: 10, // Scoring table: each Scored yellow Pin Half (must be Owned, <SC3c>/<SC5>)
    robotInMidfield: 8, // Scoring table: each Robot ending in the Midfield (<SC6>)
  },
  autonomousBonus: {
    points: 12, // Scoring table
    tiePointsEach: 6, // <SC7b>, including a 0–0 tie
    violationAwardsOpponent: true, // <SC7c>/<SC7d>
    includesMidfield: false, // <SC7a>: Midfield robots and Midfield yellow ownership are excluded
  },
  awp: [
    // <SC8>, standard events
    { id: 'standard', label: 'Standard events', minHalves: 6, minGoals: 2, halvesPerGoal: 2, noPerimeterContact: true, minRobotsInMidfield: 0, noViolations: true },
    // <SC8>, events qualifying directly to Worlds (Event Region Championships, Signature Events)
    { id: 'worlds-qualifying', label: 'Worlds-qualifying events', minHalves: 7, minGoals: 3, halvesPerGoal: 2, noPerimeterContact: true, minRobotsInMidfield: 0, noViolations: true },
  ],
  unverified: [QUADRANT_SIDE_NOTE],
};
