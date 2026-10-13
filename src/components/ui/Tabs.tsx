import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
}

/**
 * Accessible tab strip (WAI-ARIA tabs pattern): arrow keys, Home and End move between tabs.
 * Styled as an underlined row; `variant="pill"` gives a compact segmented control for small choices.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  variant = 'line',
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  variant?: 'line' | 'pill';
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
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'flex overflow-x-auto [scrollbar-width:none]',
        variant === 'line' ? 'gap-5 border-b border-line' : 'w-fit max-w-full gap-0.5 rounded border border-line bg-surface-2 p-0.5',
      )}
    >
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
              'shrink-0 font-display font-semibold tracking-wide whitespace-nowrap uppercase transition-colors',
              variant === 'line'
                ? cn('-mb-px min-h-11 border-b-[3px] text-[0.95rem]', selected ? 'border-fg text-fg dark:border-accent' : 'border-transparent text-muted hover:text-fg')
                : cn('min-h-9 rounded-sm px-3 text-sm', selected ? 'bg-fg text-bg' : 'text-muted hover:text-fg'),
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
