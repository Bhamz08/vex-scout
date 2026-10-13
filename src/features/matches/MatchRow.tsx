import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Match, MatchAlliance } from '@/data/types';
import { cn } from '@/lib/cn';
import { formatDayTime } from '@/lib/format';
import { matchWinner, resultFor, shortMatchName } from '@/lib/matches';

/**
 * One match as a two-line scoreboard. Alliance color is a thin bar plus a "Red"/"Blue" label, and the
 * winning score is bold with an arrow, so nothing relies on color alone.
 */
export function MatchRow({ match, highlightTeamId, href, extra }: { match: Match; highlightTeamId?: number; href?: string; extra?: ReactNode }) {
  const winner = matchWinner(match);
  const result = highlightTeamId !== undefined ? resultFor(match, highlightTeamId) : null;

  const body = (
    <div className="flex items-stretch gap-4">
      <div className="flex w-24 shrink-0 flex-col justify-center">
        <div className="num text-xl leading-none whitespace-nowrap sm:text-2xl" title={match.name}>
          {shortMatchName(match)}
        </div>
        {result && (
          <div className={cn('eyebrow mt-1', result === 'W' ? 'text-ok' : result === 'L' ? 'text-bad' : '')}>{result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Tie'}</div>
        )}
        {!match.scored && (
          <div className="mt-1 text-xs leading-tight text-muted">
            {match.field && <div>{match.field}</div>}
            {match.scheduled && <div>{formatDayTime(match.scheduled)}</div>}
          </div>
        )}
      </div>
      <div className="grid min-w-0 flex-1 content-center gap-1">
        <AllianceLine alliance={match.red} won={winner === 'red'} played={match.scored} highlightTeamId={highlightTeamId} />
        <AllianceLine alliance={match.blue} won={winner === 'blue'} played={match.scored} highlightTeamId={highlightTeamId} />
      </div>
      {extra && <div className="flex w-12 shrink-0 items-center justify-end text-right">{extra}</div>}
    </div>
  );

  const cls = 'block border-b border-line px-1 py-3 transition-colors';
  return href ? (
    <Link to={href} className={cn(cls, 'hover:bg-surface-2')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function AllianceLine({ alliance, won, played, highlightTeamId }: { alliance: MatchAlliance; won: boolean; played: boolean; highlightTeamId?: number }) {
  const red = alliance.color === 'red';
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className={cn('h-5 w-1 shrink-0 rounded-full', red ? 'bg-red-team' : 'bg-blue-team')} />
      <span className={cn('eyebrow w-9 shrink-0', red ? 'text-red-team' : 'text-blue-team')}>{red ? 'Red' : 'Blue'}</span>
      <span className="flex min-w-0 flex-1 flex-wrap gap-x-4 text-[0.95rem]">
        {alliance.teams.map((t) => (
          <span
            key={t.id}
            className={cn('tabular', t.id === highlightTeamId ? 'font-semibold underline decoration-accent decoration-2 underline-offset-4' : 'text-fg/85', t.sitting && 'line-through')}
          >
            {t.number}
          </span>
        ))}
      </span>
      <span className={cn('num w-14 text-right text-2xl leading-none', played && !won && 'text-muted', won && 'font-bold')}>
        {won && <span className="mr-1 text-sm" aria-hidden="true">▸</span>}
        {alliance.score ?? <span className="text-muted">–</span>}
        {won && <span className="sr-only"> (winner)</span>}
      </span>
    </div>
  );
}
