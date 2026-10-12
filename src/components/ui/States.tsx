import type { ReactNode } from 'react';
import { Button } from './Button';

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-8 text-muted">
      <span className="size-5 animate-spin rounded-full border-2 border-line border-t-accent" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div role="alert" className="space-y-2 rounded-xl border border-bad bg-surface p-4">
      <p className="font-semibold text-bad">Something went wrong</p>
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
    <div className="rounded-xl border border-dashed border-line p-6 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}
