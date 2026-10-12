import { z } from 'zod';
import type { NoteRecord, ScoutingRecord, SyncFields } from '@/data/db';
import { db } from '@/data/db';

/**
 * JSON file format for sharing notes between teammates. Records keep their sync fields, so importing
 * the same file twice is harmless and newer edits win (last-write-wins on updatedAt, per record id).
 */
export const BUNDLE_FORMAT = 'vex-scout-notes';
export const BUNDLE_VERSION = 1;

const syncFields = {
  id: z.string().min(1),
  updatedAt: z.number(),
  deleted: z.boolean(),
  deviceId: z.string(),
};
const rating = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

const NoteSchema = z.object({
  ...syncFields,
  kind: z.enum(['team', 'match']),
  eventId: z.number().nullable(),
  teamNumber: z.string().nullable(),
  matchId: z.number().nullable(),
  matchName: z.string().nullable(),
  text: z.string().max(20_000),
  tags: z.array(z.string().max(60)).max(50),
  createdAt: z.number(),
});

const ScoutingSchema = z.object({
  ...syncFields,
  eventId: z.number(),
  teamNumber: z.string(),
  autonReliability: rating,
  scoringAbility: rating,
  driverSkill: rating,
  endgame: z.enum(['none', 'sometimes', 'reliable']),
  rating,
  notes: z.string().max(20_000),
  createdAt: z.number(),
});

export const BundleSchema = z.object({
  format: z.literal(BUNDLE_FORMAT),
  version: z.literal(BUNDLE_VERSION),
  exportedAt: z.number(),
  deviceId: z.string(),
  notes: z.array(NoteSchema),
  scouting: z.array(ScoutingSchema),
});
export type Bundle = z.infer<typeof BundleSchema>;

export function makeBundle(deviceId: string, notes: NoteRecord[], scouting: ScoutingRecord[], now = Date.now()): Bundle {
  // Tombstones are included so a deletion propagates to teammates who already have the note.
  return { format: BUNDLE_FORMAT, version: BUNDLE_VERSION, exportedAt: now, deviceId, notes, scouting };
}

export function parseBundle(text: string): Bundle {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('That file isn’t valid JSON.');
  }
  const result = BundleSchema.safeParse(json);
  if (!result.success) throw new Error('That file isn’t a VEX Scout notes export (or it’s from a newer version).');
  return result.data;
}

export interface MergePlan<T> {
  put: T[];
  added: number;
  updated: number;
  unchanged: number;
}

/** Last-write-wins merge of incoming records into local ones, keyed by id. Pure. */
export function planMerge<T extends SyncFields>(local: Map<string, T>, incoming: T[]): MergePlan<T> {
  const plan: MergePlan<T> = { put: [], added: 0, updated: 0, unchanged: 0 };
  for (const rec of incoming) {
    const existing = local.get(rec.id);
    if (!existing) {
      plan.put.push(rec);
      plan.added++;
    } else if (rec.updatedAt > existing.updatedAt) {
      plan.put.push(rec);
      plan.updated++;
    } else {
      plan.unchanged++;
    }
  }
  return plan;
}

export async function exportBundle(deviceId: string): Promise<Bundle> {
  return makeBundle(deviceId, await db.notes.toArray(), await db.scouting.toArray());
}

export async function importBundle(bundle: Bundle): Promise<{ added: number; updated: number; unchanged: number }> {
  return db.transaction('rw', db.notes, db.scouting, async () => {
    const notes = planMerge(new Map((await db.notes.toArray()).map((n) => [n.id, n])), bundle.notes);
    const scouting = planMerge(new Map((await db.scouting.toArray()).map((s) => [s.id, s])), bundle.scouting);
    await db.notes.bulkPut(notes.put);
    await db.scouting.bulkPut(scouting.put);
    return {
      added: notes.added + scouting.added,
      updated: notes.updated + scouting.updated,
      unchanged: notes.unchanged + scouting.unchanged,
    };
  });
}
