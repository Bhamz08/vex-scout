/**
 * Drift-resistant countdown across match periods. Time is always derived from timestamps
 * (performance.now() in the app) rather than by decrementing a counter, so throttled or late
 * frames never make the clock run slow. Pure functions: easy to test with fake times.
 */

export interface Period {
  id: string;
  label: string;
  seconds: number;
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'between' | 'done';

export interface TimerState {
  status: TimerStatus;
  periodIndex: number;
  /** ms elapsed in the current period before the current run started */
  banked: number;
  /** timestamp (ms) the current run started, when running */
  runStartedAt: number | null;
}

export type TimerEvent = { type: 'period-start'; period: Period } | { type: 'period-end'; period: Period; last: boolean } | { type: 'warning'; period: Period; secondsLeft: number };

export const initialTimer: TimerState = { status: 'idle', periodIndex: 0, banked: 0, runStartedAt: null };

export function elapsedMs(state: TimerState, now: number): number {
  return state.banked + (state.status === 'running' && state.runStartedAt !== null ? now - state.runStartedAt : 0);
}

export function remainingMs(state: TimerState, periods: Period[], now: number): number {
  const period = periods[state.periodIndex];
  if (!period) return 0;
  if (state.status === 'done') return 0;
  return Math.max(0, period.seconds * 1000 - elapsedMs(state, now));
}

export function start(state: TimerState, periods: Period[], now: number): { state: TimerState; events: TimerEvent[] } {
  if (state.status === 'running') return { state, events: [] };
  const fresh = state.status === 'idle' || state.status === 'done';
  const next: TimerState = fresh ? { ...initialTimer, status: 'running', runStartedAt: now } : { ...state, status: 'running', runStartedAt: now };
  const period = periods[next.periodIndex];
  // A buzzer sounds when a period begins, not when resuming from a pause mid-period.
  const startsPeriod = fresh || state.status === 'between';
  return { state: next, events: startsPeriod && period ? [{ type: 'period-start', period }] : [] };
}

export function pause(state: TimerState, now: number): TimerState {
  if (state.status !== 'running') return state;
  return { ...state, status: 'paused', banked: elapsedMs(state, now), runStartedAt: null };
}

export function reset(): TimerState {
  return initialTimer;
}

/**
 * Advances the clock to `now`, emitting events for period ends and warnings crossed since `prevNow`.
 * With `pauseBetween`, the timer stops at the end of each period (like a real match, where the
 * field resets before driver control); otherwise it rolls straight into the next one.
 */
export function tick(
  state: TimerState,
  periods: Period[],
  now: number,
  prevNow: number,
  opts: { pauseBetween: boolean; warnAtSeconds: number[] },
): { state: TimerState; events: TimerEvent[] } {
  if (state.status !== 'running') return { state, events: [] };
  const period = periods[state.periodIndex];
  if (!period) return { state, events: [] };

  const events: TimerEvent[] = [];
  const total = period.seconds * 1000;
  const before = total - elapsedMs(state, prevNow);
  const after = total - elapsedMs(state, now);

  for (const s of opts.warnAtSeconds) {
    if (s * 1000 < total && before > s * 1000 && after <= s * 1000) events.push({ type: 'warning', period, secondsLeft: s });
  }
  if (after > 0) return { state, events };

  const last = state.periodIndex >= periods.length - 1;
  events.push({ type: 'period-end', period, last });
  if (last) return { state: { ...state, status: 'done', banked: total, runStartedAt: null }, events };

  const nextIndex = state.periodIndex + 1;
  if (opts.pauseBetween) return { state: { status: 'between', periodIndex: nextIndex, banked: 0, runStartedAt: null }, events };

  // Roll over, carrying any overshoot so the next period stays in sync with real time.
  const overshoot = -after;
  const next = periods[nextIndex];
  if (next) events.push({ type: 'period-start', period: next });
  return { state: { status: 'running', periodIndex: nextIndex, banked: overshoot, runStartedAt: now }, events };
}

export function formatClock(ms: number): string {
  // Round up, like a match clock: "0:01" until the last instant, "0:00" only once time is up.
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
