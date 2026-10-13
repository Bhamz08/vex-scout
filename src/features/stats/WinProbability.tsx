import { cn } from '@/lib/cn';
import { formatProbability } from '@/lib/format';

/** Red-vs-blue probability bar. The numbers are always written out, so color is never the only cue. */
export function WinProbability({ red, compact = false }: { red: number; compact?: boolean }) {
  const blue = 1 - red;
  const label = `Win probability: red ${formatProbability(red)}, blue ${formatProbability(blue)}`;
  const favored = red >= 0.5 ? 'red' : 'blue';
  if (compact) {
    return (
      <span className="flex flex-col items-end leading-none" aria-label={label} title={label}>
        <span className="num text-lg">{formatProbability(Math.max(red, blue))}</span>
        <span className={cn('eyebrow text-[0.65rem]', favored === 'red' ? 'text-red-team' : 'text-blue-team')}>{favored}</span>
      </span>
    );
  }
  return (
    <div aria-label={label} role="img">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="flex items-baseline gap-2">
          <span className="eyebrow text-red-team">Red</span>
          <span className={cn('num text-2xl', favored !== 'red' && 'text-muted')}>{formatProbability(red)}</span>
        </span>
        <span className="eyebrow">Win chance</span>
        <span className="flex items-baseline gap-2">
          <span className={cn('num text-2xl', favored !== 'blue' && 'text-muted')}>{formatProbability(blue)}</span>
          <span className="eyebrow text-blue-team">Blue</span>
        </span>
      </div>
      <div className="flex h-1.5 gap-0.5 overflow-hidden">
        <div className="rounded-l-full bg-red-team" style={{ width: `${red * 100}%` }} />
        <div className="rounded-r-full bg-blue-team" style={{ width: `${blue * 100}%` }} />
      </div>
    </div>
  );
}
