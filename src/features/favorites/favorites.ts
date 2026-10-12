import { useLiveQuery } from 'dexie-react-hooks';
import { db, live, softDelete, stamp } from '@/data/records';
import type { FavoriteRecord } from '@/data/db';

export type FavoriteKind = FavoriteRecord['kind'];

export function useFavorites(kind?: FavoriteKind): FavoriteRecord[] {
  return (
    useLiveQuery(async () => {
      const rows = live(await db.favorites.toArray());
      return rows.filter((f) => !kind || f.kind === kind).sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
    }, [kind]) ?? []
  );
}

export function useIsFavorite(kind: FavoriteKind, refId: string): FavoriteRecord | undefined {
  return useLiveQuery(async () => {
    const rows = await db.favorites.where({ kind, refId }).toArray();
    return live(rows)[0];
  }, [kind, refId]);
}

export async function toggleFavorite(kind: FavoriteKind, refId: string, label: string, subtitle: string): Promise<void> {
  const existing = live(await db.favorites.where({ kind, refId }).toArray())[0];
  if (existing) {
    await softDelete(db.favorites, existing.id);
  } else {
    await db.favorites.put(stamp({ kind, refId, label, subtitle, createdAt: Date.now() }));
  }
}
