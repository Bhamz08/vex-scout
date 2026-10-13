import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  // Ink-on-paper primary; the accent stays reserved for state and emphasis.
  primary: 'bg-fg text-bg hover:opacity-85',
  secondary: 'border border-line-strong/80 text-fg hover:bg-surface-2',
  ghost: 'text-fg hover:bg-surface-2',
  danger: 'border border-line text-bad hover:border-bad',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'secondary', size = 'md', className, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded font-display font-semibold tracking-wide uppercase transition disabled:cursor-not-allowed disabled:opacity-40',
        size === 'sm' && 'min-h-9 px-3 text-sm',
        size === 'md' && 'min-h-11 px-4 text-[0.95rem]',
        size === 'lg' && 'min-h-14 px-7 text-lg',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  );
}
