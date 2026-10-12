import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Fields';
import { cn } from '@/lib/cn';
import { formatClock, type Period, type TimerEvent } from './timerMachine';
import { useMatchTimer } from './useMatchTimer';

/** Countdown display + controls for a sequence of periods. Used by the Timer page and the Skills calculator. */
export function MatchTimer({ periods, compact = false, warnAtSeconds = [] }: { periods: Period[]; compact?: boolean; warnAtSeconds?: number[] }) {
  const [muted, setMuted] = useState(false);
  const [pauseBetween, setPauseBetween] = useState(true);
  const [announcement, setAnnouncement] = useState('');

  const onEvent = (e: TimerEvent) => {
    if (e.type === 'period-start') setAnnouncement(`${e.period.label} started`);
    if (e.type === 'period-end') setAnnouncement(e.last ? 'Match over' : `${e.period.label} over`);
    if (e.type === 'warning') setAnnouncement(`${e.secondsLeft} seconds left`);
  };
  const timer = useMatchTimer(periods, { muted, pauseBetween, warnAtSeconds, onEvent });
  const { state, period, remaining } = timer;
  const fraction = period ? remaining / (period.seconds * 1000) : 0;
  const running = state.status === 'running';

  const statusText =
    state.status === 'idle'
      ? 'Ready'
      : state.status === 'between'
        ? `Next: ${period?.label ?? ''}`
        : state.status === 'done'
          ? 'Time!'
          : state.status === 'paused'
            ? 'Paused'
            : (period?.label ?? '');

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-sm font-semibold tracking-wide text-muted uppercase">{statusText}</div>
        <div
          className={cn('tabular font-bold', compact ? 'text-6xl' : 'text-8xl sm:text-9xl', remaining <= 10_000 && running && 'text-bad')}
          role="timer"
          aria-label={`${formatClock(remaining)} remaining in ${period?.label ?? 'match'}`}
        >
          {formatClock(remaining)}
        </div>
        <div className="mx-auto mt-3 h-3 max-w-md overflow-hidden rounded-full border border-line bg-surface-2" aria-hidden="true">
          <div className="h-full bg-accent transition-[width] duration-100" style={{ width: `${fraction * 100}%` }} />
        </div>
        {periods.length > 1 && (
          <ol className="mt-3 flex justify-center gap-2 text-xs" aria-label="Periods">
            {periods.map((p, i) => (
              <li
                key={p.id}
                className={cn('rounded-full border px-2 py-0.5', i === state.periodIndex ? 'border-accent font-semibold text-accent' : 'border-line text-muted')}
              >
                {p.label} {formatClock(p.seconds * 1000)}
              </li>
            ))}
          </ol>
        )}
        <p className="sr-only" aria-live="assertive">
          {announcement}
        </p>
      </div>

      <div className="flex justify-center gap-3">
        {running ? (
          <Button size="lg" variant="primary" onClick={timer.pause} className="min-w-32">
            Pause
          </Button>
        ) : (
          <Button size="lg" variant="primary" onClick={timer.start} className="min-w-32" disabled={state.status === 'done'}>
            {state.status === 'idle' ? 'Start' : state.status === 'between' ? `Start ${period?.label ?? ''}` : 'Resume'}
          </Button>
        )}
        <Button size="lg" onClick={timer.reset}>
          Reset
        </Button>
      </div>

      {!compact && (
        <div className="mx-auto max-w-md space-y-3">
          <Switch label="Sound" description="Generated start/stop buzzers and an endgame warning." checked={!muted} onChange={(v) => setMuted(!v)} />
          {periods.length > 1 && (
            <Switch label="Pause between periods" description="Stop after autonomous until you start driver control." checked={pauseBetween} onChange={setPauseBetween} />
          )}
        </div>
      )}
    </div>
  );
}
