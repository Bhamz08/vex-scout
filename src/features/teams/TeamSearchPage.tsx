import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Card';
import { TextField } from '@/components/ui/Fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/States';
import { useActiveSeason } from '@/data/queries';
import { useFavorites } from '@/features/favorites/favorites';

export function TeamSearchPage() {
  const [number, setNumber] = useState('');
  const navigate = useNavigate();
  const { program } = useActiveSeason();
  const favorites = useFavorites('team');

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
