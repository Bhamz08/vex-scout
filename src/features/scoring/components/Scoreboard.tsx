import type { ReactNode } from 'react';

/**
 * Sticky graphite scoreboard under the header (same strip color in both themes). Alliance colors use
 * lighter tints chosen for contrast on the dark ground (≥ 7:1).
 */
export function Scoreboard({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="sticky top-14 z-20 -mx-4 bg-[#141417] px-4 py-3 text-[#ecebe6] sm:mx-0 sm:rounded-md">
      {children}
      {footer && <div className="mt-2 border-t border-white/10 pt-2 text-center text-xs text-[#a8a7ae]">{footer}</div>}
    </div>
  );
}

export function ScoreFigure({ label, value, tone }: { label: string; value: number; tone?: 'red' | 'blue' }) {
  const color = tone === 'red' ? 'text-[#ff7b7f]' : tone === 'blue' ? 'text-[#86b0ff]' : 'text-[#f2c200]';
  return (
    <div className="text-center">
      <div className={`eyebrow ${color}`}>{label}</div>
      <div className={`num text-5xl leading-none ${color}`}>{value}</div>
    </div>
  );
}
