import { Link, useRouteError } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

/** Shown when a route throws or a lazy chunk can't load (e.g. a page never opened before, while offline). */
export function RouteError() {
  const error = useRouteError();
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  return (
    <main className="mx-auto max-w-md space-y-3 p-6 text-center">
      <h1 className="text-xl font-bold">{offline ? 'This page isn’t available offline yet' : 'Something went wrong'}</h1>
      <p className="text-sm text-muted">{offline ? 'Reconnect once to save it on this device.' : error instanceof Error ? error.message : 'Unexpected error.'}</p>
      <div className="flex justify-center gap-2">
        <Button onClick={() => window.location.reload()}>Reload</Button>
        <Link to="/" className="inline-flex min-h-11 items-center rounded px-4 text-accent-ink underline">
          Home
        </Link>
      </div>
    </main>
  );
}
