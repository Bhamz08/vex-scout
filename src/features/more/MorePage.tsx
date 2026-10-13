import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';

const LINKS = [
  { to: '/timer', title: 'Match timer', body: 'Practice timer with buzzers for matches and skills runs.' },
  { to: '/scoring?mode=skills', title: 'Skills calculator', body: 'Score driver and programming skills runs and track your best.' },
  { to: '/leaderboards/skills', title: 'World Skills leaderboard', body: 'Top combined skills scores this season.' },
  { to: '/leaderboards/trueskill', title: 'TrueSkill leaderboard', body: 'Team ratings computed from match history.' },
  { to: '/notes', title: 'Notes & export', body: 'All scouting notes, JSON backup and sharing.' },
  { to: '/manual', title: 'Game manual & Q&A', body: 'Links to the official Override documents.' },
  { to: '/settings', title: 'Settings', body: 'Program, season, theme and data source.' },
];

export function MorePage() {
  return (
    <>
      <PageHeader title="More" />
      <ul className="grid border-t border-line sm:grid-cols-2 sm:gap-x-8">
        {LINKS.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="group flex h-full items-center justify-between gap-4 border-b border-line px-1 py-4 transition-colors hover:bg-surface-2">
              <span>
              <span className="block font-display text-xl font-semibold uppercase">{l.title}</span>
              <span className="mt-0.5 block text-sm text-muted">{l.body}</span>
              </span>
              <span aria-hidden="true" className="font-display text-xl text-muted transition-transform group-hover:translate-x-1 group-hover:text-fg">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
