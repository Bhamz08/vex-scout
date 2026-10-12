import { useEffect, useState } from 'react';
import type { Cached } from '@/data/cache';
import { formatRelative } from '@/lib/format';
import { cn } from '@/lib/cn';
import { RefreshIcon } from './icons';

/** "Updated 3 minutes ago" + manual refresh. Flags data served from the offline cache. */
export function LastUpdated({
  result,
  onRefresh,
  isFetching,
}: {
  result: Pick<Cached<unknown>, 'fetchedAt' | 'fromCache'> | undefined;
  onRefresh: () => void;
  isFetching: boolean;
}) {
  // Re-render every 30s so the relative time stays honest.
  const [, tick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      {result && (
        <span title={new Date(result.fetchedAt).toLocaleString()}>
          {result.fromCache ? 'Saved copy from ' : 'Updated '}
          {formatRelative(result.fetchedAt)}
        </span>
      )}
      <button
        type="button"
        onClick={onRefresh}
        disabled={isFetching}
        className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-line px-2 hover:bg-surface-2 disabled:opacity-60"
      >
        <RefreshIcon width={16} height={16} className={cn(isFetching && 'animate-spin')} />
        {isFetching ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  );
}
