import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/ui/States';
import type { SkillsEntry } from '@/data/types';

export interface SkillsRow {
  teamId: number;
  number: string;
  driver: number;
  programming: number;
  combined: number;
}

/** Combines per-type skills entries into one row per team, ranked like the manual's event skills rankings (T22 points 1–2). */
export function combineSkills(skills: SkillsEntry[]): SkillsRow[] {
  const rows = new Map<number, SkillsRow>();
  for (const s of skills) {
    const row = rows.get(s.team.id) ?? { teamId: s.team.id, number: s.team.number, driver: 0, programming: 0, combined: 0 };
    row[s.type] = Math.max(row[s.type], s.score);
    row.combined = row.driver + row.programming;
    rows.set(s.team.id, row);
  }
  return [...rows.values()].sort((a, b) => b.combined - a.combined || b.programming - a.programming);
}

export function EventSkillsTable({ skills }: { skills: SkillsEntry[] }) {
  const rows = combineSkills(skills);
  if (!rows.length) return <EmptyState title="No skills runs yet" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Robot skills standings</caption>
        <thead className="text-muted">
          <tr>
            <th scope="col" className="py-2 pr-3 font-medium">#</th>
            <th scope="col" className="py-2 pr-3 font-medium">Team</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">Combined</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">Programming</th>
            <th scope="col" className="py-2 text-right font-medium">Driver</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.teamId} className="border-t border-line">
              <td className="tabular py-2 pr-3">{i + 1}</td>
              <td className="py-2 pr-3">
                <Link to={`/teams/${encodeURIComponent(r.number)}`} className="font-semibold hover:underline">
                  {r.number}
                </Link>
              </td>
              <td className="tabular py-2 pr-3 text-right font-semibold">{r.combined}</td>
              <td className="tabular py-2 pr-3 text-right">{r.programming}</td>
              <td className="tabular py-2 text-right">{r.driver}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
