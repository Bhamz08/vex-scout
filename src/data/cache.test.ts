import { beforeEach, describe, expect, it } from 'vitest';
import { cachedFetch } from './cache';
import { db } from './db';

describe('cachedFetch', () => {
  beforeEach(async () => {
    await db.cache.clear();
  });

  it('stores successful responses and serves them when the network fails', async () => {
    const fresh = await cachedFetch('k', async () => ({ n: 1 }));
    expect(fresh).toMatchObject({ data: { n: 1 }, fromCache: false });

    const offline = await cachedFetch('k', async () => {
      throw new Error('offline');
    });
    expect(offline).toMatchObject({ data: { n: 1 }, fromCache: true, fetchedAt: fresh.fetchedAt });
  });

  it('rethrows when there is nothing cached', async () => {
    await expect(
      cachedFetch('missing', async () => {
        throw new Error('offline');
      }),
    ).rejects.toThrow('offline');
  });
});
