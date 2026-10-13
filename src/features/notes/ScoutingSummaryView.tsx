import type { NoteRecord, ScoutingRecord } from '@/data/db';
import { Badge } from '@/components/ui/Badge';
import { formatNumber } from '@/lib/format';
import { ENDGAME_LABELS, summarizeScouting } from './repo';

/** Compact read-only view of a team's scouting at an event, used in rankings and on the match page. */
export function ScoutingSummaryView({ scouting, notes, compact = false }: { scouting: ScoutingRecord[]; notes: NoteRecord[]; compact?: boolean }) {
  const s = summarizeScouting(scouting);
  const tags = [...new Set(notes.flatMap((n) => n.tags))];
  if (!s && !notes.length) return compact ? null : <p className="text-sm text-muted">No scouting yet.</p>;

  return (
    <div className="space-y-1 rounded bg-surface-2 p-2 text-sm">
      {s && (
        <p className="tabular">
          <span className="font-semibold">Rating {formatNumber(s.rating)}/5</span>
          <span className="text-muted">
            {' '}
            · Auton {formatNumber(s.autonReliability)} · Scoring {formatNumber(s.scoringAbility)} · Driver {formatNumber(s.driverSkill)}
            {s.endgame && <> · {ENDGAME_LABELS[s.endgame]}</>}
            {s.count > 1 && <> · {s.count} scouts</>}
          </span>
        </p>
      )}
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-1" aria-label="Tags">
          {tags.map((t) => (
            <li key={t}>
              <Badge>#{t}</Badge>
            </li>
          ))}
        </ul>
      )}
      {[...scouting.map((r) => r.notes), ...notes.map((n) => (n.matchName ? `${n.matchName}: ${n.text}` : n.text))]
        .filter(Boolean)
        .slice(0, compact ? 2 : 6)
        .map((text, i) => (
          <p key={i} className="line-clamp-2 text-muted">
            “{text}”
          </p>
        ))}
    </div>
  );
}
