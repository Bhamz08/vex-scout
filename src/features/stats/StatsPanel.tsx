import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loading, EmptyState, ErrorState } from '@/components/ui/States';
import type { Division, VexEvent } from '@/data/types';
import { formatNumber } from '@/lib/format';
import type { TeamStats } from '@/lib/stats/opr';
import { useDivisionModel } from './useDivisionModel';

type SortKey = 'opr' | 'dpr' | 'ccwm' | 'played';

const COLUMNS: { key: SortKey; label: string; title: string }[] = [
  { key: 'opr', label: 'OPR', title: 'Offensive Power Rating: points a team adds to its alliance' },
  { key: 'dpr', label: 'DPR', title: 'Defensive Power Rating: points the opposing alliance scores against it (lower is better)' },
  { key: 'ccwm', label: 'CCWM', title: 'Calculated Contribution to Winning Margin (OPR − DPR)' },
  { key: 'played', label: 'Played', title: 'Scored matches used' },
];

export function StatsPanel({ event, division }: { event: VexEvent; division: Division }) {
  const { model, query } = useDivisionModel(event, division);
  const [sort, setSort] = useState<SortKey>('opr');

  const rows = useMemo(() => {
    const list = [...(model?.stats.values() ?? [])];
    // DPR: lower is better, so sort ascending.
    return list.sort((a, b) => (sort === 'dpr' ? a.dpr - b.dpr : (b[sort] as number) - (a[sort] as number)));
  }, [model, sort]);

  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!model) return <Loading />;
  if (!rows.length) return <EmptyState title="No scored matches yet">Stats appear once matches have scores.</EmptyState>;

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">
        Least-squares ratings from {model.matches.filter((m) => m.scored).length} scored matches. Early in an event, ratings are noisy.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Team statistics, sorted by {sort.toUpperCase()}</caption>
          <thead className="text-muted">
            <tr>
              <th scope="col" className="py-2 pr-3 font-medium">#</th>
              <th scope="col" className="py-2 pr-3 font-medium">Team</th>
              {COLUMNS.map((c) => (
                <th key={c.key} scope="col" className="py-2 pr-3 text-right font-medium" aria-sort={sort === c.key ? (c.key === 'dpr' ? 'ascending' : 'descending') : 'none'}>
                  <button type="button" title={c.title} onClick={() => setSort(c.key)} className={sort === c.key ? 'font-bold text-fg underline' : 'hover:underline'}>
                    {c.label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s: TeamStats, i) => (
              <tr key={s.team.id} className="border-t border-line">
                <td className="tabular py-2 pr-3">{i + 1}</td>
                <td className="py-2 pr-3">
                  <Link to={`/teams/${encodeURIComponent(s.team.number)}`} className="font-semibold hover:underline">
                    {s.team.number}
                  </Link>
                </td>
                <td className="tabular py-2 pr-3 text-right">{formatNumber(s.opr)}</td>
                <td className="tabular py-2 pr-3 text-right">{formatNumber(s.dpr)}</td>
                <td className="tabular py-2 pr-3 text-right">{formatNumber(s.ccwm)}</td>
                <td className="tabular py-2 pr-3 text-right">{s.played}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
