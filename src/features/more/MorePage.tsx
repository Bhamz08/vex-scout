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
      <ul className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="block rounded-xl border border-line bg-surface p-4 hover:border-accent">
              <span className="font-semibold">{l.title}</span>
              <span className="mt-1 block text-sm text-muted">{l.body}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
