import { OVERRIDE_FIELD, OVERRIDE_MANUAL } from './manual';
import type { SkillsRules } from './types';

/**
 * Robot Skills rules – Override Game Manual v2.1, Section 3 (<RSC1>–<RSC5>) and <T22>/<T23>.
 *  - Each Robot Skills Match is one minute (Section 3 overview); Driving and Autonomous Coding runs.
 *  - One Robot (<RSC2>). No Autonomous Bonus or Autonomous Win Point.
 *  - <RSC3>: red halves score only in a red Quadrant or the Midfield Goal, blue only in a blue Quadrant or
 *    the Midfield Goal; yellow halves in a Quadrant score only if its Toggle matches the Quadrant's color;
 *    yellow halves in the Midfield Goal score if a Robot ends in the Midfield.
 *  - Combined score = best Autonomous Coding + best Driving score (<T22> point 1).
 */
export const skillsV5rcRules: SkillsRules = {
  kind: 'skills',
  id: 'skills-v5rc',
  label: 'V5RC Skills',
  manual: { ...OVERRIDE_MANUAL, sections: ['Section 3 overview', 'RSC2', 'RSC3', 'T22'] },
  field: OVERRIDE_FIELD,
  runSeconds: 60,
  robots: 1,
  points: { coloredHalf: 5, yellowHalf: 10, robotInMidfield: 8 },
  unverified: [],
};

/**
 * VEX U Robot Skills – Section 6 <VURS1>–<VURS3>: same scoring as V5RC Skills, but both of the Team's
 * Robots may play, so up to two Robots can earn the Midfield points. Field setup / Match Loads differ.
 */
export const skillsVexuRules: SkillsRules = {
  ...skillsV5rcRules,
  id: 'skills-vexu',
  label: 'VEX U Skills',
  manual: { ...OVERRIDE_MANUAL, sections: ['RSC3', 'VURS1–VURS3'] },
  robots: 2,
};
