import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router-dom';
import { EventIcon, HomeIcon, MoreIcon, ScoreIcon, SettingsIcon, TeamIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { Logo } from './Logo';
import { OfflineBanner } from './OfflineBanner';
import { ProgramBadge } from './ProgramBadge';
import { UpdatePrompt } from './UpdatePrompt';

const NAV = [
  { to: '/', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/teams', label: 'Teams', Icon: TeamIcon, end: false },
  { to: '/events', label: 'Events', Icon: EventIcon, end: false },
  { to: '/scoring', label: 'Scoring', Icon: ScoreIcon, end: false },
  { to: '/more', label: 'More', Icon: MoreIcon, end: false },
] as const;

/**
 * App frame. The header and mobile tab bar are a fixed graphite "scoreboard" strip in both themes,
 * so the yellow accent always sits on a dark ground.
 */
export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only z-50 bg-accent px-3 py-2 text-on-accent focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#141417] text-[#ecebe6]">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-2.5" aria-label="VEX Scout home">
            <Logo className="size-7" />
            <span className="font-display text-xl font-bold tracking-wide uppercase">VEX Scout</span>
          </Link>
          <ProgramBadge />
          <nav aria-label="Primary" className="ml-auto hidden h-full md:flex">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex h-full items-center border-b-[3px] px-3 pt-[3px] font-display text-[0.95rem] font-semibold tracking-wider uppercase transition-colors',
                    isActive ? 'border-accent text-white' : 'border-transparent text-[#a8a7ae] hover:text-white',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <Link to="/settings" className="ml-auto rounded p-2 text-[#a8a7ae] hover:text-white md:ml-1" aria-label="Settings">
            <SettingsIcon width={20} height={20} />
          </Link>
        </div>
      </header>

      <OfflineBanner />

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 md:pb-16">
        <Outlet />
      </main>

      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#141417] pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid grid-cols-5">
          {NAV.map(({ to, label, Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-14 flex-col items-center justify-center gap-0.5 border-t-[3px] font-display text-xs font-semibold tracking-wider uppercase',
                    isActive ? 'border-accent text-white' : 'border-transparent text-[#a8a7ae]',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon width={20} height={20} strokeWidth={isActive ? 2.25 : 1.75} className={isActive ? 'text-accent' : undefined} />
                    <span>{label}</span>
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
