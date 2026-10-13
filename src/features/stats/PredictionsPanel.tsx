import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Fields';
import { EmptyState, ErrorState, Loading } from '@/components/ui/States';
import type { Division, Match, VexEvent } from '@/data/types';
import { cn } from '@/lib/cn';
import { formatDayTime, formatNumber, formatPercent } from '@/lib/format';
import { matchWinner, shortMatchName, sortMatches } from '@/lib/matches';
import type { Prediction } from '@/lib/stats/predict';
import { useDivisionModel } from './useDivisionModel';
import { WinProbability } from './WinProbability';

interface Row {
  match: Match;
  prediction: Prediction;
}

/** Did the favourite win? null for ties and unplayed matches. */
function pickedCorrectly({ match, prediction }: Row): boolean | null {
  const winner = matchWinner(match);
  if (winner !== 'red' && winner !== 'blue') return null;
  return (winner === 'red') === prediction.redWinProbability >= 0.5;
}

export function PredictionsPanel({ event, division }: { event: VexEvent; division: Division }) {
  const [useHistory, setUseHistory] = useState(false);
  const { model, query, historyLoading } = useDivisionModel(event, division, useHistory);

  const rows = useMemo<Row[]>(() => (model ? sortMatches(model.matches).map((m) => ({ match: m, prediction: model.predict(m) })) : []), [model]);
  const decided = rows.map(pickedCorrectly).filter((x): x is boolean => x !== null);
  const correct = decided.filter(Boolean).length;
  const unplayed = rows.filter((r) => !r.match.scored);
  // After the event ends, unscored matches are leftovers (unneeded best-of-3 games), not upcoming ones.
  const eventOver = Date.parse(event.end) < Date.now();

  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!model) return <Loading />;
  if (!rows.length) return <EmptyState title="No matches scheduled yet" />;

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <Switch
          label="Blend in earlier events"
          description="Mix each team's results from earlier events this season into its rating while this event's sample is small."
          checked={useHistory}
          onChange={setUseHistory}
        />
        {historyLoading && <p className="text-sm text-muted">Loading team histories…</p>}
        <p className="detail text-sm text-muted">
          Expected margin is the average of the OPR and CCWM differences. Win chance assumes the real margin varies around it with σ ≈ {formatNumber(model.sigma, 0)}{' '}
          points, measured from this division’s results.
          {decided.length > 0 && (
            <>
              {' '}
              Picked the winner in {correct}/{decided.length} played matches ({formatPercent(correct / decided.length)}). That’s in-sample, so it flatters the model.
            </>
          )}
        </p>
      </Card>
      {eventOver && unplayed.length > 0 ? (
        <p className="text-sm text-muted">
          {unplayed.length} scheduled match{unplayed.length === 1 ? ' was' : 'es were'} never played (e.g. deciding games of a series that ended early).
        </p>
      ) : (
        <PredictionList title="Upcoming" rows={unplayed} event={event} division={division} />
      )}
      <PredictionList title="Played" rows={rows.filter((r) => r.match.scored)} event={event} division={division} />
    </div>
  );
}

function PredictionList({ title, rows, event, division }: { title: string; rows: Row[]; event: VexEvent; division: Division }) {
  if (!rows.length) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-2xl font-semibold uppercase">{title}</h3>
      <ul className="border-t border-line">
        {rows.map((row) => {
          const { match: m, prediction: p } = row;
          const hit = pickedCorrectly(row);
          return (
            <li key={m.id}>
              <Link to={`/events/${event.id}/divisions/${division.id}/matches/${m.id}`} className="block space-y-2 border-b border-line px-1 py-4 transition-colors hover:bg-surface-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-semibold">
                    {shortMatchName(m)}
                    {!m.scored && m.scheduled && <span className="ml-2 font-normal text-muted">{formatDayTime(m.scheduled)}</span>}
                  </span>
                  <span className="tabular">
                    <span className="text-red-team">{m.red.teams.map((t) => t.number).join(' ')}</span>
                    {' vs '}
                    <span className="text-blue-team">{m.blue.teams.map((t) => t.number).join(' ')}</span>
                  </span>
                </div>
                <WinProbability red={p.redWinProbability} />
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <span className="tabular">
                    Predicted {Math.round(p.redScore)}–{Math.round(p.blueScore)}
                  </span>
                  {m.scored && (
                    <span className={cn('tabular font-semibold', hit === true && 'text-ok', hit === false && 'text-bad')}>
                      Actual {m.red.score}–{m.blue.score} · {hit === null ? 'Tie' : hit ? 'Correct' : 'Upset'}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
