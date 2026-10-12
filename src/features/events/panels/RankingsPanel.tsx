import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LastUpdated } from '@/components/LastUpdated';
import { QueryView } from '@/components/QueryView';
import { EmptyState } from '@/components/ui/States';
import { useDivisionRankings } from '@/data/queries';
import type { Division, Ranking, VexEvent } from '@/data/types';
import { formatNumber } from '@/lib/format';
import { formatRecord } from '@/lib/matches';

export interface RankingsExtras {
  /** Extra column headers appended after the official columns (e.g. OPR) */
  headers?: string[];
  cells?: (r: Ranking) => ReactNode[];
  /** Optional full-width row under each team (e.g. scouting notes) */
  below?: (r: Ranking) => ReactNode;
}

export function RankingsPanel({ event, division, extras }: { event: VexEvent; division: Division; extras?: RankingsExtras }) {
  const rankingsQ = useDivisionRankings(event.id, division.id);
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <LastUpdated result={rankingsQ.data} onRefresh={() => void rankingsQ.refetch()} isFetching={rankingsQ.isFetching} />
      </div>
      <QueryView query={rankingsQ}>
        {(rankings) => (rankings.length ? <RankingsTable rankings={rankings} extras={extras} /> : <EmptyState title="No rankings yet">Rankings appear once qualification matches are scored.</EmptyState>)}
      </QueryView>
    </div>
  );
}

function RankingsTable({ rankings, extras }: { rankings: Ranking[]; extras?: RankingsExtras }) {
  const headers = extras?.headers ?? [];
  const colSpan = 9 + headers.length;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Qualification rankings. WP win points, AP autonomous points, SP strength of schedule points.</caption>
        <thead className="text-muted">
          <tr>
            <th scope="col" className="py-2 pr-2 font-medium">#</th>
            <th scope="col" className="py-2 pr-3 font-medium">Team</th>
            <th scope="col" className="py-2 pr-3 font-medium">W-L-T</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium" title="Win Points">WP</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium" title="Autonomous Points">AP</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium" title="Strength of Schedule Points">SP</th>
            <th scope="col" className="detail py-2 pr-3 text-right font-medium">High</th>
            <th scope="col" className="detail py-2 pr-3 text-right font-medium">Avg</th>
            <th scope="col" className="detail py-2 pr-3 text-right font-medium">Total</th>
            {headers.map((h) => (
              <th key={h} scope="col" className="py-2 pr-3 text-right font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rankings.map((r) => {
            const below = extras?.below?.(r);
            return (
              <Fragment key={r.team.id}>
                <tr className="border-t border-line">
                  <td className="tabular py-2 pr-2 font-semibold">{r.rank}</td>
                  <td className="py-2 pr-3">
                    <Link to={`/teams/${encodeURIComponent(r.team.number)}`} className="font-semibold hover:underline">
                      {r.team.number}
                    </Link>
                  </td>
                  <td className="tabular py-2 pr-3">{formatRecord(r)}</td>
                  <td className="tabular py-2 pr-3 text-right">{r.wp}</td>
                  <td className="tabular py-2 pr-3 text-right">{r.ap}</td>
                  <td className="tabular py-2 pr-3 text-right">{r.sp}</td>
                  <td className="detail tabular py-2 pr-3 text-right">{r.highScore}</td>
                  <td className="detail tabular py-2 pr-3 text-right">{formatNumber(r.averagePoints)}</td>
                  <td className="detail tabular py-2 pr-3 text-right">{r.totalPoints}</td>
                  {(extras?.cells?.(r) ?? []).map((c, i) => (
                    <td key={i} className="tabular py-2 pr-3 text-right">
                      {c}
                    </td>
                  ))}
                </tr>
                {below && (
                  <tr>
                    <td colSpan={colSpan} className="pb-3">
                      {below}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
