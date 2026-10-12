import { describe, expect, it } from 'vitest';
import { DemoDataSource } from './DemoDataSource';
import { DEMO_EVENT_ID, DEMO_SEASONS, DEMO_VEXU_EVENT_ID, generateDemoWorld } from './generator';

describe('generateDemoWorld', () => {
  it('is deterministic for a seed', () => {
    const a = generateDemoWorld(7);
    const b = generateDemoWorld(7);
    expect(a.teams.map((t) => t.number)).toEqual(b.teams.map((t) => t.number));
    expect(a.matches.map((m) => [m.red.score, m.blue.score])).toEqual(b.matches.map((m) => [m.red.score, m.blue.score]));
  });

  it('has 40 unique V5RC team numbers', () => {
    const v5 = generateDemoWorld().teams.filter((t) => t.program === 'V5RC');
    expect(v5).toHaveLength(40);
    expect(new Set(v5.map((t) => t.number)).size).toBe(40);
  });
});

describe('DemoDataSource', () => {
  const ds = new DemoDataSource();

  it('serves the headline event with 2 divisions of 20 teams', async () => {
    const event = await ds.getEvent(DEMO_EVENT_ID);
    expect(event?.divisions).toHaveLength(2);
    expect(await ds.getEventTeams(DEMO_EVENT_ID)).toHaveLength(40);
    for (const division of event?.divisions ?? []) {
      const matches = await ds.getDivisionMatches(DEMO_EVENT_ID, division.id);
      // 20 teams × 8 matches / 4 teams per match
      expect(matches).toHaveLength(40);
      const teamIds = new Set(matches.flatMap((m) => [...m.red.teams, ...m.blue.teams].map((t) => t.id)));
      expect(teamIds.size).toBe(20);
    }
  });

  it('gives every team in a division the same number of qualification matches, with no team twice in one match', async () => {
    const event = await ds.getEvent(DEMO_EVENT_ID);
    const matches = await ds.getDivisionMatches(DEMO_EVENT_ID, event?.divisions[0]?.id ?? -1);
    const counts = new Map<number, number>();
    for (const m of matches) {
      const ids = [...m.red.teams, ...m.blue.teams].map((t) => t.id);
      expect(new Set(ids).size).toBe(4);
      for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    expect(new Set(counts.values())).toEqual(new Set([8]));
  });

  it('leaves the end of the schedule unplayed, with field names and times', async () => {
    const event = await ds.getEvent(DEMO_EVENT_ID);
    const matches = await ds.getDivisionMatches(DEMO_EVENT_ID, event?.divisions[0]?.id ?? -1);
    const unplayed = matches.filter((m) => !m.scored);
    expect(unplayed.length).toBeGreaterThan(0);
    expect(unplayed.every((m) => m.red.score === null && m.field && m.scheduled)).toBe(true);
    expect(matches.filter((m) => m.scored).every((m) => (m.red.score ?? -1) >= 0)).toBe(true);
  });

  it('ranks every team that has played, in order', async () => {
    const event = await ds.getEvent(DEMO_EVENT_ID);
    const rankings = await ds.getDivisionRankings(DEMO_EVENT_ID, event?.divisions[0]?.id ?? -1);
    expect(rankings).toHaveLength(20);
    expect(rankings.map((r) => r.rank)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    for (const r of rankings) expect(r.wp).toBeGreaterThanOrEqual(r.wins * 2 + r.ties);
  });

  it('has skills runs and awards for completed events', async () => {
    const teams = await ds.getEventTeams(50002);
    expect(teams.length).toBe(24);
    expect((await ds.getEventSkills(50002)).length).toBeGreaterThan(0);
    const awards = await ds.getEventAwards(50002);
    expect(awards.map((a) => a.title)).toContain('Excellence Award');
    expect(awards.find((a) => a.title === 'Tournament Champions')?.teams).toHaveLength(2);
  });

  it('looks up teams by number case-insensitively and returns their history', async () => {
    const [first] = await ds.getEventTeams(DEMO_EVENT_ID);
    const found = await ds.findTeam(first?.number.toLowerCase() ?? '', 'V5RC');
    expect(found?.id).toBe(first?.id);
    const events = await ds.getTeamEvents(found?.id ?? -1);
    expect(events.map((e) => e.id)).toContain(DEMO_EVENT_ID);
  });

  it('filters events by country, including non-US events', async () => {
    const nz = await ds.searchEvents({ program: 'V5RC', seasonId: DEMO_SEASONS.V5RC_CURRENT, country: 'New Zealand' });
    expect(nz.map((e) => e.location.country)).toEqual(['New Zealand']);
  });

  it('plays VEX U matches one team per alliance', async () => {
    const event = await ds.getEvent(DEMO_VEXU_EVENT_ID);
    const matches = await ds.getDivisionMatches(DEMO_VEXU_EVENT_ID, event?.divisions[0]?.id ?? -1);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((m) => m.red.teams.length === 1 && m.blue.teams.length === 1)).toBe(true);
  });

  it('builds a World Skills list per grade', async () => {
    const hs = await ds.getWorldSkills(DEMO_SEASONS.V5RC_CURRENT, 'High School');
    expect(hs.length).toBeGreaterThan(0);
    expect(hs.every((e) => e.grade === 'High School' && e.combined === e.driver + e.programming)).toBe(true);
    expect(hs[0]?.rank).toBe(1);
  });
});
