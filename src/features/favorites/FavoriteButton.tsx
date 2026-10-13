import { StarIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { toggleFavorite, useIsFavorite, type FavoriteKind } from './favorites';

export function FavoriteButton({ kind, refId, label, subtitle }: { kind: FavoriteKind; refId: string; label: string; subtitle: string }) {
  const fav = useIsFavorite(kind, refId);
  const on = !!fav;
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => void toggleFavorite(kind, refId, label, subtitle)}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded border px-4 font-display text-[0.95rem] font-semibold tracking-wide uppercase transition-colors',
        on ? 'border-fg bg-fg text-bg' : 'border-line-strong/80 hover:bg-surface-2',
      )}
    >
      <StarIcon filled={on} width={18} height={18} />
      {on ? 'Favorited' : 'Favorite'}
    </button>
  );
}
