import { describe, expect, it } from 'vitest';
import { toAward, toEvent, toMatch, toRanking, toSkills, toTeam } from './mappers';
import { AwardSchema, EventSchema, MatchSchema, pageSchema, RankingSchema, SkillsSchema, TeamSchema } from './schemas';

/** Payloads shaped exactly like the OpenAPI spec's examples (swagger v1.0.21), values made up. */
const idInfo = (id: number, name: string, code: string | null = null) => ({ id, name, code });

describe('live API schemas + mappers', () => {
  it('parses a paginated team list and maps a team', () => {
    const page = pageSchema(TeamSchema).parse({
      meta: { current_page: 1, last_page: 1, per_page: 250, total: 1, from: 1, to: 1, path: 'x', first_page_url: 'x', last_page_url: 'x', next_page_url: null, prev_page_url: null },
      data: [
        {
          id: 7,
          number: '1234A',
          team_name: 'Example',
          robot_name: 'Bot',
          organization: 'Example High',
          location: { city: 'Austin', region: 'Texas', country: 'United States', postcode: '78701', coordinates: { lat: 1, lon: 2 } },
          registered: true,
          program: idInfo(1, 'VEX V5 Robotics Competition', 'V5RC'),
          grade: 'High School',
        },
      ],
    });
    expect(toTeam(page.data[0]!)).toMatchObject({ number: '1234A', program: 'V5RC', grade: 'High School', location: { city: 'Austin' } });
  });

  it('maps an event, including newer levels like Spotlight', () => {
    const e = EventSchema.parse({
      id: 1,
      sku: 'RE-V5RC-26-0001',
      name: 'Event',
      start: '2026-10-17T00:00:00-05:00',
      end: '2026-10-18T00:00:00-05:00',
      season: idInfo(197, 'V5RC 2026-2027: Override'),
      program: idInfo(4, 'VEX U Robotics Competition', 'VURC'),
      location: { venue: 'Hall', city: 'X', region: 'Y', country: 'Z' },
      divisions: [
        { id: 2, name: 'B', order: 2 },
        { id: 1, name: 'A', order: 1 },
      ],
      level: 'Spotlight',
      ongoing: false,
      awards_finalized: true,
      event_type: 'tournament',
    });
    expect(toEvent(e)).toMatchObject({ program: 'VURC', level: 'Spotlight', seasonId: 197, divisions: [{ name: 'A' }, { name: 'B' }] });
  });

  it('treats unscored matches (score 0, scored false) as unplayed', () => {
    const raw = (scored: boolean, red: number, blue: number) =>
      MatchSchema.parse({
        id: 5,
        event: idInfo(1, 'Event'),
        division: idInfo(1, 'Div'),
        round: 2,
        instance: 1,
        matchnum: 12,
        scheduled: '2026-10-17T10:00:00-05:00',
        started: null,
        field: 'Field 1',
        scored,
        name: 'Qualifier #12',
        alliances: [
          { color: 'red', score: red, teams: [{ team: idInfo(7, '1234A'), sitting: false }] },
          { color: 'blue', score: blue, teams: [{ team: idInfo(8, '5678B'), sitting: false }] },
        ],
      });
    expect(toMatch(raw(false, 0, 0))).toMatchObject({ scored: false, round: 'qualification', red: { score: null }, field: 'Field 1' });
    expect(toMatch(raw(true, 40, 31))).toMatchObject({ scored: true, red: { score: 40, teams: [{ number: '1234A' }] }, blue: { score: 31 } });
    // Seen in real data: scored=false but one side has points. Treat the whole match as played.
    expect(toMatch(raw(false, 0, 68))).toMatchObject({ scored: true, red: { score: 0 }, blue: { score: 68 } });
  });

  it('maps rankings, skills and awards; drops skills types we do not model', () => {
    const r = toRanking(
      RankingSchema.parse({ id: 1, event: idInfo(1, 'E'), division: idInfo(1, 'D'), rank: 3, team: idInfo(7, '1234A'), wins: 4, losses: 1, ties: 0, wp: 9, ap: 20, sp: 300, high_score: 80, average_points: 61.5, total_points: 307 }),
    );
    expect(r).toMatchObject({ rank: 3, team: { number: '1234A' }, highScore: 80 });
    expect(toSkills(SkillsSchema.parse({ id: 1, event: idInfo(1, 'E'), team: idInfo(7, '1234A'), type: 'package_delivery_time', score: 9, attempts: 1, rank: 1 }))).toBeNull();
    const a = toAward(
      AwardSchema.parse({
        id: 9,
        event: idInfo(1, 'E'),
        order: 1,
        title: 'Excellence Award (VRC/VEXU/VAIRC)',
        qualifications: ['World Championship'],
        designation: 'tournament',
        classification: null,
        teamWinners: [{ division: idInfo(1, 'D'), team: idInfo(7, '1234A') }],
        individualWinners: [],
      }),
    );
    expect(a).toMatchObject({ title: 'Excellence Award', teams: [{ number: '1234A', divisionId: 1 }] });
  });
});
