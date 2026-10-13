import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SelectField } from '@/components/ui/Fields';
import { Tabs } from '@/components/ui/Tabs';
import { cn } from '@/lib/cn';
import { evaluateAwp, scoreMatch } from '../engine';
import type { AllianceColor, MatchRules } from '../rules/types';
import { useScoringStore } from '../store';
import { MatchBreakdown } from './Breakdown';
import { ScoreFigure, Scoreboard } from './Scoreboard';
import { FieldEditor } from './FieldEditor';
import { RulesInfo } from './RulesInfo';

type Snapshot = 'autonomous' | 'final';

/** Red-vs-blue match calculator driven entirely by a MatchRules config. */
export function MatchCalculator({ rules }: { rules: MatchRules }) {
  const mode = rules.id;
  const calc = useScoringStore((s) => s[mode]);
  const setMatch = useScoringStore((s) => s.setMatch);
  const reset = useScoringStore((s) => s.reset);
  const [snapshot, setSnapshot] = useState<Snapshot>('final');
  const update = (patch: Partial<typeof calc>) => setMatch(mode, { ...calc, ...patch });

  const result = scoreMatch(rules, calc.autonomous, calc.final, calc.violations);
  const criteria = rules.awp.find((c) => c.id === calc.awpCriteriaId) ?? rules.awp[0];
  const robots = (['red', 'blue'] as const).map((color) => ({
    color,
    label: `${color === 'red' ? 'Red' : 'Blue'} robots`,
    max: rules.format.robotsPerAlliance,
  }));
  const p = rules.points;
  const b = rules.autonomousBonus;

  return (
    <div className="space-y-4">
      <RulesInfo rules={rules}>
        <p>
          {rules.format.teamsPerAlliance === 1 ? 'One team with two robots' : `${rules.format.teamsPerAlliance} teams`} per alliance;{' '}
          {rules.periods.autonomousSeconds} s autonomous then {rules.periods.driverSeconds} s driver control.
        </p>
        <p>
          Count only Pin Halves that are <strong>visible</strong> on Placed Pins; a half hidden inside a Goal or the opaque side of a Cup doesn’t score. Red and
          blue halves always score {p.allianceHalf} for their own color. Yellow halves score {p.yellowHalf} for whoever owns them: in a quadrant, the alliance
          matching that quadrant’s Toggle (yellow Toggle = nobody); in the Midfield Goal, the alliance with more robots in the Midfield (tie = nobody). Each robot
          ending in the Midfield scores {p.robotInMidfield}.
        </p>
        <p>
          Autonomous Bonus: {b.points} to the higher autonomous score, {b.tiePointsEach} each on a tie.{' '}
          {b.includesMidfield ? 'Midfield robots and Midfield yellow halves count toward the autonomous score.' : 'Midfield robots and Midfield yellow halves do not count toward the autonomous score.'}{' '}
          An autonomous violation gives the bonus to the other alliance; if both violate, nobody gets it.
        </p>
      </RulesInfo>

      <Scoreboard
        footer={
          <>
            Auton bonus: {result.autonomous.bonus.reason} →{' '}
            {result.autonomous.bonus.winner === 'none' ? 'not awarded' : result.autonomous.bonus.winner === 'tie' ? 'split' : `${result.autonomous.bonus.winner} +${b.points}`}
          </>
        }
      >
        <div className="flex items-center justify-around" aria-live="polite">
          <ScoreFigure label="Red" value={result.final.red.total} tone="red" />
          <span className="eyebrow text-[#a8a7ae]">vs</span>
          <ScoreFigure label="Blue" value={result.final.blue.total} tone="blue" />
        </div>
      </Scoreboard>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs<Snapshot>
          label="Field snapshot"
          value={snapshot}
          onChange={setSnapshot}
          items={[
            { id: 'autonomous', label: `End of autonomous (${result.autonomous.field.red.total}–${result.autonomous.field.blue.total})` },
            { id: 'final', label: 'End of match' },
          ]}
        />
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (window.confirm(`Reset the ${rules.label} calculator?`)) reset(mode);
          }}
        >
          Reset
        </Button>
      </div>

      {snapshot === 'autonomous' ? (
        <>
          <FieldEditor layout={rules.field} value={calc.autonomous} robots={robots} onChange={(autonomous) => update({ autonomous })} />
          <Card className="space-y-2">
            <h3 className="font-semibold">Autonomous violations</h3>
            {(['red', 'blue'] as const).map((c) => (
              <label key={c} className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  className="size-5 accent-[var(--accent)]"
                  checked={calc.violations[c]}
                  onChange={(e) => update({ violations: { ...calc.violations, [c]: e.target.checked } })}
                />
                <span className={c === 'red' ? 'text-red-team' : 'text-blue-team'}>{c === 'red' ? 'Red' : 'Blue'} committed a violation</span>
              </label>
            ))}
          </Card>
        </>
      ) : (
        <FieldEditor layout={rules.field} value={calc.final} robots={robots} onChange={(final) => update({ final })} />
      )}

      <Card>
        <h3 className="mb-2 font-semibold">Breakdown</h3>
        <MatchBreakdown result={result.final} points={p} />
      </Card>

      {criteria && (
        <Card className="space-y-3">
          <div>
            <h3 className="font-semibold">Autonomous Win Point checklist</h3>
            <p className="text-sm text-muted">Informational: AWP is a ranking point, not match points. Checked against the end-of-autonomous snapshot.</p>
          </div>
          {rules.awp.length > 1 && (
            <SelectField label="Event type" value={criteria.id} onChange={(e) => update({ awpCriteriaId: e.target.value })}>
              {rules.awp.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </SelectField>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {(['red', 'blue'] as const).map((color) => (
              <AwpColumn key={color} color={color} conditions={evaluateAwp(rules, criteria, calc.autonomous, color, calc.awpChecks[color])} perimeterOk={calc.awpChecks[color].noPerimeterContact} onPerimeter={(v) => update({ awpChecks: { ...calc.awpChecks, [color]: { ...calc.awpChecks[color], noPerimeterContact: v } } })} violation={calc.violations[color]} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function AwpColumn({
  color,
  conditions,
  perimeterOk,
  onPerimeter,
  violation,
}: {
  color: AllianceColor;
  conditions: ReturnType<typeof evaluateAwp>;
  perimeterOk: boolean;
  onPerimeter: (v: boolean) => void;
  violation: boolean;
}) {
  // The violations checkbox on the autonomous snapshot feeds the "no violations" condition.
  const list = conditions.map((c) => (c.label.startsWith('No violations') ? { ...c, met: !violation, detail: violation ? 'Violation' : 'None' } : c));
  const earned = list.every((c) => c.met);
  return (
    <div className={cn('space-y-2 rounded-md border-l-4 p-3', color === 'red' ? 'border-red-team bg-red-soft' : 'border-blue-team bg-blue-soft')}>
      <div className="flex items-center justify-between font-semibold">
        <span className={color === 'red' ? 'text-red-team' : 'text-blue-team'}>{color === 'red' ? 'Red' : 'Blue'}</span>
        <span>{earned ? '✓ AWP earned' : '✗ Not earned'}</span>
      </div>
      <ul className="space-y-1 text-sm">
        {list.map((c) => (
          <li key={c.label} className="flex justify-between gap-2">
            <span>
              <span aria-hidden="true">{c.met ? '✓' : '✗'} </span>
              <span className="sr-only">{c.met ? 'Met: ' : 'Not met: '}</span>
              {c.label}
            </span>
            <span className="tabular shrink-0 text-muted">{c.detail}</span>
          </li>
        ))}
      </ul>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" className="size-5 accent-[var(--accent)]" checked={perimeterOk} onChange={(e) => onPerimeter(e.target.checked)} />
        Neither robot touching the perimeter at the end of autonomous
      </label>
    </div>
  );
}
