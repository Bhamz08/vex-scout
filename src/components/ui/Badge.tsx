import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'accent' | 'warn' | 'ok' | 'bad' | 'red' | 'blue';

const TONES: Record<Tone, string> = {
  neutral: 'border-line text-muted',
  accent: 'border-accent bg-accent text-on-accent',
  warn: 'border-warn/50 bg-warn-soft text-warn',
  ok: 'border-ok/50 text-ok',
  bad: 'border-bad/50 text-bad',
  red: 'border-red-team/40 bg-red-soft text-red-team',
  blue: 'border-blue-team/40 bg-blue-soft text-blue-team',
};

/** Compact uppercase tag. */
export function Badge({ tone = 'neutral', children, className, title }: { tone?: Tone; children: ReactNode; className?: string; title?: string }) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border px-1.5 py-px font-display text-[0.78rem] font-semibold tracking-wider whitespace-nowrap uppercase',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Visible marker for any rule value that could not be verified against the source document. */
export function UnverifiedFlag({ note }: { note: string }) {
  return (
    <Badge tone="warn" title={note}>
      <span aria-hidden="true">⚠</span> Unverified<span className="sr-only">: {note}</span>
    </Badge>
  );
}
