import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Card';
import { TextField } from '@/components/ui/Fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/States';
import { DEMO_EVENT_ID, DEMO_VEXU_EVENT_ID } from '@/data/demo/generator';
import { useActiveSeason, useEventTeams } from '@/data/queries';
import { useDataSource } from '@/data/useDataSource';
import { useFavorites } from '@/features/favorites/favorites';

export function TeamSearchPage() {
  const [number, setNumber] = useState('');
  const navigate = useNavigate();
  const { program } = useActiveSeason();
  const favorites = useFavorites('team');
  const { kind } = useDataSource();
  const demoEvent = program === 'VURC' ? DEMO_VEXU_EVENT_ID : DEMO_EVENT_ID;
  const demoTeams = useEventTeams(demoEvent, kind === 'demo').data?.data.slice(0, 8);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n = number.trim().toUpperCase();
    if (n) navigate(`/teams/${encodeURIComponent(n)}`);
  };

  return (
    <>
      <PageHeader title="Team lookup" subtitle={program === 'VURC' ? 'VEX U team numbers look like "ABC1".' : 'Enter a team number like "1234A".'} />
      <form onSubmit={submit} className="flex items-end gap-2" role="search">
        <TextField
          label="Team number"
          className="flex-1"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder={program === 'VURC' ? 'NU1' : '1234A'}
        />
        <Button type="submit" variant="primary">
          Look up
        </Button>
      </form>

      {kind === 'demo' && demoTeams && (
        <Section title="Try a demo team" className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {demoTeams.map((t) => (
              <li key={t.id}>
                <Link to={`/teams/${encodeURIComponent(t.number)}`} className="inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-3 hover:border-accent">
                  <span className="font-semibold">{t.number}</span>
                  <span className="detail ml-2 text-sm text-muted">{t.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Favorite teams" className="mt-8">
        {favorites.length === 0 ? (
          <EmptyState title="No favorite teams yet">Open a team and tap Favorite to pin it here.</EmptyState>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {favorites.map((f) => (
              <li key={f.id}>
                <Link to={`/teams/${encodeURIComponent(f.refId)}`} className="block rounded-xl border border-line bg-surface p-3 hover:border-accent">
                  <span className="font-semibold">{f.label}</span>
                  <span className="block text-sm text-muted">{f.subtitle}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
