import { useCallback, useEffect, useRef, useState } from 'react';
import { sounds } from './sound';
import { initialTimer, pause, remainingMs, reset, start, tick, type Period, type TimerEvent, type TimerState } from './timerMachine';
import { useWakeLock } from './useWakeLock';

export interface MatchTimerOptions {
  pauseBetween: boolean;
  muted: boolean;
  warnAtSeconds?: number[];
  onEvent?: (e: TimerEvent) => void;
}

/**
 * React binding for the timer state machine. A requestAnimationFrame loop samples performance.now(),
 * so the display is always computed from real elapsed time.
 */
export function useMatchTimer(periods: Period[], opts: MatchTimerOptions) {
  const [state, setState] = useState<TimerState>(initialTimer);
  const [now, setNow] = useState(() => performance.now());
  const stateRef = useRef(state);
  const lastTick = useRef(performance.now());
  const optsRef = useRef(opts);
  optsRef.current = opts;
  stateRef.current = state;

  const emit = useCallback((events: TimerEvent[]) => {
    for (const e of events) {
      if (!optsRef.current.muted) {
        if (e.type === 'period-start') sounds.start();
        else if (e.type === 'period-end') sounds.stop();
        else sounds.warning();
      }
      optsRef.current.onEvent?.(e);
    }
  }, []);

  useEffect(() => {
    if (state.status !== 'running') return;
    let frame = 0;
    const loop = () => {
      const t = performance.now();
      const r = tick(stateRef.current, periods, t, lastTick.current, { pauseBetween: optsRef.current.pauseBetween, warnAtSeconds: optsRef.current.warnAtSeconds ?? [] });
      lastTick.current = t;
      if (r.state !== stateRef.current) {
        stateRef.current = r.state;
        setState(r.state);
      }
      emit(r.events);
      setNow(t);
      if (r.state.status === 'running') frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [state.status, periods, emit]);

  // Changing the mode (periods) resets the clock.
  useEffect(() => {
    setState(reset());
  }, [periods]);

  useWakeLock(state.status === 'running' || state.status === 'between' || state.status === 'paused');

  const onStart = () => {
    sounds.unlock();
    const t = performance.now();
    lastTick.current = t;
    const r = start(stateRef.current, periods, t);
    setState(r.state);
    setNow(t);
    emit(r.events);
  };
  const onPause = () => setState((s) => pause(s, performance.now()));
  const onReset = () => setState(reset());

  return {
    state,
    period: periods[state.periodIndex],
    remaining: remainingMs(state, periods, state.status === 'running' ? now : performance.now()),
    start: onStart,
    pause: onPause,
    reset: onReset,
  };
}
