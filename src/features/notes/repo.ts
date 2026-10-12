import { useLiveQuery } from 'dexie-react-hooks';
import type { EndgameAbility, NoteRecord, Rating, ScoutingRecord } from '@/data/db';
import { db, live, softDelete, stamp } from '@/data/records';

/** Data access for notes and scouting forms. All reads hide soft-deleted rows. */

export type NoteDraft = Pick<NoteRecord, 'kind' | 'eventId' | 'teamNumber' | 'matchId' | 'matchName' | 'text' | 'tags'>;

export async function saveNote(draft: NoteDraft & { id?: string; createdAt?: number }): Promise<void> {
  await db.notes.put(stamp({ ...draft, createdAt: draft.createdAt ?? Date.now(), tags: normalizeTags(draft.tags) }));
}

export async function deleteNote(id: string): Promise<void> {
  await softDelete(db.notes, id);
}

export function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((t) => t.trim().toLowerCase().replace(/\s+/g, '-')).filter(Boolean))];
}

const newestFirst = (a: NoteRecord, b: NoteRecord) => b.createdAt - a.createdAt;

export function useTeamNotes(teamNumber: string | undefined): NoteRecord[] | undefined {
  return useLiveQuery(async () => {
    if (!teamNumber) return [];
    return live(await db.notes.where('teamNumber').equals(teamNumber).toArray()).sort(newestFirst);
  }, [teamNumber]);
}

export function useMatchNotes(matchId: number): NoteRecord[] | undefined {
  return useLiveQuery(async () => live(await db.notes.where('matchId').equals(matchId).toArray()).sort(newestFirst), [matchId]);
}

export function useEventNotes(eventId: number): NoteRecord[] | undefined {
  return useLiveQuery(async () => live(await db.notes.where('eventId').equals(eventId).toArray()).sort(newestFirst), [eventId]);
}

export function useAllNotes(): NoteRecord[] | undefined {
  return useLiveQuery(async () => live(await db.notes.toArray()).sort(newestFirst), []);
}

export interface ScoutingDraft {
  eventId: number;
  teamNumber: string;
  autonReliability: Rating;
  scoringAbility: Rating;
  driverSkill: Rating;
  endgame: EndgameAbility;
  rating: Rating;
  notes: string;
}

/** One scouting form per (event, team) per device; teammates' imported forms sit alongside. */
export async function saveScouting(draft: ScoutingDraft, existing?: ScoutingRecord): Promise<void> {
  await db.scouting.put(stamp({ ...draft, id: existing?.id, createdAt: existing?.createdAt ?? Date.now() }));
}

export function useEventScouting(eventId: number): ScoutingRecord[] | undefined {
  return useLiveQuery(async () => live(await db.scouting.filter((s) => s.eventId === eventId).toArray()), [eventId]);
}

export function useTeamScouting(eventId: number, teamNumber: string): ScoutingRecord[] | undefined {
  return useLiveQuery(async () => live(await db.scouting.where({ eventId, teamNumber }).toArray()), [eventId, teamNumber]);
}

export interface ScoutingSummary {
  count: number;
  autonReliability: number;
  scoringAbility: number;
  driverSkill: number;
  rating: number;
  /** most common endgame answer */
  endgame: EndgameAbility | null;
}

/** Averages several scouts' forms for one team. */
export function summarizeScouting(records: ScoutingRecord[]): ScoutingSummary | null {
  if (!records.length) return null;
  const avg = (k: 'autonReliability' | 'scoringAbility' | 'driverSkill' | 'rating') => records.reduce((s, r) => s + r[k], 0) / records.length;
  const counts = new Map<EndgameAbility, number>();
  for (const r of records) counts.set(r.endgame, (counts.get(r.endgame) ?? 0) + 1);
  const endgame = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return {
    count: records.length,
    autonReliability: avg('autonReliability'),
    scoringAbility: avg('scoringAbility'),
    driverSkill: avg('driverSkill'),
    rating: avg('rating'),
    endgame,
  };
}

export const ENDGAME_LABELS: Record<EndgameAbility, string> = {
  none: 'Doesn’t park',
  sometimes: 'Parks sometimes',
  reliable: 'Parks reliably',
};
