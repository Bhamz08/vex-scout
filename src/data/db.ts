import Dexie, { type Table } from 'dexie';

/**
 * Every user-created record carries these fields so a future sync backend can merge
 * changes from several devices (last-write-wins on updatedAt, tombstones via `deleted`).
 * See src/sync/SyncAdapter.ts.
 */
export interface SyncFields {
  id: string;
  /** epoch ms of the last local change */
  updatedAt: number;
  /** soft-delete tombstone; never hard-delete synced records */
  deleted: boolean;
  /** device that made the last change (settings.deviceId) */
  deviceId: string;
}

export interface NoteRecord extends SyncFields {
  kind: 'team' | 'match';
  eventId: number | null;
  teamNumber: string | null;
  matchId: number | null;
  /** Human label for match notes, e.g. "Q12", kept so exports read well offline */
  matchName: string | null;
  text: string;
  tags: string[];
  createdAt: number;
}

export type Rating = 1 | 2 | 3 | 4 | 5;
export type EndgameAbility = 'none' | 'sometimes' | 'reliable';

export interface ScoutingRecord extends SyncFields {
  eventId: number;
  teamNumber: string;
  autonReliability: Rating;
  scoringAbility: Rating;
  driverSkill: Rating;
  endgame: EndgameAbility;
  rating: Rating;
  notes: string;
  createdAt: number;
}

export interface FavoriteRecord extends SyncFields {
  kind: 'team' | 'event';
  /** team number or event id (as string) */
  refId: string;
  label: string;
  subtitle: string;
  createdAt: number;
}

export interface SkillsRunRecord extends SyncFields {
  /** which rules config produced the score */
  rulesId: 'skills-v5rc' | 'skills-vexu';
  type: 'driver' | 'programming';
  score: number;
  note: string;
  createdAt: number;
}

/** Last successful API response per request key, for offline reads. Not synced. */
export interface CacheRecord {
  key: string;
  data: unknown;
  fetchedAt: number;
}

export class VexScoutDB extends Dexie {
  notes!: Table<NoteRecord, string>;
  scouting!: Table<ScoutingRecord, string>;
  favorites!: Table<FavoriteRecord, string>;
  skillsRuns!: Table<SkillsRunRecord, string>;
  cache!: Table<CacheRecord, string>;

  constructor(name = 'vex-scout') {
    super(name);
    this.version(1).stores({
      notes: 'id, updatedAt, kind, eventId, teamNumber, matchId, *tags',
      scouting: 'id, updatedAt, [eventId+teamNumber], teamNumber',
      favorites: 'id, updatedAt, [kind+refId]',
      skillsRuns: 'id, updatedAt, rulesId, createdAt',
      cache: 'key, fetchedAt',
    });
  }
}

export const db = new VexScoutDB();
