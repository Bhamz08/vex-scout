import { db, type SyncFields } from './db';
import { useSettings } from '@/features/settings/store';
import { newId } from '@/lib/id';
import type { Table } from 'dexie';

/**
 * Helpers that keep every write sync-friendly: new id, fresh updatedAt, current deviceId,
 * and soft deletes. Feature repos (notes, favorites, …) build on these.
 */

export function stamp<T extends object>(record: T & Partial<SyncFields>): T & SyncFields {
  return {
    ...record,
    id: record.id ?? newId(),
    updatedAt: Date.now(),
    deleted: record.deleted ?? false,
    deviceId: useSettings.getState().deviceId,
  };
}

export async function softDelete<T extends SyncFields>(table: Table<T, string>, id: string): Promise<void> {
  const existing = await table.get(id);
  if (!existing) return;
  await table.put({ ...existing, deleted: true, updatedAt: Date.now(), deviceId: useSettings.getState().deviceId });
}

export const live = <T extends SyncFields>(rows: T[]): T[] => rows.filter((r) => !r.deleted);

export { db };
