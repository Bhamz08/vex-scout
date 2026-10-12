import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { Cached } from '@/data/cache';
import { ErrorState, Loading } from './ui/States';

/** Renders loading / error states for a data query and hands the data to `children` once ready. */
export function QueryView<T>({
  query,
  children,
  loadingLabel,
}: {
  query: UseQueryResult<Cached<T>>;
  children: (data: T) => ReactNode;
  loadingLabel?: string;
}) {
  if (query.isPending) return <Loading label={loadingLabel} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  return <>{children(query.data.data)}</>;
}
