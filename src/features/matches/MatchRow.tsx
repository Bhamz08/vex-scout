import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Match, MatchAlliance } from '@/data/types';
import { cn } from '@/lib/cn';
import { formatDayTime } from '@/lib/format';
import { matchWinner, resultFor } from '@/lib/matches';

/**
 * One match: both alliances with scores. Alliance color is always paired with a text label
 * ("Red"/"Blue") and the winner is marked with text, so nothing relies on color alone.
 */
export function MatchRow({
  match,
  highlightTeamId,
  href,
  extra,
}: {
  match: Match;
  highlightTeamId?: number;
  href?: string;
  extra?: ReactNode;
}) {
  const winner = matchWinner(match);
  const result = highlightTeamId !== undefined ? resultFor(match, highlightTeamId) : null;

  const body = (
    <div className="flex items-stretch gap-3">
      <div className="w-16 shrink-0">
        <div className="font-semibold">{match.name}</div>
        {result && (
          <div className={cn('text-sm font-bold', result === 'W' ? 'text-ok' : result === 'L' ? 'text-bad' : 'text-muted')}>
            {result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Tie'}
          </div>
        )}
        {!match.scored && (
          <div className="text-xs text-muted">
            {match.field && <div>{match.field}</div>}
            {match.scheduled && <div>{formatDayTime(match.scheduled)}</div>}
          </div>
        )}
      </div>
      <div className="grid min-w-0 flex-1 gap-1">
        <AllianceLine alliance={match.red} won={winner === 'red'} highlightTeamId={highlightTeamId} />
        <AllianceLine alliance={match.blue} won={winner === 'blue'} highlightTeamId={highlightTeamId} />
      </div>
      {extra && <div className="shrink-0 self-center">{extra}</div>}
    </div>
  );

  return href ? (
    <Link to={href} className="block rounded-xl border border-line bg-surface p-3 hover:border-accent">
      {body}
    </Link>
  ) : (
    <div className="rounded-xl border border-line bg-surface p-3">{body}</div>
  );
}

function AllianceLine({ alliance, won, highlightTeamId }: { alliance: MatchAlliance; won: boolean; highlightTeamId?: number }) {
  const red = alliance.color === 'red';
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 rounded-lg border-l-4 px-2 py-1',
        red ? 'border-red-team bg-red-soft' : 'border-blue-team bg-blue-soft',
      )}
    >
      <span className={cn('w-10 shrink-0 text-xs font-bold uppercase', red ? 'text-red-team' : 'text-blue-team')}>{red ? 'Red' : 'Blue'}</span>
      <span className="flex min-w-0 flex-1 flex-wrap gap-x-3">
        {alliance.teams.map((t) => (
          <span key={t.id} className={cn('tabular', t.id === highlightTeamId && 'font-bold underline underline-offset-2', t.sitting && 'line-through')}>
            {t.number}
          </span>
        ))}
      </span>
      <span className={cn('tabular w-12 text-right text-lg', won ? 'font-bold' : 'text-muted')}>
        {alliance.score ?? '–'}
        {won && <span className="sr-only"> (winner)</span>}
      </span>
    </div>
  );
}
