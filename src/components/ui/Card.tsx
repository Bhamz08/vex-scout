import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** A quiet panel: hairline border, barely-raised surface, small radius. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-md border border-line bg-surface p-4', className)} {...rest} />;
}

/** Section with a ruled, uppercase heading – the main way pages are divided. */
export function Section({ title, actions, children, className }: { title: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line-strong pb-1.5">
        <h2 className="text-xl font-semibold uppercase">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}
