import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'accent' | 'warn' | 'ok' | 'bad' | 'red' | 'blue';

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-muted border-line',
  accent: 'bg-surface-2 text-accent border-accent',
  warn: 'bg-warn-soft text-warn border-warn',
  ok: 'bg-surface-2 text-ok border-ok',
  bad: 'bg-surface-2 text-bad border-bad',
  red: 'bg-red-soft text-red-team border-red-team',
  blue: 'bg-blue-soft text-blue-team border-blue-team',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
  title,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold', TONES[tone], className)}
    >
      {children}
    </span>
  );
}

/** Visible marker for any rule value that could not be verified against the source document. */
export function UnverifiedFlag({ note }: { note: string }) {
  return (
    <Badge tone="warn" title={note}>
      <span aria-hidden="true">⚠</span> UNVERIFIED<span className="sr-only">: {note}</span>
    </Badge>
  );
}
