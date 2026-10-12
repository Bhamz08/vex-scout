import { describe, expect, it } from 'vitest';
import { autonomousBonus, combinedSkills, emptyField, evaluateAwp, scoreField, scoreMatch, scoreSkills, type FieldState } from './engine';
import { skillsV5rcRules, skillsVexuRules } from './rules/skills';
import { v5rcRules } from './rules/v5rc';
import { vexuRules } from './rules/vexu';

const field = (edit: (f: FieldState) => void): FieldState => {
  const f = emptyField(v5rcRules.field);
  edit(f);
  return f;
};

describe('V5RC field scoring – manual worked example (Figure SC5, <SC5>)', () => {
  // One Quadrant holds 3 red, 1 blue and 3 yellow Scored Pin Halves.
  const base = (toggle: 'red' | 'blue' | 'yellow') =>
    field((f) => {
      f.quadrants.red1.toggle = toggle;
      f.quadrants.red1.neutralGoal = { red: 3, blue: 1, yellow: 3 };
    });

  it.each([
    ['yellow', 15, 5],
    ['blue', 15, 35],
    ['red', 45, 5],
  ] as const)('Toggle %s → red %i, blue %i', (toggle, red, blue) => {
    const s = scoreField(v5rcRules, base(toggle), 'final');
    expect(s.red.total).toBe(red);
    expect(s.blue.total).toBe(blue);
  });
});

describe('V5RC full match (hand-calculated)', () => {
  /*
   * End of autonomous: red has 4 red halves (20); blue has 2 blue halves (10) + 2 yellow under a blue Toggle (20) = 30.
   *   One red robot sits in the Midfield, which does NOT count in V5RC autonomous (<SC7a>). → Blue wins the 12-pt bonus.
   * End of match:
   *   Red:  10 red halves (50) + 3 yellow in a red-Toggle quadrant (30) + Midfield yellow 2 owned with 2 robots vs 1 (20)
   *         + 2 robots × 8 (16) = 116
   *   Blue: 6 blue halves (30) + 2 yellow in a blue-Toggle quadrant (20) + 1 robot (8) + bonus 12 = 70
   */
  const auton = field((f) => {
    f.quadrants.red1.allianceGoal.red = 4;
    f.quadrants.blue1.toggle = 'blue';
    f.quadrants.blue1.allianceGoal = { red: 0, blue: 2, yellow: 2 };
    f.robotsInMidfield.red = 1;
  });
  const final = field((f) => {
    f.quadrants.red1.toggle = 'red';
    f.quadrants.red1.allianceGoal = { red: 6, blue: 0, yellow: 3 };
    f.quadrants.red2.neutralGoal.red = 2;
    f.quadrants.blue1.toggle = 'blue';
    f.quadrants.blue1.allianceGoal = { red: 0, blue: 4, yellow: 2 };
    f.quadrants.blue2.neutralGoal.blue = 2;
    f.midfieldGoal = { red: 2, blue: 0, yellow: 2 };
    f.robotsInMidfield = { red: 2, blue: 1 };
  });
  const result = scoreMatch(v5rcRules, auton, final, { red: false, blue: false });

  it('excludes Midfield robots from the V5RC autonomous score and awards the bonus', () => {
    expect(result.autonomous.field.red.total).toBe(20);
    expect(result.autonomous.field.blue.total).toBe(30);
    expect(result.autonomous.bonus).toMatchObject({ winner: 'blue', red: 0, blue: 12 });
  });

  it('totals the final score with the bonus', () => {
    expect(result.final.red).toMatchObject({
      allianceHalves: { count: 10, points: 50 },
      yellowQuadrantHalves: { count: 3, points: 30 },
      yellowMidfieldHalves: { count: 2, points: 20 },
      robotsInMidfield: { count: 2, points: 16 },
      total: 116,
    });
    expect(result.final.blue.total).toBe(70);
  });

  it('gives nobody the Midfield yellow halves on an equal robot count (<SC5b-i>)', () => {
    const tied = scoreField(v5rcRules, { ...final, robotsInMidfield: { red: 1, blue: 1 } }, 'final');
    expect(tied.red.yellowMidfieldHalves.points).toBe(0);
    expect(tied.blue.yellowMidfieldHalves.points).toBe(0);
  });

  it('counts alliance-colored halves for their own alliance regardless of Toggle (<SC3a/b>)', () => {
    const s = scoreField(v5rcRules, field((f) => {
      f.quadrants.blue2.toggle = 'blue';
      f.quadrants.blue2.neutralGoal.red = 3;
    }), 'final');
    expect(s.red.total).toBe(15);
  });
});

describe('Autonomous Bonus (<SC7>)', () => {
  const ok = { red: false, blue: false };
  it('splits 6/6 on a tie, including 0–0', () => {
    expect(autonomousBonus(v5rcRules, { red: 0, blue: 0 }, ok)).toMatchObject({ red: 6, blue: 6, winner: 'tie' });
    expect(autonomousBonus(v5rcRules, { red: 25, blue: 25 }, ok)).toMatchObject({ red: 6, blue: 6 });
  });
  it('awards the bonus to the opponent of a violating alliance, even if it scored more', () => {
    expect(autonomousBonus(v5rcRules, { red: 40, blue: 5 }, { red: true, blue: false })).toMatchObject({ red: 0, blue: 12, winner: 'blue' });
  });
  it('awards nothing when both alliances violate', () => {
    expect(autonomousBonus(v5rcRules, { red: 40, blue: 5 }, { red: true, blue: true })).toMatchObject({ red: 0, blue: 0, winner: 'none' });
  });
});

describe('VEX U differences', () => {
  it('uses 30 s autonomous and 90 s driver, one team of two robots per alliance', () => {
    expect(vexuRules.periods).toEqual({ autonomousSeconds: 30, driverSeconds: 90 });
    expect(vexuRules.format).toMatchObject({ teamsPerAlliance: 1, robotsPerAlliance: 2 });
  });

  it('counts Midfield robots and Midfield yellow ownership in the autonomous score (<VUG5>)', () => {
    // Red: 2 red halves (10) + 2 robots in Midfield (16) + 1 Midfield yellow owned 2-vs-0 (10) = 36
    const s = scoreField(vexuRules, field((f) => {
      f.quadrants.red1.allianceGoal.red = 2;
      f.midfieldGoal.yellow = 1;
      f.robotsInMidfield = { red: 2, blue: 0 };
    }), 'autonomous');
    expect(s.red.total).toBe(36);
    expect(scoreField(v5rcRules, field((f) => {
      f.quadrants.red1.allianceGoal.red = 2;
      f.midfieldGoal.yellow = 1;
      f.robotsInMidfield = { red: 2, blue: 0 };
    }), 'autonomous').red.total).toBe(10);
  });
});

describe('Autonomous Win Point checklist', () => {
  const checks = { noPerimeterContact: true, noViolations: true };
  // Red: 4 halves in Red 1's alliance goal, 2 in Red 2's neutral goal → 6 halves, 2 goals with 2+.
  const auton = field((f) => {
    f.quadrants.red1.allianceGoal.red = 4;
    f.quadrants.red2.neutralGoal.red = 2;
    f.quadrants.blue1.neutralGoal.red = 5; // opposing side: never counts
  });
  const [standard, worlds] = v5rcRules.awp;

  it('meets the standard criteria (6 halves, 2 goals) but not Worlds-qualifying (7, 3)', () => {
    expect(evaluateAwp(v5rcRules, standard!, auton, 'red', checks).every((c) => c.met)).toBe(true);
    const w = evaluateAwp(v5rcRules, worlds!, auton, 'red', checks);
    expect(w.map((c) => c.met)).toEqual([false, false, true, true]);
  });

  it('fails on perimeter contact or a violation', () => {
    const r = evaluateAwp(v5rcRules, standard!, auton, 'red', { noPerimeterContact: false, noViolations: false });
    expect(r.filter((c) => !c.met)).toHaveLength(2);
  });

  it('needs 12 halves, 4 goals and a robot in the Midfield for VEX U (<VUG6>)', () => {
    const u = field((f) => {
      f.quadrants.red1.allianceGoal.red = 3;
      f.quadrants.red1.neutralGoal.red = 3;
      f.quadrants.red2.allianceGoal.red = 3;
      f.quadrants.red2.neutralGoal.red = 3;
      f.robotsInMidfield.red = 1;
    });
    expect(evaluateAwp(vexuRules, vexuRules.awp[0]!, u, 'red', checks).every((c) => c.met)).toBe(true);
    const noRobot = { ...u, robotsInMidfield: { red: 0, blue: 0 } };
    expect(evaluateAwp(vexuRules, vexuRules.awp[0]!, noRobot, 'red', checks).find((c) => c.label.includes('robot in the Midfield'))?.met).toBe(false);
  });
});

describe('Robot Skills (<RSC3>)', () => {
  /*
   * Red 1 (red quadrant, Toggle red): 4 red (20) + 2 yellow owned (20) + 3 blue (wrong quadrant → 0)
   * Blue 1 (blue quadrant, Toggle red): 2 blue (10) + 2 yellow NOT owned (Toggle doesn't match quadrant) (0)
   * Midfield Goal: 1 red + 1 blue (10) + 2 yellow, owned because a robot ends in the Midfield (20)
   * Robot in Midfield: 8                                   Total = 20 + 20 + 10 + 10 + 20 + 8 = 88
   */
  const state = field((f) => {
    f.quadrants.red1.toggle = 'red';
    f.quadrants.red1.allianceGoal = { red: 4, blue: 3, yellow: 2 };
    f.quadrants.blue1.toggle = 'red';
    f.quadrants.blue1.neutralGoal = { red: 0, blue: 2, yellow: 2 };
    f.midfieldGoal = { red: 1, blue: 1, yellow: 2 };
    f.robotsInMidfield.red = 1;
  });

  it('scores only legally placed halves', () => {
    const s = scoreSkills(skillsV5rcRules, state);
    expect(s).toMatchObject({
      coloredHalves: { count: 8, points: 40 },
      yellowQuadrantHalves: { count: 2, points: 20 },
      yellowMidfieldHalves: { count: 2, points: 20 },
      robotsInMidfield: { count: 1, points: 8 },
      nonScoringHalves: 3,
      total: 88,
    });
  });

  it('drops Midfield yellow halves when no robot ends in the Midfield', () => {
    expect(scoreSkills(skillsV5rcRules, { ...state, robotsInMidfield: { red: 0, blue: 0 } }).total).toBe(88 - 20 - 8);
  });

  it('caps Midfield robots at 1 for V5RC and 2 for VEX U', () => {
    const two = { ...state, robotsInMidfield: { red: 2, blue: 0 } };
    expect(scoreSkills(skillsV5rcRules, two).robotsInMidfield.count).toBe(1);
    expect(scoreSkills(skillsVexuRules, two).robotsInMidfield).toEqual({ count: 2, points: 16 });
  });

  it('runs last one minute', () => {
    expect(skillsV5rcRules.runSeconds).toBe(60);
  });

  it('combines the best programming and best driver runs (<T22>)', () => {
    expect(
      combinedSkills([
        { type: 'driver', score: 50 },
        { type: 'driver', score: 70 },
        { type: 'programming', score: 30 },
      ]),
    ).toEqual({ driver: 70, programming: 30, combined: 100 });
  });
});
