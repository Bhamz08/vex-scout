import { beforeEach, describe, expect, it } from 'vitest';
import { db, type NoteRecord, type ScoutingRecord } from '@/data/db';
import type { Ranking } from '@/data/types';
import { makeMatch } from '@/test/fixtures';
import { exportBundle, importBundle, makeBundle, parseBundle, planMerge } from './bundle';
import { escapeCell, toCsv } from './csv';
import { buildScoutingSheet, scoutingSheetCsv } from './scoutingSheet';

describe('toCsv', () => {
  it('quotes commas, quotes and newlines and uses CRLF', () => {
    const csv = toCsv(
      [{ a: 'plain', b: 'has, comma' }, { a: 'say "hi"', b: 'two\nlines' }],
      [
        { header: 'A', value: (r) => r.a },
        { header: 'B', value: (r) => r.b },
      ],
    );
    expect(csv).toBe('A,B\r\nplain,"has, comma"\r\n"say ""hi""","two\nlines"\r\n');
  });

  it('neutralises formula injection in text but keeps negative numbers numeric', () => {
    expect(escapeCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(escapeCell('-cmd')).toBe("'-cmd");
    expect(escapeCell(-15.5)).toBe('-15.5');
  });

  it('writes empty cells for null, undefined and NaN', () => {
    expect([escapeCell(null), escapeCell(undefined), escapeCell(Number.NaN)]).toEqual(['', '', '']);
  });
});

const sync = { updatedAt: 1, deleted: false, deviceId: 'dev-a' };
const note = (id: string, teamNumber: string, text: string, extra: Partial<NoteRecord> = {}): NoteRecord => ({
  id, kind: 'team', eventId: 1, teamNumber, matchId: null, matchName: null, text, tags: [], createdAt: 1, ...sync, ...extra,
});
const form = (id: string, teamNumber: string, rating: 1 | 2 | 3 | 4 | 5): ScoutingRecord => ({
  id, eventId: 1, teamNumber, autonReliability: 4, scoringAbility: 3, driverSkill: 5, endgame: 'reliable', rating, notes: '', createdAt: 1, ...sync,
});

describe('buildScoutingSheet', () => {
  // Same 4-team schedule as the OPR test: team 3 (3A) has OPR 20.8, team 1 (1A) 10.8.
  const matches = [makeMatch(1, [1, 2], [3, 4], [10, 20]), makeMatch(2, [1, 3], [2, 4], [30, 0]), makeMatch(3, [1, 4], [2, 3], [15, 25])];
  const rankings: Ranking[] = [3, 1, 2, 4].map((id, i) => ({
    eventId: 1, divisionId: 1, rank: i + 1, team: { id, number: `${id}A` }, wins: 2 - Math.min(i, 2), losses: i, ties: 0, wp: 4, ap: 0, sp: 10, highScore: 30, averagePoints: 20, totalPoints: 60,
  }));
  const rows = buildScoutingSheet({
    divisions: [{ division: { id: 1, name: 'Science' }, matches, rankings }],
    teams: [],
    skills: [
      { eventId: 1, team: { id: 1, number: '1A' }, type: 'driver', score: 40, attempts: 1, rank: 1 },
      { eventId: 1, team: { id: 1, number: '1A' }, type: 'programming', score: 25, attempts: 1, rank: 1 },
    ],
    scouting: [form('s1', '1A', 4), form('s2', '1A', 2)],
    notes: [note('n1', '1A', 'Fast auton', { tags: ['fast-auton'] }), note('n2', '1A', 'Tipped', { kind: 'match', matchName: 'Q3' })],
  });

  it('has one row per team, ordered by rank, with computed stats', () => {
    expect(rows.map((r) => r.team)).toEqual(['3A', '1A', '2A', '4A']);
    expect(rows[0]?.opr).toBe(20.8);
    expect(rows[1]).toMatchObject({ opr: 10.8, dpr: 5.8, ccwm: 5, skillsCombined: 65 });
  });

  it('averages scouting forms and joins notes and tags', () => {
    expect(rows[1]).toMatchObject({ scoutRating: 3, scoutCount: 2, scoutEndgame: 'Parks reliably', tags: 'fast-auton', notes: 'Fast auton | [Q3] Tipped' });
  });

  it('serialises to CSV with a header row', () => {
    const csv = scoutingSheetCsv(rows);
    const lines = csv.trimEnd().split('\r\n');
    expect(lines).toHaveLength(5);
    expect(lines[0]?.startsWith('Division,Rank,Team,Name')).toBe(true);
    expect(lines[2]).toContain('1A');
    expect(lines[2]).toContain('Fast auton | [Q3] Tipped');
  });
});

describe('notes bundle', () => {
  beforeEach(async () => {
    await db.notes.clear();
    await db.scouting.clear();
  });

  it('merges last-write-wins by id', () => {
    const local = new Map([
      ['a', note('a', '1A', 'old', { updatedAt: 5 })],
      ['b', note('b', '1A', 'mine is newer', { updatedAt: 9 })],
    ]);
    const plan = planMerge(local, [note('a', '1A', 'new', { updatedAt: 7 }), note('b', '1A', 'stale', { updatedAt: 3 }), note('c', '2A', 'fresh')]);
    expect(plan).toMatchObject({ added: 1, updated: 1, unchanged: 1 });
    expect(plan.put.map((n) => n.text)).toEqual(['new', 'fresh']);
  });

  it('round-trips through JSON and IndexedDB, and re-importing is a no-op', async () => {
    const bundle = makeBundle('dev-a', [note('n1', '1A', 'hello')], [form('s1', '1A', 5)]);
    const parsed = parseBundle(JSON.stringify(bundle));
    expect(await importBundle(parsed)).toEqual({ added: 2, updated: 0, unchanged: 0 });
    expect(await importBundle(parsed)).toEqual({ added: 0, updated: 0, unchanged: 2 });
    const exported = await exportBundle('dev-a');
    expect(exported.notes[0]?.text).toBe('hello');
    expect(exported.scouting[0]?.rating).toBe(5);
  });

  it('rejects files that are not exports', () => {
    expect(() => parseBundle('not json')).toThrow(/valid JSON/);
    expect(() => parseBundle(JSON.stringify({ format: 'other' }))).toThrow(/notes export/);
  });
});
