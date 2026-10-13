import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LastUpdated } from '@/components/LastUpdated';
import { QueryView } from '@/components/QueryView';
import { SelectField, TextField } from '@/components/ui/Fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/States';
import { useActiveSeason, useWorldSkills } from '@/data/queries';
import type { Grade, WorldSkillsEntry } from '@/data/types';
import { SeasonPicker } from '@/features/settings/SeasonPicker';
import { placeLine } from '@/lib/format';

const PAGE = 100;

export function WorldSkillsPage() {
  const active = useActiveSeason();
  const [grade, setGrade] = useState<Grade>(active.grade);
  const effectiveGrade = active.program === 'VURC' ? 'College' : grade === 'College' ? 'High School' : grade;
  const skillsQ = useWorldSkills(active.seasonId, effectiveGrade);

  return (
    <>
      <PageHeader
        title="World Skills leaderboard"
        subtitle="Best combined score from a single event, per the global ranking rule."
        actions={<LastUpdated result={skillsQ.data} onRefresh={() => void skillsQ.refetch()} isFetching={skillsQ.isFetching} />}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <SeasonPicker />
        {active.program === 'V5RC' && (
          <SelectField label="Grade" value={effectiveGrade} onChange={(e) => setGrade(e.target.value as Grade)}>
            <option>High School</option>
            <option>Middle School</option>
          </SelectField>
        )}
      </div>
      <QueryView query={skillsQ} loadingLabel="Loading standings…">
        {(entries) => <SkillsTable entries={entries} />}
      </QueryView>
    </>
  );
}

function SkillsTable({ entries }: { entries: WorldSkillsEntry[] }) {
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const countries = useMemo(() => [...new Set(entries.map((e) => e.location.country).filter(Boolean))].sort(), [entries]);
  const needle = q.trim().toLowerCase();
  const filtered = entries
    .filter((e) => !country || e.location.country === country)
    .filter((e) => !needle || e.team.number.toLowerCase().includes(needle) || e.team.name.toLowerCase().includes(needle));

  if (!entries.length) return <EmptyState title="No skills scores yet this season" />;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Find team" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Number or name" />
        <SelectField label="Country" value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </SelectField>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">World skills standings</caption>
          <thead className="text-muted">
            <tr>
              <th scope="col" className="py-2 pr-3 font-medium">Rank</th>
              <th scope="col" className="py-2 pr-3 font-medium">Team</th>
              <th scope="col" className="detail py-2 pr-3 font-medium">Location</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Score</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Prog</th>
              <th scope="col" className="py-2 text-right font-medium">Driver</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, limit).map((e) => (
              <tr key={e.team.id} className="border-t border-line">
                <td className="tabular py-2 pr-3">{e.rank}</td>
                <td className="py-2 pr-3">
                  <Link to={`/teams/${encodeURIComponent(e.team.number)}`} className="font-semibold hover:underline">
                    {e.team.number}
                  </Link>{' '}
                  <span className="detail text-muted">{e.team.name}</span>
                </td>
                <td className="detail py-2 pr-3 text-muted">{placeLine(e.location)}</td>
                <td className="tabular py-2 pr-3 text-right font-semibold">{e.combined}</td>
                <td className="tabular py-2 pr-3 text-right">{e.programming}</td>
                <td className="tabular py-2 text-right">{e.driver}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > limit && (
        <button type="button" className="min-h-11 w-full rounded border border-line" onClick={() => setLimit((l) => l + PAGE)}>
          Show more ({filtered.length - limit} left)
        </button>
      )}
    </div>
  );
}
