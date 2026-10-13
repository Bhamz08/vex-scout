import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Section } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { useActiveSeason } from '@/data/queries';
import { useFavorites } from '@/features/favorites/favorites';
import { PROGRAM_MODES, useSettings } from '@/features/settings/store';

const TOOLS = [
  { to: '/scoring', title: 'Score calculator', body: 'V5RC, VEX U and Skills' },
  { to: '/timer', title: 'Match timer', body: 'Auton + driver, with buzzers' },
  { to: '/leaderboards/skills', title: 'World Skills', body: 'Season standings' },
  { to: '/notes', title: 'Notes', body: 'Scouting notes and export' },
];

export function HomePage() {
  const navigate = useNavigate();
  const [team, setTeam] = useState('');
  const programMode = useSettings((s) => s.program);
  const { program, season } = useActiveSeason();
  const favTeams = useFavorites('team');
  const favEvents = useFavorites('event');
  const gameName = season?.name.split(':').pop()?.trim();

  const lookup = (e: FormEvent) => {
    e.preventDefault();
    if (team.trim()) navigate(`/teams/${encodeURIComponent(team.trim().toUpperCase())}`);
  };

  return (
    <div className="space-y-12">
      <section className="pt-4">
        <div className="eyebrow">
          {PROGRAM_MODES[programMode].label}
          {gameName && <> · {gameName}</>}
        </div>
        <h1 className="mt-2 text-5xl font-bold uppercase sm:text-7xl">
          Know every team
          <br />
          <span className="text-muted">before the match.</span>
        </h1>

        <form onSubmit={lookup} role="search" className="mt-8 flex max-w-xl items-stretch border-b-2 border-fg focus-within:border-accent-ink">
          <label htmlFor="home-team" className="sr-only">
            Team number
          </label>
          <input
            id="home-team"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            placeholder={program === 'VURC' ? 'Team number, e.g. NU1' : 'Team number, e.g. 1234A'}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="min-h-14 min-w-0 flex-1 bg-transparent font-display text-2xl font-semibold tracking-wide uppercase placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:tracking-normal placeholder:normal-case placeholder:text-muted focus:outline-none"
          />
          <button type="submit" className="px-2 font-display text-lg font-semibold tracking-wider uppercase hover:text-accent-ink">
            Look up →
          </button>
        </form>
      </section>

      <div className="grid gap-12 md:grid-cols-2">
        <Section title="Your teams">
          {favTeams.length ? (
            <ul>
              {favTeams.map((f) => (
                <li key={f.id}>
                  <Link to={`/teams/${encodeURIComponent(f.refId)}`} className="flex items-baseline gap-3 border-b border-line px-1 py-3 transition-colors hover:bg-surface-2">
                    <span className="num w-20 text-xl">{f.label}</span>
                    <span className="truncate text-muted">{f.subtitle}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No teams yet">Open a team and tap Favorite to keep it here.</EmptyState>
          )}
        </Section>
        <Section title="Your events">
          {favEvents.length ? (
            <ul>
              {favEvents.map((f) => (
                <li key={f.id}>
                  <Link to={`/events/${f.refId}`} className="block border-b border-line px-1 py-3 transition-colors hover:bg-surface-2">
                    <span className="block font-medium">{f.label}</span>
                    <span className="block text-sm text-muted">{f.subtitle}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No events yet">
              <Link to="/events" className="text-accent-ink underline underline-offset-4">
                Browse events
              </Link>{' '}
              and favorite the ones you’re attending.
            </EmptyState>
          )}
        </Section>
      </div>

      <Section title="Tools">
        <ul className="grid sm:grid-cols-2 sm:gap-x-8">
          {TOOLS.map((t) => (
            <li key={t.to}>
              <Link to={t.to} className="group flex items-center justify-between border-b border-line px-1 py-4 transition-colors hover:bg-surface-2">
                <span>
                  <span className="block font-display text-xl font-semibold uppercase">{t.title}</span>
                  <span className="detail block text-sm text-muted">{t.body}</span>
                </span>
                <span aria-hidden="true" className="font-display text-xl text-muted transition-transform group-hover:translate-x-1 group-hover:text-fg">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
