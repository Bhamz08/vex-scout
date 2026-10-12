import { effectiveDataMode, useSettings } from '@/features/settings/store';
import type { DataSource } from './DataSource';
import { DemoDataSource } from './demo/DemoDataSource';
import { LiveDataSource } from './live/LiveDataSource';

const sources: Record<DataSource['kind'], DataSource> = {
  demo: new DemoDataSource(),
  live: new LiveDataSource(),
};

/** The active DataSource. Demo unless the user picked Live and the deployment has the proxy configured. */
export function useDataSource(): DataSource {
  const mode = effectiveDataMode(useSettings((s) => s.dataMode));
  return sources[mode];
}
