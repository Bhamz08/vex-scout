import { createBrowserRouter } from 'react-router-dom';
import { EventPage } from '@/features/events/EventPage';
import { EventSearchPage } from '@/features/events/EventSearchPage';
import { HomePage } from '@/features/home/HomePage';
import { TrueSkillPage } from '@/features/leaderboards/TrueSkillPage';
import { WorldSkillsPage } from '@/features/leaderboards/WorldSkillsPage';
import { MatchPage } from '@/features/matches/MatchPage';
import { ManualPage } from '@/features/manual/ManualPage';
import { MorePage } from '@/features/more/MorePage';
import { NotesPage } from '@/features/notes/NotesPage';
import { ScoringPage } from '@/features/scoring/ScoringPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { TeamPage } from '@/features/teams/TeamPage';
import { TeamSearchPage } from '@/features/teams/TeamSearchPage';
import { TimerPage } from '@/features/timer/TimerPage';
import { Layout } from './Layout';
import { NotFoundPage } from './NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/teams', element: <TeamSearchPage /> },
      { path: '/teams/:number', element: <TeamPage /> },
      { path: '/events', element: <EventSearchPage /> },
      { path: '/events/:eventId', element: <EventPage /> },
      { path: '/events/:eventId/divisions/:divisionId/matches/:matchId', element: <MatchPage /> },
      { path: '/leaderboards/skills', element: <WorldSkillsPage /> },
      { path: '/leaderboards/trueskill', element: <TrueSkillPage /> },
      { path: '/notes', element: <NotesPage /> },
      { path: '/scoring', element: <ScoringPage /> },
      { path: '/timer', element: <TimerPage /> },
      { path: '/manual', element: <ManualPage /> },
      { path: '/more', element: <MorePage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
