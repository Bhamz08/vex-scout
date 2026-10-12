import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
}

/**
 * Accessible segmented tab list (WAI-ARIA tabs pattern): arrow keys, Home and End move
 * between tabs. The caller renders the active panel.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const last = items.length - 1;
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (e.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    if (next === null) return;
    e.preventDefault();
    const item = items[next];
    if (!item) return;
    onChange(item.id);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {items.map((item, i) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'min-h-10 shrink-0 rounded-lg border px-3 text-sm font-medium whitespace-nowrap',
              selected ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface text-fg hover:bg-surface-2',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
