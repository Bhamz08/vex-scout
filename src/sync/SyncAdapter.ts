/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SYNC STUB — NOT IMPLEMENTED IN v1
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Teammates currently share notes by exporting/importing JSON files (features/export/bundle.ts).
 * Local data is already shaped for real sync:
 *   - every record has a stable `id` (UUID), `updatedAt`, a `deleted` tombstone and `deviceId`
 *   - merges are last-write-wins per record (see planMerge in bundle.ts)
 *
 * A future backend (e.g. a small API with a team-code, Supabase, or Firebase) would implement this
 * interface: push local changes since the last sync, pull remote changes, then apply them with planMerge.
 */
import type { NoteRecord, ScoutingRecord } from '@/data/db';

export interface ChangeSet {
  notes: NoteRecord[];
  scouting: ScoutingRecord[];
}

export interface SyncAdapter {
  /** Upload records changed locally after `since` (epoch ms). */
  push(changes: ChangeSet): Promise<void>;
  /** Download records changed remotely after `since`. */
  pull(since: number): Promise<ChangeSet>;
}

/** Placeholder used until a backend exists. */
export class NotImplementedSync implements SyncAdapter {
  async push(): Promise<void> {
    throw new Error('Cloud sync is not available yet. Use Notes → Export / Import to share with teammates.');
  }

  async pull(): Promise<ChangeSet> {
    throw new Error('Cloud sync is not available yet. Use Notes → Export / Import to share with teammates.');
  }
}
