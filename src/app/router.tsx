import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from '@/features/home/HomePage';
import { MorePage } from '@/features/more/MorePage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { Layout } from './Layout';
import { NotFoundPage } from './NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/more', element: <MorePage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
