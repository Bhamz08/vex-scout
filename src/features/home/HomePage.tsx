import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, Section } from '@/components/ui/Card';
import { TextField } from '@/components/ui/Fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/States';
import { DEMO_EVENT_ID, DEMO_VEXU_EVENT_ID } from '@/data/demo/generator';
import { useActiveSeason } from '@/data/queries';
import { useDataSource } from '@/data/useDataSource';
import { useFavorites } from '@/features/favorites/favorites';
import { PROGRAM_MODES, useSettings } from '@/features/settings/store';

const TOOLS = [
  { to: '/scoring', title: 'Score calculator', body: 'V5RC, VEX U and Skills' },
  { to: '/timer', title: 'Match timer', body: 'Auton + driver with buzzers' },
  { to: '/leaderboards/skills', title: 'World Skills', body: 'Season leaderboard' },
  { to: '/notes', title: 'Notes', body: 'Scouting notes & export' },
];

export function HomePage() {
  const navigate = useNavigate();
  const [team, setTeam] = useState('');
  const programMode = useSettings((s) => s.program);
  const { program, season } = useActiveSeason();
  const { kind } = useDataSource();
  const favTeams = useFavorites('team');
  const favEvents = useFavorites('event');

  const lookup = (e: FormEvent) => {
    e.preventDefault();
    if (team.trim()) navigate(`/teams/${encodeURIComponent(team.trim().toUpperCase())}`);
  };

  return (
    <>
      <PageHeader
        title="VEX Scout"
        subtitle={
          <>
            {PROGRAM_MODES[programMode].label}
            {season && <> · {season.name}</>}
          </>
        }
      />

      <form onSubmit={lookup} role="search" className="mb-6 flex items-end gap-2">
        <TextField label="Find a team" placeholder={program === 'VURC' ? 'NU1' : '1234A'} value={team} onChange={(e) => setTeam(e.target.value)} className="flex-1" autoCapitalize="characters" />
        <Button type="submit" variant="primary">
          Go
        </Button>
      </form>

      {kind === 'demo' && (
        <Card className="mb-6 border-warn bg-warn-soft">
          <p className="font-semibold text-warn">You're viewing demo data</p>
          <p className="mt-1 text-sm">
            Everything works with generated teams and matches. Start with the{' '}
            <Link to={`/events/${program === 'VURC' ? DEMO_VEXU_EVENT_ID : DEMO_EVENT_ID}`} className="font-semibold underline">
              demo signature event
            </Link>
            .
          </p>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Favorite teams">
          {favTeams.length ? (
            <ul className="flex flex-wrap gap-2">
              {favTeams.map((f) => (
                <li key={f.id}>
                  <Link to={`/teams/${encodeURIComponent(f.refId)}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface px-3 hover:border-accent">
                    <span className="font-semibold">{f.label}</span>
                    <span className="detail text-sm text-muted">{f.subtitle}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No favorite teams">Tap Favorite on a team page.</EmptyState>
          )}
        </Section>
        <Section title="Favorite events">
          {favEvents.length ? (
            <ul className="space-y-2">
              {favEvents.map((f) => (
                <li key={f.id}>
                  <Link to={`/events/${f.refId}`} className="block rounded-lg border border-line bg-surface p-3 hover:border-accent">
                    <span className="font-semibold">{f.label}</span>
                    <span className="block text-sm text-muted">{f.subtitle}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No favorite events">
              <Link to="/events" className="text-accent underline">
                Browse events
              </Link>
            </EmptyState>
          )}
        </Section>
      </div>

      <Section title="Tools" className="mt-6">
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {TOOLS.map((t) => (
            <li key={t.to}>
              <Link to={t.to} className="block h-full rounded-xl border border-line bg-surface p-3 hover:border-accent">
                <span className="font-semibold">{t.title}</span>
                <span className="detail block text-sm text-muted">{t.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
