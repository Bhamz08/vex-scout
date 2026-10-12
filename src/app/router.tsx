import { createBrowserRouter } from 'react-router-dom';
import { EventPage } from '@/features/events/EventPage';
import { EventSearchPage } from '@/features/events/EventSearchPage';
import { HomePage } from '@/features/home/HomePage';
import { MorePage } from '@/features/more/MorePage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { TeamPage } from '@/features/teams/TeamPage';
import { TeamSearchPage } from '@/features/teams/TeamSearchPage';
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
      { path: '/more', element: <MorePage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
