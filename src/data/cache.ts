import { db } from './db';

export interface Cached<T> {
  data: T;
  /** epoch ms when this data was fetched from the network */
  fetchedAt: number;
  /** true when the network failed and we served the last saved copy */
  fromCache: boolean;
}

/**
 * Network-first fetch with an IndexedDB fallback: on success the response is saved under `key`;
 * on failure (offline, API down) the last saved copy is returned instead, with its original timestamp.
 */
export async function cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<Cached<T>> {
  try {
    const data = await fetcher();
    const fetchedAt = Date.now();
    // Caching is best-effort: a full or blocked IndexedDB must not break the request.
    await db.cache.put({ key, data, fetchedAt }).catch(() => undefined);
    return { data, fetchedAt, fromCache: false };
  } catch (error) {
    const hit = await db.cache.get(key).catch(() => undefined);
    if (hit) return { data: hit.data as T, fetchedAt: hit.fetchedAt, fromCache: true };
    throw error;
  }
}
