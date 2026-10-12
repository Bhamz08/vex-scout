import { formatProbability } from '@/lib/format';

/** Red-vs-blue probability bar. The numbers are always written out, so color is never the only cue. */
export function WinProbability({ red, compact = false }: { red: number; compact?: boolean }) {
  const blue = 1 - red;
  const label = `Win probability: red ${formatProbability(red)}, blue ${formatProbability(blue)}`;
  if (compact) {
    const favored = red >= 0.5 ? 'red' : 'blue';
    return (
      <span className={favored === 'red' ? 'text-red-team' : 'text-blue-team'} aria-label={label} title={label}>
        <span className="tabular text-sm font-bold">{formatProbability(Math.max(red, blue))}</span>
        <span className="block text-[10px] font-semibold uppercase">{favored}</span>
      </span>
    );
  }
  return (
    <div aria-label={label} role="img">
      <div className="mb-1 flex justify-between text-sm font-semibold">
        <span className="text-red-team">Red {formatProbability(red)}</span>
        <span className="text-blue-team">{formatProbability(blue)} Blue</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full border border-line">
        <div className="bg-red-team" style={{ width: `${red * 100}%` }} />
        <div className="bg-blue-team" style={{ width: `${blue * 100}%` }} />
      </div>
    </div>
  );
}
