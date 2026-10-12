import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from '@/features/home/HomePage';
import { Layout } from './Layout';
import { NotFoundPage } from './NotFoundPage';
import { RouteError } from './RouteError';

/**
 * Routes. Everything except Home is code-split; the service worker precaches every chunk,
 * so lazy routes still open offline.
 */
export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/teams', lazy: () => import('@/features/teams/TeamSearchPage').then((m) => ({ Component: m.TeamSearchPage })) },
      { path: '/teams/:number', lazy: () => import('@/features/teams/TeamPage').then((m) => ({ Component: m.TeamPage })) },
      { path: '/events', lazy: () => import('@/features/events/EventSearchPage').then((m) => ({ Component: m.EventSearchPage })) },
      { path: '/events/:eventId', lazy: () => import('@/features/events/EventPage').then((m) => ({ Component: m.EventPage })) },
      {
        path: '/events/:eventId/divisions/:divisionId/matches/:matchId',
        lazy: () => import('@/features/matches/MatchPage').then((m) => ({ Component: m.MatchPage })),
      },
      { path: '/leaderboards/skills', lazy: () => import('@/features/leaderboards/WorldSkillsPage').then((m) => ({ Component: m.WorldSkillsPage })) },
      { path: '/leaderboards/trueskill', lazy: () => import('@/features/leaderboards/TrueSkillPage').then((m) => ({ Component: m.TrueSkillPage })) },
      { path: '/notes', lazy: () => import('@/features/notes/NotesPage').then((m) => ({ Component: m.NotesPage })) },
      { path: '/scoring', lazy: () => import('@/features/scoring/ScoringPage').then((m) => ({ Component: m.ScoringPage })) },
      { path: '/timer', lazy: () => import('@/features/timer/TimerPage').then((m) => ({ Component: m.TimerPage })) },
      { path: '/manual', lazy: () => import('@/features/manual/ManualPage').then((m) => ({ Component: m.ManualPage })) },
      { path: '/more', lazy: () => import('@/features/more/MorePage').then((m) => ({ Component: m.MorePage })) },
      { path: '/settings', lazy: () => import('@/features/settings/SettingsPage').then((m) => ({ Component: m.SettingsPage })) },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
