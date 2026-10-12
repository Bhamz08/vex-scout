import type { NoteRecord, ScoutingRecord } from '@/data/db';
import type { Division, Match, Ranking, SkillsEntry, Team } from '@/data/types';
import { combineSkills } from '@/features/events/EventSkillsTable';
import { ENDGAME_LABELS, summarizeScouting } from '@/features/notes/repo';
import { computeTeamStats } from '@/lib/stats/opr';
import { toCsv, type CsvColumn } from './csv';

export interface DivisionData {
  division: Division;
  matches: Match[];
  rankings: Ranking[];
}

export interface SheetRow {
  division: string;
  rank: number | null;
  team: string;
  name: string;
  organization: string;
  wins: number | null;
  losses: number | null;
  ties: number | null;
  wp: number | null;
  ap: number | null;
  sp: number | null;
  opr: number | null;
  dpr: number | null;
  ccwm: number | null;
  skillsCombined: number | null;
  skillsDriver: number | null;
  skillsProgramming: number | null;
  scoutAuton: number | null;
  scoutScoring: number | null;
  scoutDriver: number | null;
  scoutEndgame: string;
  scoutRating: number | null;
  scoutCount: number;
  tags: string;
  notes: string;
}

const round1 = (n: number | undefined | null) => (n === undefined || n === null ? null : Math.round(n * 10) / 10);

/**
 * Builds the scouting spreadsheet: one row per team with official rankings, computed stats,
 * skills, averaged scouting ratings and all notes. Pure, so it's unit-tested without a browser.
 */
export function buildScoutingSheet(input: {
  divisions: DivisionData[];
  teams: Team[];
  skills: SkillsEntry[];
  scouting: ScoutingRecord[];
  notes: NoteRecord[];
}): SheetRow[] {
  const skills = combineSkills(input.skills);
  const rows: SheetRow[] = [];

  for (const { division, matches, rankings } of input.divisions) {
    const stats = computeTeamStats(matches);
    const teamIds = new Set<number>([...rankings.map((r) => r.team.id), ...matches.flatMap((m) => [...m.red.teams, ...m.blue.teams].map((t) => t.id))]);

    for (const id of teamIds) {
      const team = input.teams.find((t) => t.id === id);
      const number = team?.number ?? rankings.find((r) => r.team.id === id)?.team.number ?? String(id);
      const r = rankings.find((x) => x.team.id === id);
      const s = stats.get(id);
      const sk = skills.find((x) => x.teamId === id);
      const summary = summarizeScouting(input.scouting.filter((x) => x.teamNumber === number));
      const notes = input.notes.filter((n) => n.teamNumber === number);
      const scoutingNotes = input.scouting.filter((x) => x.teamNumber === number && x.notes).map((x) => x.notes);

      rows.push({
        division: division.name,
        rank: r?.rank ?? null,
        team: number,
        name: team?.name ?? '',
        organization: team?.organization ?? '',
        wins: r?.wins ?? null,
        losses: r?.losses ?? null,
        ties: r?.ties ?? null,
        wp: r?.wp ?? null,
        ap: r?.ap ?? null,
        sp: r?.sp ?? null,
        opr: round1(s?.opr),
        dpr: round1(s?.dpr),
        ccwm: round1(s?.ccwm),
        skillsCombined: sk?.combined ?? null,
        skillsDriver: sk?.driver ?? null,
        skillsProgramming: sk?.programming ?? null,
        scoutAuton: round1(summary?.autonReliability),
        scoutScoring: round1(summary?.scoringAbility),
        scoutDriver: round1(summary?.driverSkill),
        scoutEndgame: summary?.endgame ? ENDGAME_LABELS[summary.endgame] : '',
        scoutRating: round1(summary?.rating),
        scoutCount: summary?.count ?? 0,
        tags: [...new Set(notes.flatMap((n) => n.tags))].join(' '),
        notes: [...scoutingNotes, ...notes.map((n) => (n.matchName ? `[${n.matchName}] ${n.text}` : n.text))].filter(Boolean).join(' | '),
      });
    }
  }

  return rows.sort((a, b) => a.division.localeCompare(b.division) || (a.rank ?? 9999) - (b.rank ?? 9999) || a.team.localeCompare(b.team, undefined, { numeric: true }));
}

export const SHEET_COLUMNS: CsvColumn<SheetRow>[] = [
  { header: 'Division', value: (r) => r.division },
  { header: 'Rank', value: (r) => r.rank },
  { header: 'Team', value: (r) => r.team },
  { header: 'Name', value: (r) => r.name },
  { header: 'Organization', value: (r) => r.organization },
  { header: 'Wins', value: (r) => r.wins },
  { header: 'Losses', value: (r) => r.losses },
  { header: 'Ties', value: (r) => r.ties },
  { header: 'WP', value: (r) => r.wp },
  { header: 'AP', value: (r) => r.ap },
  { header: 'SP', value: (r) => r.sp },
  { header: 'OPR', value: (r) => r.opr },
  { header: 'DPR', value: (r) => r.dpr },
  { header: 'CCWM', value: (r) => r.ccwm },
  { header: 'Skills combined', value: (r) => r.skillsCombined },
  { header: 'Skills driver', value: (r) => r.skillsDriver },
  { header: 'Skills programming', value: (r) => r.skillsProgramming },
  { header: 'Scout: auton reliability', value: (r) => r.scoutAuton },
  { header: 'Scout: scoring', value: (r) => r.scoutScoring },
  { header: 'Scout: driver', value: (r) => r.scoutDriver },
  { header: 'Scout: endgame', value: (r) => r.scoutEndgame },
  { header: 'Scout: rating', value: (r) => r.scoutRating },
  { header: 'Scout forms', value: (r) => r.scoutCount },
  { header: 'Tags', value: (r) => r.tags },
  { header: 'Notes', value: (r) => r.notes },
];

export function scoutingSheetCsv(rows: SheetRow[]): string {
  return toCsv(rows, SHEET_COLUMNS);
}
