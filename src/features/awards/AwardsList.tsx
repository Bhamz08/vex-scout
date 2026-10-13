import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/States';
import type { Award, VexEvent } from '@/data/types';

export function AwardsList({ awards, events, showTeams = false }: { awards: Award[]; events?: VexEvent[]; showTeams?: boolean }) {
  if (!awards.length) return <EmptyState title="No awards yet" />;
  return (
    <ul className="space-y-2">
      {awards.map((a) => (
        <li key={a.id} className="rounded-md border border-line bg-surface p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{a.title}</span>
            {a.qualifications.map((q) => (
              <Badge key={q} tone="accent">
                Qualifies: {q}
              </Badge>
            ))}
          </div>
          {events && <div className="text-sm text-muted">{events.find((e) => e.id === a.eventId)?.name}</div>}
          {showTeams && (
            <div className="mt-1 flex flex-wrap gap-2 text-sm">
              {a.teams.map((t) => (
                <Link key={t.id} to={`/teams/${encodeURIComponent(t.number)}`} className="text-accent-ink underline">
                  {t.number}
                </Link>
              ))}
              {a.individuals.map((p) => (
                <span key={p}>{p}</span>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
