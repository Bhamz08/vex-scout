import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LastUpdated } from '@/components/LastUpdated';
import { QueryView } from '@/components/QueryView';
import { Badge } from '@/components/ui/Badge';
import { SelectField, TextField } from '@/components/ui/Fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/States';
import { EVENT_LEVELS, type EventLevel, type Grade, type VexEvent } from '@/data/types';
import { useActiveSeason, useEventSearch } from '@/data/queries';
import { useFavorites } from '@/features/favorites/favorites';
import { formatDateRange, placeLine } from '@/lib/format';

export function EventSearchPage() {
  const active = useActiveSeason();
  const [seasonId, setSeasonId] = useState<number | undefined>(undefined);
  const [level, setLevel] = useState<EventLevel | ''>('');
  const [grade, setGrade] = useState<Grade | ''>('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [query, setQuery] = useState('');
  const favorites = useFavorites('event');

  const season = seasonId ?? active.seasonId;
  // Server-side filters: program, season, level, grade. Country/region/text are filtered locally so the
  // dropdowns can list every country in the season.
  const filter = season === undefined ? undefined : { program: active.program, seasonId: season, level: level || undefined, grade: grade || undefined };
  const eventsQ = useEventSearch(filter);

  const all = useMemo(() => eventsQ.data?.data ?? [], [eventsQ.data]);
  const countries = useMemo(() => [...new Set(all.map((e) => e.location.country).filter(Boolean))].sort(), [all]);
  const regions = useMemo(
    () => [...new Set(all.filter((e) => !country || e.location.country === country).map((e) => e.location.region).filter(Boolean))].sort(),
    [all, country],
  );

  const filtered = (events: VexEvent[]) => {
    const q = query.trim().toLowerCase();
    return events
      .filter((e) => !country || e.location.country === country)
      .filter((e) => !region || e.location.region === region)
      .filter((e) => !q || [e.name, e.sku, e.location.city].some((s) => s.toLowerCase().includes(q)));
  };

  return (
    <>
      <PageHeader title="Events" actions={<LastUpdated result={eventsQ.data} onRefresh={() => void eventsQ.refetch()} isFetching={eventsQ.isFetching} />} />

      {favorites.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 font-semibold">Favorite events</h2>
          <ul className="flex flex-wrap gap-2">
            {favorites.map((f) => (
              <li key={f.id}>
                <Link to={`/events/${f.refId}`} className="inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-3 hover:border-accent">
                  {f.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="search" onSubmit={(e) => e.preventDefault()}>
        <TextField label="Search" placeholder="Name, SKU or city" value={query} onChange={(e) => setQuery(e.target.value)} className="sm:col-span-2 lg:col-span-3" />
        <SelectField label="Season" value={season ?? ''} onChange={(e) => setSeasonId(Number(e.target.value))}>
          {active.seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Level" value={level} onChange={(e) => setLevel(e.target.value as EventLevel | '')}>
          <option value="">All levels</option>
          {EVENT_LEVELS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </SelectField>
        {active.program === 'V5RC' && (
          <SelectField label="Grade" value={grade} onChange={(e) => setGrade(e.target.value as Grade | '')}>
            <option value="">All grades</option>
            <option>High School</option>
            <option>Middle School</option>
          </SelectField>
        )}
        <SelectField
          label="Country"
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setRegion('');
          }}
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </SelectField>
        <SelectField label="Region / state" value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">All regions</option>
          {regions.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </SelectField>
      </form>

      <QueryView query={eventsQ} loadingLabel="Loading events…">
        {(events) => {
          const list = filtered(events);
          if (!list.length) return <EmptyState title="No events match these filters" />;
          return (
            <ul className="space-y-2">
              {list.map((e) => (
                <li key={e.id}>
                  <EventCard event={e} />
                </li>
              ))}
            </ul>
          );
        }}
      </QueryView>
    </>
  );
}

export function EventCard({ event }: { event: VexEvent }) {
  return (
    <Link to={`/events/${event.id}`} className="block rounded-xl border border-line bg-surface p-3 hover:border-accent">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{event.name}</span>
        <Badge>{event.level}</Badge>
      </div>
      <div className="text-sm text-muted">
        {formatDateRange(event.start, event.end)} · {placeLine(event.location)}
        <span className="detail"> · {event.sku}</span>
      </div>
    </Link>
  );
}
