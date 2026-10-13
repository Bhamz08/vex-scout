import { useId } from 'react';
import { Stepper } from '@/components/ui/Fields';
import { cn } from '@/lib/cn';
import type { FieldState, GoalHalves, QuadrantState } from '../engine';
import type { AllianceColor, FieldLayout, HalfColor, QuadrantId, ToggleState } from '../rules/types';

const HALF_LABELS: Record<HalfColor, string> = { red: 'Red halves', blue: 'Blue halves', yellow: 'Yellow halves' };
const TOGGLE_LABELS: Record<ToggleState, string> = { red: 'Red', blue: 'Blue', yellow: 'Neutral (yellow)' };
const MAX_HALVES = 60;

/**
 * Editor for a field snapshot: Toggle state and Scored Pin Halves per Goal, the Midfield Goal, and robots
 * in the Midfield. `robots` lists which alliances' robot counts to show and their maximum.
 */
export function FieldEditor({
  layout,
  value,
  onChange,
  robots,
  colors = ['red', 'blue', 'yellow'],
}: {
  layout: FieldLayout;
  value: FieldState;
  onChange: (next: FieldState) => void;
  robots: Array<{ color: AllianceColor; label: string; max: number }>;
  colors?: HalfColor[];
}) {
  const setQuadrant = (id: QuadrantId, q: QuadrantState) => onChange({ ...value, quadrants: { ...value.quadrants, [id]: q } });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {layout.quadrants.map((q) => {
          const qs = value.quadrants[q.id];
          return (
            <fieldset key={q.id} className={cn('space-y-3 rounded-md border border-t-4 border-line bg-surface p-3 pt-2', q.color === 'red' ? 'border-t-red-team' : 'border-t-blue-team')}>
              <legend className="float-left mb-1 w-full font-display text-xl font-semibold uppercase">{q.label} quadrant</legend>
              <ToggleInput value={qs.toggle} onChange={(toggle) => setQuadrant(q.id, { ...qs, toggle })} />
              {layout.goalsPerQuadrant.map((g) => {
                const key = g.kind === 'alliance' ? 'allianceGoal' : 'neutralGoal';
                return (
                  <GoalInput
                    key={g.kind}
                    title={`${q.label}: ${g.kind === 'alliance' ? `${q.color === 'red' ? 'Red' : 'Blue'} ${g.label}` : g.label}`}
                    value={qs[key]}
                    colors={colors}
                    onChange={(goal) => setQuadrant(q.id, { ...qs, [key]: goal })}
                  />
                );
              })}
            </fieldset>
          );
        })}
      </div>

      <fieldset className="space-y-3 rounded-md border border-t-4 border-line border-t-warn bg-surface p-3 pt-2">
        <legend className="float-left mb-1 w-full font-display text-xl font-semibold uppercase">Midfield</legend>
        <GoalInput title={layout.midfieldGoalLabel} value={value.midfieldGoal} colors={colors} onChange={(midfieldGoal) => onChange({ ...value, midfieldGoal })} />
        <div className="space-y-2">
          <div className="text-sm font-medium">Robots at least partly in the Midfield</div>
          {robots.map((r) => (
            <Stepper
              key={r.color}
              label={r.label}
              tone={r.color}
              value={value.robotsInMidfield[r.color]}
              max={r.max}
              onChange={(n) => onChange({ ...value, robotsInMidfield: { ...value.robotsInMidfield, [r.color]: n } })}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function GoalInput({ title, value, onChange, colors }: { title: string; value: GoalHalves; onChange: (g: GoalHalves) => void; colors: HalfColor[] }) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{title}</div>
      {colors.map((c) => (
        <Stepper
          key={c}
          label={HALF_LABELS[c]}
          name={`${title} ${HALF_LABELS[c].toLowerCase()}`}
          tone={c === 'yellow' ? undefined : c}
          value={value[c]}
          max={MAX_HALVES}
          onChange={(n) => onChange({ ...value, [c]: n })}
        />
      ))}
    </div>
  );
}

function ToggleInput({ value, onChange }: { value: ToggleState; onChange: (t: ToggleState) => void }) {
  const name = useId();
  return (
    <fieldset>
      <legend className="eyebrow mb-1">Toggle</legend>
      <div className="grid grid-cols-3 gap-1">
        {(['red', 'yellow', 'blue'] as const).map((t) => (
          <label key={t}>
            <input type="radio" name={name} className="peer sr-only" checked={value === t} onChange={() => onChange(t)} />
            <span
              className={cn(
                'flex min-h-10 cursor-pointer items-center justify-center rounded border px-1 text-center text-xs font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-accent',
                value === t
                  ? t === 'red'
                    ? 'border-red-team bg-red-soft text-red-team ring-2 ring-red-team'
                    : t === 'blue'
                      ? 'border-blue-team bg-blue-soft text-blue-team ring-2 ring-blue-team'
                      : 'border-warn bg-warn-soft text-warn ring-2 ring-warn'
                  : 'border-line text-muted',
              )}
            >
              {value === t && <span aria-hidden="true">✓&nbsp;</span>}
              {TOGGLE_LABELS[t]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
