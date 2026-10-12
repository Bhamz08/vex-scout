import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { useApplyTheme } from '@/features/settings/useApplyTheme';
import { router } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Our data layer already falls back to IndexedDB when offline, so let queries run offline.
      networkMode: 'always',
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  useApplyTheme();
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
