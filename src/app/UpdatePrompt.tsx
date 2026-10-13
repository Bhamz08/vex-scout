import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/Button';

/** Tells the user when the app is ready offline, and when a new version is waiting. */
export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-20 z-40 mx-auto flex max-w-md items-center gap-3 rounded-md border border-line bg-surface p-3 shadow-lg md:bottom-6"
    >
      <p className="flex-1 text-sm">{needRefresh ? 'A new version is available.' : 'Ready to work offline.'}</p>
      {needRefresh && (
        <Button size="sm" variant="primary" onClick={() => void updateServiceWorker(true)}>
          Reload
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={close}>
        Dismiss
      </Button>
    </div>
  );
}
