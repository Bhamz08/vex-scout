import type { FieldLayout, ManualRef } from './types';

/**
 * Source document for every rules config. Values were read from the Override Game Manual v2.1
 * (released 2026-10-08, in force from 2026-10-15). The v2.1 changelog lists wording changes around the
 * new "Pin Half" term (SC2, SC3, SC5, SC8, RSC3, VUG5, VUG6) and no point-value changes from v2.0.
 * When the manual is updated, bump `version` here and re-check each config file.
 */
export const OVERRIDE_MANUAL: ManualRef = {
  title: 'VEX V5 Robotics Competition Override – Game Manual',
  version: '2.1',
  date: '2026-10-08',
  effective: '2026-10-15',
  url: 'https://link.vex.com/docs/26-27/v5rc/game-manual',
  // The manual says the Q&A lives on events.vex.com; this exact path could not be checked (the site blocks automated requests).
  qaUrl: 'https://events.vex.com/V5RC/2026-2027/QA',
  sections: [],
};

/**
 * Field layout shared by all modes (manual glossary "Quadrant", "Goal"; Figure Q-1).
 * Four Quadrants (Red 1, Red 2, Blue 1, Blue 2 – the Tournament Manager labels), each with one
 * Alliance-colored Goal and one neutral Goal, plus the tall Midfield Goal.
 */
export const OVERRIDE_FIELD: FieldLayout = {
  sizeFeet: 12,
  quadrants: [
    { id: 'red1', label: 'Red 1', color: 'red', side: 'red' },
    { id: 'red2', label: 'Red 2', color: 'red', side: 'red' },
    { id: 'blue1', label: 'Blue 1', color: 'blue', side: 'blue' },
    { id: 'blue2', label: 'Blue 2', color: 'blue', side: 'blue' },
  ],
  goalsPerQuadrant: [
    { kind: 'alliance', label: 'Alliance Goal' },
    { kind: 'neutral', label: 'Neutral Goal' },
  ],
  midfieldGoalLabel: 'Midfield Goal',
};

export const QUADRANT_SIDE_NOTE = {
  key: 'quadrantSides',
  note: 'The manual names Quadrants by the Alliance-colored Goal they contain, but does not state in text that red Quadrants are on red’s side of the Autonomous Line. Assumed here; only the AWP checklist depends on it. Check Figure Q-1.',
};
