import { describe, expect, it } from 'vitest';
import { elapsedMs, formatClock, initialTimer, pause, remainingMs, start, tick, type Period } from './timerMachine';

const periods: Period[] = [
  { id: 'auton', label: 'Autonomous', seconds: 15 },
  { id: 'driver', label: 'Driver', seconds: 105 },
];
const opts = { pauseBetween: true, warnAtSeconds: [10] };

describe('timer state machine', () => {
  it('derives time from timestamps, so irregular ticks do not drift', () => {
    let { state } = start(initialTimer, periods, 1000);
    // A badly throttled tab ticks only twice.
    state = tick(state, periods, 4000, 1000, opts).state;
    state = tick(state, periods, 10_500, 4000, opts).state;
    expect(elapsedMs(state, 10_500)).toBe(9500);
    expect(remainingMs(state, periods, 10_500)).toBe(5500);
  });

  it('pauses and resumes without losing time', () => {
    let { state } = start(initialTimer, periods, 0);
    state = pause(state, 5000);
    expect(remainingMs(state, periods, 60_000)).toBe(10_000);
    const resumed = start(state, periods, 60_000);
    expect(resumed.events).toEqual([]); // resuming mid-period: no buzzer
    expect(remainingMs(resumed.state, periods, 62_000)).toBe(8000);
  });

  it('ends a period with an event and waits between periods', () => {
    const started = start(initialTimer, periods, 0);
    expect(started.events[0]).toMatchObject({ type: 'period-start', period: { id: 'auton' } });
    const r = tick(started.state, periods, 15_200, 14_900, opts);
    expect(r.events).toEqual([{ type: 'period-end', period: periods[0], last: false }]);
    expect(r.state).toMatchObject({ status: 'between', periodIndex: 1 });
    expect(remainingMs(r.state, periods, 99_999)).toBe(105_000);
    expect(start(r.state, periods, 100_000).events[0]).toMatchObject({ type: 'period-start', period: { id: 'driver' } });
  });

  it('rolls straight into the next period, carrying overshoot, when not pausing between', () => {
    const { state } = start(initialTimer, periods, 0);
    const r = tick(state, periods, 15_300, 14_900, { ...opts, pauseBetween: false });
    expect(r.events.map((e) => e.type)).toEqual(['period-end', 'period-start']);
    expect(remainingMs(r.state, periods, 15_300)).toBe(105_000 - 300);
  });

  it('warns once when crossing the warning threshold and finishes after the last period', () => {
    let state = { status: 'running' as const, periodIndex: 1, banked: 0, runStartedAt: 0 };
    const warn = tick(state, periods, 95_100, 94_900, opts);
    expect(warn.events).toEqual([{ type: 'warning', period: periods[1], secondsLeft: 10 }]);
    expect(tick(state, periods, 95_300, 95_100, opts).events).toEqual([]);
    state = { ...state };
    const end = tick(state, periods, 105_050, 104_990, opts);
    expect(end.events).toEqual([{ type: 'period-end', period: periods[1], last: true }]);
    expect(end.state.status).toBe('done');
  });

  it('formats the clock as m:ss, rounding up so 0:00 only shows at the end', () => {
    expect(formatClock(105_000)).toBe('1:45');
    expect(formatClock(14_001)).toBe('0:15');
    expect(formatClock(900)).toBe('0:01');
    expect(formatClock(0)).toBe('0:00');
  });
});
