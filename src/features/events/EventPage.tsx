import { useParams, useSearchParams } from 'react-router-dom';
import { QueryView } from '@/components/QueryView';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { useEvent } from '@/data/queries';
import type { Division, VexEvent } from '@/data/types';
import { FavoriteButton } from '@/features/favorites/FavoriteButton';
import { formatDateRange, placeLine } from '@/lib/format';
import { AwardsPanel } from './panels/AwardsPanel';
import { MatchesPanel } from './panels/MatchesPanel';
import { RankingsPanel } from './panels/RankingsPanel';
import { SkillsPanel } from './panels/SkillsPanel';
import { TeamsPanel } from './panels/TeamsPanel';

type TabId = 'matches' | 'rankings' | 'teams' | 'skills' | 'awards';

const TABS: { id: TabId; label: string }[] = [
  { id: 'matches', label: 'Matches' },
  { id: 'rankings', label: 'Rankings' },
  { id: 'teams', label: 'Teams' },
  { id: 'skills', label: 'Skills' },
  { id: 'awards', label: 'Awards' },
];

export function EventPage() {
  const eventId = Number(useParams().eventId);
  const eventQ = useEvent(eventId);
  return (
    <QueryView query={eventQ} loadingLabel="Loading event…">
      {(event) => (event ? <EventDetail event={event} /> : <EmptyState title="Event not found" />)}
    </QueryView>
  );
}

function EventDetail({ event }: { event: VexEvent }) {
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((t) => t.id === params.get('tab'))?.id ?? 'matches';
  const division: Division | undefined = event.divisions.find((d) => String(d.id) === params.get('div')) ?? event.divisions[0];

  const update = (key: string, value: string) =>
    setParams(
      (p) => {
        p.set(key, value);
        return p;
      },
      { replace: true },
    );

  return (
    <>
      <PageHeader
        title={event.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>{formatDateRange(event.start, event.end)}</span>
            <span aria-hidden="true">·</span>
            <span>
              {event.location.venue ? `${event.location.venue}, ` : ''}
              {placeLine(event.location)}
            </span>
            <Badge>{event.level}</Badge>
            <Badge className="detail">{event.sku}</Badge>
          </span>
        }
        actions={<FavoriteButton kind="event" refId={String(event.id)} label={event.name} subtitle={formatDateRange(event.start, event.end)} />}
      />

      {event.divisions.length > 1 && division && (
        <div className="mb-3">
          <Tabs
            label="Division"
            value={String(division.id)}
            onChange={(id) => update('div', id)}
            items={event.divisions.map((d) => ({ id: String(d.id), label: `Division: ${d.name}` }))}
          />
        </div>
      )}

      <Tabs<TabId> label="Event sections" value={tab} onChange={(id) => update('tab', id)} items={TABS} />

      <div className="mt-4" role="tabpanel">
        {!division && (tab === 'matches' || tab === 'rankings') && <EmptyState title="This event has no divisions yet" />}
        {division && tab === 'matches' && <MatchesPanel event={event} division={division} />}
        {division && tab === 'rankings' && <RankingsPanel event={event} division={division} />}
        {tab === 'teams' && <TeamsPanel event={event} />}
        {tab === 'skills' && <SkillsPanel event={event} />}
        {tab === 'awards' && <AwardsPanel event={event} />}
      </div>
    </>
  );
}
