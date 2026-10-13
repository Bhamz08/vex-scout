import type { DataSource } from './DataSource';
import { LiveDataSource } from './live/LiveDataSource';

const source: DataSource = new LiveDataSource();

/** The app's DataSource (VEX Events API through our proxy). A hook so tests or a future source can swap it. */
export function useDataSource(): DataSource {
  return source;
}
