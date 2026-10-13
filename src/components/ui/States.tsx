import type { ReactNode } from 'react';
import { Button } from './Button';

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-10 text-sm text-muted">
      <span className="h-0.5 w-10 overflow-hidden bg-line" aria-hidden="true">
        <span className="block h-full w-1/2 animate-[pulse_1s_ease-in-out_infinite] bg-accent" />
      </span>
      {label}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div role="alert" className="space-y-3 border-l-[3px] border-bad py-2 pl-4">
      <p className="font-display text-xl font-semibold uppercase">Couldn’t load this</p>
      <p className="text-sm text-muted">{message}</p>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border-b border-dashed border-line py-6">
      <p className="font-display text-lg font-semibold text-muted uppercase">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}
