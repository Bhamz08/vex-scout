import { useQueryClient } from '@tanstack/react-query';
import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/States';
import { dataQueryOptions, useDivisionRankings, useEventSkills, useEventTeams } from '@/data/queries';
import type { Division, VexEvent } from '@/data/types';
import { useDataSource } from '@/data/useDataSource';
import { downloadText, slug } from '@/features/export/download';
import { buildScoutingSheet, scoutingSheetCsv, type DivisionData } from '@/features/export/scoutingSheet';
import { useDivisionModel } from '@/features/stats/useDivisionModel';
import { formatNumber } from '@/lib/format';
import { useAllNotes, useEventScouting } from './repo';
import { ScoutingForm } from './ScoutingForm';

/** The scouting spreadsheet for a division: stats + ratings + notes per team, with CSV export. */
export function ScoutingPanel({ event, division }: { event: VexEvent; division: Division }) {
  const { model } = useDivisionModel(event, division);
  const rankingsQ = useDivisionRankings(event.id, division.id);
  const teamsQ = useEventTeams(event.id);
  const skillsQ = useEventSkills(event.id);
  const scouting = useEventScouting(event.id);
  const allNotes = useAllNotes();
  const [open, setOpen] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const ds = useDataSource();
  const queryClient = useQueryClient();

  const notes = useMemo(() => (allNotes ?? []).filter((n) => n.eventId === event.id || n.eventId === null), [allNotes, event.id]);
  const ready = model && rankingsQ.data && teamsQ.data && skillsQ.data && scouting;

  const rows = useMemo(
    () =>
      ready
        ? buildScoutingSheet({
            divisions: [{ division, matches: model.matches, rankings: rankingsQ.data.data }],
            teams: teamsQ.data.data,
            skills: skillsQ.data.data,
            scouting,
            notes,
          })
        : [],
    [ready, division, model, rankingsQ.data, teamsQ.data, skillsQ.data, scouting, notes],
  );

  if (!ready) return <Loading />;

  const exportDivision = () => downloadText(`${slug(event.name)}-${slug(division.name)}-scouting.csv`, scoutingSheetCsv(rows), 'text/csv;charset=utf-8');

  const exportEvent = async () => {
    setExporting(true);
    try {
      // Reuse React Query's cache so already-loaded divisions aren't fetched again.
      const divisions: DivisionData[] = await Promise.all(
        event.divisions.map(async (d) => {
          const [matches, rankings] = await Promise.all([
            queryClient.fetchQuery(dataQueryOptions(ds, ['matches', event.id, d.id], (x) => x.getDivisionMatches(event.id, d.id))),
            queryClient.fetchQuery(dataQueryOptions(ds, ['rankings', event.id, d.id], (x) => x.getDivisionRankings(event.id, d.id))),
          ]);
          return { division: d, matches: matches.data, rankings: rankings.data };
        }),
      );
      const all = buildScoutingSheet({ divisions, teams: teamsQ.data.data, skills: skillsQ.data.data, scouting, notes });
      downloadText(`${slug(event.name)}-scouting.csv`, scoutingSheetCsv(all), 'text/csv;charset=utf-8');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="primary" onClick={exportDivision}>
          Export CSV ({division.name})
        </Button>
        {event.divisions.length > 1 && (
          <Button size="sm" onClick={() => void exportEvent()} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export CSV (whole event)'}
          </Button>
        )}
      </div>
      <p className="text-sm text-muted">Tap a team to fill in your scouting form. Ratings are averaged across every scout whose notes you’ve imported.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Scouting sheet</caption>
          <thead className="text-muted">
            <tr>
              <th scope="col" className="py-2 pr-2 font-medium">#</th>
              <th scope="col" className="py-2 pr-3 font-medium">Team</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">OPR</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">CCWM</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Skills</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Scout rating</th>
              <th scope="col" className="detail py-2 font-medium">Tags</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Fragment key={r.team}>
                <tr className="border-t border-line">
                  <td className="tabular py-2 pr-2">{r.rank ?? '—'}</td>
                  <td className="py-2 pr-3">
                    <button type="button" aria-expanded={open === r.team} onClick={() => setOpen(open === r.team ? null : r.team)} className="font-semibold underline-offset-2 hover:underline">
                      {r.team}
                    </button>
                  </td>
                  <td className="tabular py-2 pr-3 text-right">{r.opr === null ? '—' : formatNumber(r.opr)}</td>
                  <td className="tabular py-2 pr-3 text-right">{r.ccwm === null ? '—' : formatNumber(r.ccwm)}</td>
                  <td className="tabular py-2 pr-3 text-right">{r.skillsCombined ?? '—'}</td>
                  <td className="tabular py-2 pr-3 text-right">{r.scoutRating === null ? '—' : `${formatNumber(r.scoutRating)} (${r.scoutCount})`}</td>
                  <td className="detail py-2 text-muted">{r.tags}</td>
                </tr>
                {open === r.team && (
                  <tr>
                    <td colSpan={7} className="pb-4">
                      <div className="space-y-2 rounded-md border border-line p-3">
                        <div className="flex justify-between">
                          <span className="font-semibold">Scouting {r.team}</span>
                          <Link to={`/teams/${encodeURIComponent(r.team)}`} className="text-sm text-accent-ink underline">
                            Team page
                          </Link>
                        </div>
                        <ScoutingForm eventId={event.id} teamNumber={r.team} />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
