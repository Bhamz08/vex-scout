/**
 * Excellence Award eligibility thresholds.
 *
 * ⚠ UNVERIFIED: these criteria live in the REC Foundation "Guide to Judging", not the game manual, and
 * the 2026-27 edition was not available when this was written. Values follow the structure of recent
 * seasons' guides. Check https://www.roboticseducation.org/ and update this file; the UI reads only from here.
 */
export interface ExcellenceRules {
  source: string;
  verified: boolean;
  note: string;
  /** Must rank in the top X of qualification rankings (per division) */
  qualificationTopFraction: number;
  /** Must rank in the top X of overall Robot Skills (driver + programming) at the event */
  skillsTopFraction: number;
  /** Must rank in the top X of Autonomous Coding Skills at the event */
  autonSkillsTopFraction: number;
  /** Must have a non-zero score in both Driving and Autonomous Coding Skills */
  requireBothSkillsTypes: boolean;
  /** How "top X%" turns into a rank cutoff */
  rounding: 'ceil' | 'round' | 'floor';
}

export const excellenceRules: ExcellenceRules = {
  source: 'REC Foundation Guide to Judging (2026-27 edition not yet checked)',
  verified: false,
  note: 'Thresholds based on recent seasons. The engineering notebook requirement is judged and cannot be computed.',
  qualificationTopFraction: 0.4,
  skillsTopFraction: 0.4,
  autonSkillsTopFraction: 0.4,
  requireBothSkillsTypes: true,
  rounding: 'ceil',
};
