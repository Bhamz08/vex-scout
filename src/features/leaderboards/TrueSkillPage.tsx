import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LastUpdated } from '@/components/LastUpdated';
import { QueryView } from '@/components/QueryView';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/Fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/States';
import { useActiveSeason, useRatingMatches } from '@/data/queries';
import type { Match } from '@/data/types';
import { SeasonPicker } from '@/features/settings/SeasonPicker';
import { formatNumber } from '@/lib/format';
import { computeTrueSkill } from '@/lib/stats/trueskill';

export function TrueSkillPage() {
  const { seasonId } = useActiveSeason();
  const matchesQ = useRatingMatches(seasonId);

  return (
    <>
      <PageHeader
        title="TrueSkill leaderboard"
        actions={<LastUpdated result={matchesQ.data} onRefresh={() => void matchesQ.refetch()} isFetching={matchesQ.isFetching} />}
      />
      <Card className="mb-4 space-y-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="warn">Approximation</Badge>
          <span className="font-semibold">Computed in this app from match history</span>
        </div>
        <p className="text-muted">
          No public TrueSkill source was available, so ratings are computed here with the two-team TrueSkill update (each alliance’s skill is the sum of its
          teams’), processing matches once in time order. Teams are ranked by μ − 3σ, a conservative estimate that rewards both strength and consistency.
        </p>
        <p className="text-muted">
          The API has no “all matches this season” call, so ratings use the match lists cached on this device (events and teams you have opened).
        </p>
      </Card>
      <div className="mb-4 max-w-sm">
        <SeasonPicker />
      </div>
      <QueryView query={matchesQ} loadingLabel="Crunching ratings…">
        {(matches) => <Leaderboard matches={matches} />}
      </QueryView>
    </>
  );
}

function Leaderboard({ matches }: { matches: Match[] }) {
  const rows = useMemo(() => computeTrueSkill(matches), [matches]);
  const [q, setQ] = useState('');
  const needle = q.trim().toUpperCase();
  if (!rows.length) return <EmptyState title="No scored matches available yet" />;
  const events = new Set(matches.map((m) => m.eventId)).size;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {matches.filter((m) => m.scored).length} matches from {events} event{events === 1 ? '' : 's'}.
      </p>
      <TextField label="Find team" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">TrueSkill ratings</caption>
          <thead className="text-muted">
            <tr>
              <th scope="col" className="py-2 pr-3 font-medium">Rank</th>
              <th scope="col" className="py-2 pr-3 font-medium">Team</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium" title="Conservative skill estimate">μ − 3σ</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium" title="Mean skill">μ</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium" title="Uncertainty">σ</th>
              <th scope="col" className="py-2 text-right font-medium">Matches</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) =>
              needle && !r.team.number.toUpperCase().includes(needle) ? null : (
                <tr key={r.team.id} className="border-t border-line">
                  <td className="tabular py-2 pr-3">{i + 1}</td>
                  <td className="py-2 pr-3">
                    <Link to={`/teams/${encodeURIComponent(r.team.number)}`} className="font-semibold hover:underline">
                      {r.team.number}
                    </Link>
                  </td>
                  <td className="tabular py-2 pr-3 text-right font-semibold">{formatNumber(r.conservative, 2)}</td>
                  <td className="tabular py-2 pr-3 text-right">{formatNumber(r.rating.mu, 2)}</td>
                  <td className="tabular py-2 pr-3 text-right">{formatNumber(r.rating.sigma, 2)}</td>
                  <td className="tabular py-2 text-right">{r.matches}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
