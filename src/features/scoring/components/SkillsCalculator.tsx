import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/Fields';
import { Tabs } from '@/components/ui/Tabs';
import { db, live, softDelete, stamp } from '@/data/records';
import { MatchTimer } from '@/features/timer/MatchTimer';
import { formatDate } from '@/lib/format';
import { combinedSkills, scoreSkills } from '../engine';
import { skillsV5rcRules, skillsVexuRules } from '../rules/skills';
import { useScoringStore } from '../store';
import { FieldEditor } from './FieldEditor';
import { RulesInfo } from './RulesInfo';
import { ScoreFigure, Scoreboard } from './Scoreboard';
import { SkillsChart } from './SkillsChart';

const VARIANTS = { 'skills-v5rc': skillsV5rcRules, 'skills-vexu': skillsVexuRules } as const;

export function SkillsCalculator() {
  const calc = useScoringStore((s) => s.skills);
  const setSkills = useScoringStore((s) => s.setSkills);
  const reset = useScoringStore((s) => s.reset);
  const rules = VARIANTS[calc.variant];
  const result = scoreSkills(rules, calc.field);
  const [note, setNote] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const periods = useMemo(() => [{ id: 'run', label: calc.runType === 'driver' ? 'Driving Skills' : 'Autonomous Coding Skills', seconds: rules.runSeconds }], [rules.runSeconds, calc.runType]);

  const runs = useLiveQuery(async () => live(await db.skillsRuns.where('rulesId').equals(rules.id).toArray()), [rules.id]) ?? [];
  const best = combinedSkills(runs);
  const p = rules.points;

  const save = async () => {
    await db.skillsRuns.put(stamp({ rulesId: rules.id, type: calc.runType, score: result.total, note: note.trim(), createdAt: Date.now() }));
    setNote('');
    setSavedMsg(`Saved ${calc.runType === 'driver' ? 'driver' : 'programming'} run: ${result.total}`);
  };

  return (
    <div className="space-y-4">
      <RulesInfo rules={rules}>
        <p>
          Each run lasts {rules.runSeconds} seconds with {rules.robots === 1 ? 'one robot' : `up to ${rules.robots} robots`}. There is no Autonomous Bonus.
        </p>
        <p>
          Red halves score {p.coloredHalf} only in a red quadrant or the Midfield Goal; blue halves only in a blue quadrant or the Midfield Goal. Yellow halves score{' '}
          {p.yellowHalf} in a quadrant whose Toggle matches the quadrant’s color, and in the Midfield Goal if a robot ends in the Midfield. Each robot ending in the
          Midfield scores {p.robotInMidfield}.
        </p>
        <p>Your skills score is your best Autonomous Coding run plus your best Driving run.</p>
      </RulesInfo>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          label="Skills rules"
          value={calc.variant}
          onChange={(variant) => setSkills({ ...calc, variant })}
          items={[
            { id: 'skills-v5rc', label: skillsV5rcRules.label },
            { id: 'skills-vexu', label: skillsVexuRules.label },
          ]}
        />
        <Tabs
          label="Run type"
          value={calc.runType}
          onChange={(runType) => setSkills({ ...calc, runType })}
          items={[
            { id: 'driver', label: 'Driver' },
            { id: 'programming', label: 'Programming' },
          ]}
        />
      </div>

      <Card>
        <MatchTimer key={`${rules.id}-${calc.runType}`} periods={periods} compact />
      </Card>

      <Scoreboard>
        <div className="flex items-center justify-between" aria-live="polite">
          <ScoreFigure label={`${calc.runType === 'driver' ? 'Driver' : 'Programming'} run`} value={result.total} />
          <button
            type="button"
            className="rounded border border-white/25 px-3 py-1.5 font-display text-sm font-semibold tracking-wider text-[#ecebe6] uppercase hover:border-white/60"
            onClick={() => {
              if (window.confirm('Clear the field inputs?')) reset('skills');
            }}
          >
            Reset
          </button>
        </div>
      </Scoreboard>

      <FieldEditor
        layout={rules.field}
        value={calc.field}
        onChange={(field) => setSkills({ ...calc, field })}
        robots={[{ color: 'red', label: 'Robots in the Midfield', max: rules.robots }]}
      />

      <Card className="space-y-2 text-sm">
        <h3 className="font-semibold">Breakdown</h3>
        <dl className="tabular grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
          <dt>Red/blue halves in a legal spot ×{p.coloredHalf}</dt>
          <dd className="text-right">
            {result.coloredHalves.count} → {result.coloredHalves.points}
          </dd>
          <dt>Yellow halves, matching Toggle ×{p.yellowHalf}</dt>
          <dd className="text-right">
            {result.yellowQuadrantHalves.count} → {result.yellowQuadrantHalves.points}
          </dd>
          <dt>Yellow halves, Midfield Goal ×{p.yellowHalf}</dt>
          <dd className="text-right">
            {result.yellowMidfieldHalves.count} → {result.yellowMidfieldHalves.points}
          </dd>
          <dt>Robots in the Midfield ×{p.robotInMidfield}</dt>
          <dd className="text-right">
            {result.robotsInMidfield.count} → {result.robotsInMidfield.points}
          </dd>
          <dt className="font-bold">Total</dt>
          <dd className="text-right font-bold">{result.total}</dd>
        </dl>
        {result.nonScoringHalves > 0 && (
          <p className="text-warn">
            ⚠ {result.nonScoringHalves} red/blue half{result.nonScoringHalves === 1 ? ' is' : 'ves are'} in an opposite-colored quadrant and don’t score.
          </p>
        )}
        <div className="flex flex-wrap items-end gap-2 pt-2">
          <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="min-w-48 flex-1" />
          <Button variant="primary" onClick={() => void save()}>
            Save run
          </Button>
        </div>
        {savedMsg && (
          <p role="status" className="text-ok">
            ✓ {savedMsg}
          </p>
        )}
      </Card>

      <Card className="space-y-3">
        <h3 className="font-semibold">Your {rules.label} runs</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ['Best driver', best.driver],
            ['Best programming', best.programming],
            ['Best combined', best.combined],
          ].map(([label, v]) => (
            <div key={label} className="rounded bg-surface-2 p-2">
              <div className="text-xs text-muted">{label}</div>
              <div className="tabular text-2xl font-bold">{v}</div>
            </div>
          ))}
        </div>
        <SkillsChart runs={runs} />
        {runs.length > 0 && (
          <ul className="divide-y divide-line text-sm">
            {[...runs]
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 py-2">
                  <span>
                    <span className="font-semibold">{r.type === 'driver' ? 'Driver' : 'Programming'}</span> <span className="tabular">{r.score}</span>
                    <span className="text-muted">
                      {' '}
                      · {formatDate(new Date(r.createdAt).toISOString())}
                      {r.note && ` · ${r.note}`}
                    </span>
                  </span>
                  <Button size="sm" variant="ghost" aria-label={`Delete ${r.type} run of ${r.score}`} onClick={() => void softDelete(db.skillsRuns, r.id)}>
                    Delete
                  </Button>
                </li>
              ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
