import { useOnline } from '@/lib/useOnline';

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div role="status" className="border-b border-warn bg-warn-soft px-4 py-2 text-center text-sm text-warn">
      <strong>Offline.</strong> Showing data saved on this device. Notes and tools keep working.
    </div>
  );
}
