/**
 * Generated buzzer tones (WebAudio oscillators). These are original synthesized sounds,
 * not recordings of official field-control audio.
 */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  // Browsers start contexts suspended until a user gesture; Start/Resume buttons count as one.
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, startOffset: number, duration: number, type: OscillatorType, volume = 0.25): void {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + startOffset;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  // Short attack/release envelope avoids clicks.
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.setValueAtTime(volume, t0 + duration - 0.05);
  gain.gain.linearRampToValueAtTime(0, t0 + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.01);
}

export const sounds = {
  /** Rising two-note chime: a period is starting. */
  start() {
    tone(660, 0, 0.18, 'square', 0.18);
    tone(990, 0.2, 0.35, 'square', 0.18);
  },
  /** Long low buzz: a period has ended. */
  stop() {
    tone(220, 0, 0.9, 'sawtooth', 0.22);
  },
  /** Short blip: endgame warning. */
  warning() {
    tone(880, 0, 0.12, 'sine', 0.3);
    tone(880, 0.2, 0.12, 'sine', 0.3);
  },
  /** Call from a click handler to unlock audio on iOS/Safari. */
  unlock() {
    audio();
  },
};
