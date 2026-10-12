import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router-dom';
import { EventIcon, HomeIcon, MoreIcon, ScoreIcon, SettingsIcon, TeamIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { DataModeBadge } from './DataModeBadge';
import { OfflineBanner } from './OfflineBanner';
import { UpdatePrompt } from './UpdatePrompt';

const NAV = [
  { to: '/', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/teams', label: 'Teams', Icon: TeamIcon, end: false },
  { to: '/events', label: 'Events', Icon: EventIcon, end: false },
  { to: '/scoring', label: 'Scoring', Icon: ScoreIcon, end: false },
  { to: '/more', label: 'More', Icon: MoreIcon, end: false },
] as const;

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only z-50 rounded bg-accent px-3 py-2 text-on-accent focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <img src="/favicon.svg" alt="" className="size-7" />
            <span>VEX Scout</span>
          </Link>
          <DataModeBadge />
          <nav aria-label="Primary" className="ml-auto hidden gap-1 md:flex">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn('rounded-lg px-3 py-2 text-sm font-medium', isActive ? 'bg-accent text-on-accent' : 'hover:bg-surface-2')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <Link to="/settings" className="ml-auto rounded-lg p-2 hover:bg-surface-2 md:ml-0" aria-label="Settings">
            <SettingsIcon />
          </Link>
        </div>
      </header>

      <OfflineBanner />

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-28 md:pb-10">
        <Outlet />
      </main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-5">
          {NAV.map(({ to, label, Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn('flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium', isActive ? 'text-accent' : 'text-muted')
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon strokeWidth={isActive ? 2.5 : 2} />
                    <span className={cn(isActive && 'underline underline-offset-4')}>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <UpdatePrompt />
      <ScrollRestoration />
    </div>
  );
}
