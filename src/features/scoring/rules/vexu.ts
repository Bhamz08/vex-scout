import { OVERRIDE_FIELD, OVERRIDE_MANUAL, QUADRANT_SIDE_NOTE } from './manual';
import type { MatchRules } from './types';

/**
 * VEX U (VURC) Head-to-Head Match rules – Override Game Manual v2.1, Section 6.
 * VEX U uses the V5RC rules except where Section 6 modifies them:
 *  - <VUT1>: 1 Team vs 1 Team, each Team fields two Robots (one ≤24", one ≤15" at the start, <VUR1>)
 *  - <VUT4>: 30 s Autonomous; <VUT5>: 90 s Driver Controlled
 *  - <VUG5>: Midfield robots and Midfield yellow ownership DO count toward the Autonomous Bonus
 *  - <VUG6>: different Autonomous Win Point criteria
 *  - Field setup: different starting Pins and Match Loads (does not change scoring)
 * Point values and the Autonomous Bonus are unmodified, so the V5RC values apply.
 */
export const vexuRules: MatchRules = {
  kind: 'match',
  id: 'vexu',
  label: 'VEX U Match',
  manual: { ...OVERRIDE_MANUAL, sections: ['SC1–SC7', 'VUG1–VUG6', 'VUT1–VUT5', 'VUR1'] },
  field: OVERRIDE_FIELD,
  format: { alliances: 2, teamsPerAlliance: 1, robotsPerAlliance: 2 },
  periods: { autonomousSeconds: 30, driverSeconds: 90 },
  points: { allianceHalf: 5, yellowHalf: 10, robotInMidfield: 8 },
  autonomousBonus: {
    points: 12,
    tiePointsEach: 6,
    violationAwardsOpponent: true,
    includesMidfield: true, // <VUG5>
  },
  awp: [
    // <VUG6>, all VEX U events
    { id: 'vexu', label: 'All VEX U events', minHalves: 12, minGoals: 4, halvesPerGoal: 2, noPerimeterContact: true, minRobotsInMidfield: 1, noViolations: true },
  ],
  unverified: [QUADRANT_SIDE_NOTE],
};
