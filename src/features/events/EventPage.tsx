import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { QueryView } from '@/components/QueryView';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { useEvent } from '@/data/queries';
import type { Division, VexEvent } from '@/data/types';
import { FavoriteButton } from '@/features/favorites/FavoriteButton';
import { useAllNotes, useEventScouting } from '@/features/notes/repo';
import { ScoutingPanel } from '@/features/notes/ScoutingPanel';
import { ScoutingSummaryView } from '@/features/notes/ScoutingSummaryView';
import { ExcellencePanel } from '@/features/excellence/ExcellencePanel';
import { PredictionsPanel } from '@/features/stats/PredictionsPanel';
import { StatsPanel } from '@/features/stats/StatsPanel';
import { useDivisionModel } from '@/features/stats/useDivisionModel';
import { WinProbability } from '@/features/stats/WinProbability';
import { formatDateRange, formatNumber, placeLine } from '@/lib/format';
import { AwardsPanel } from './panels/AwardsPanel';
import { MatchesPanel } from './panels/MatchesPanel';
import { RankingsPanel } from './panels/RankingsPanel';
import { SkillsPanel } from './panels/SkillsPanel';
import { TeamsPanel } from './panels/TeamsPanel';

type TabId = 'matches' | 'rankings' | 'stats' | 'predictions' | 'scouting' | 'teams' | 'skills' | 'awards' | 'excellence';

const TABS: { id: TabId; label: string }[] = [
  { id: 'matches', label: 'Matches' },
  { id: 'rankings', label: 'Rankings' },
  { id: 'stats', label: 'Stats' },
  { id: 'predictions', label: 'Predictions' },
  { id: 'scouting', label: 'Scouting' },
  { id: 'teams', label: 'Teams' },
  { id: 'skills', label: 'Skills' },
  { id: 'awards', label: 'Awards' },
  { id: 'excellence', label: 'Excellence' },
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

const DIVISION_TABS: TabId[] = ['matches', 'rankings', 'stats', 'predictions', 'scouting', 'excellence'];

/** Division-scoped sections. Matches and rankings are decorated with computed stats from the same model. */
function DivisionTab({ tab, event, division }: { tab: TabId; event: VexEvent; division: Division }) {
  const { model } = useDivisionModel(event, division);
  const [showNotes, setShowNotes] = useState(false);
  const scouting = useEventScouting(event.id);
  const notes = useAllNotes();
  switch (tab) {
    case 'matches':
      return (
        <MatchesPanel
          event={event}
          division={division}
          renderExtra={(m) => (model && !m.scored ? <WinProbability compact red={model.predict(m).redWinProbability} /> : null)}
        />
      );
    case 'rankings':
      return (
        <RankingsPanel
          event={event}
          division={division}
          toolbar={<Switch label="Show scouting notes" checked={showNotes} onChange={setShowNotes} />}
          extras={{
            below: showNotes
              ? (r) => (
                  <ScoutingSummaryView
                    compact
                    scouting={(scouting ?? []).filter((x) => x.teamNumber === r.team.number)}
                    notes={(notes ?? []).filter((n) => n.teamNumber === r.team.number && (n.eventId === event.id || n.eventId === null))}
                  />
                )
              : undefined,
            headers: ['OPR', 'DPR', 'CCWM'],
            cells: (r) => {
              const s = model?.stats.get(r.team.id);
              return s ? [formatNumber(s.opr), formatNumber(s.dpr), formatNumber(s.ccwm)] : ['–', '–', '–'];
            },
          }}
        />
      );
    case 'stats':
      return <StatsPanel event={event} division={division} />;
    case 'predictions':
      return <PredictionsPanel event={event} division={division} />;
    case 'scouting':
      return <ScoutingPanel event={event} division={division} />;
    case 'excellence':
      return <ExcellencePanel event={event} division={division} />;
    default:
      return null;
  }
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
        {!division && DIVISION_TABS.includes(tab) && <EmptyState title="This event has no divisions yet" />}
        {division && DIVISION_TABS.includes(tab) && <DivisionTab tab={tab} event={event} division={division} />}
        {tab === 'teams' && <TeamsPanel event={event} />}
        {tab === 'skills' && <SkillsPanel event={event} />}
        {tab === 'awards' && <AwardsPanel event={event} />}
      </div>
    </>
  );
}
