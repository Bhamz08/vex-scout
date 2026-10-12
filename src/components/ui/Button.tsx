import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:opacity-90',
  secondary: 'bg-surface-2 text-fg border border-line hover:bg-surface',
  ghost: 'text-fg hover:bg-surface-2',
  danger: 'bg-surface-2 text-bad border border-line hover:bg-surface',
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
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' && 'min-h-9 px-3 text-sm',
        size === 'md' && 'min-h-11 px-4',
        size === 'lg' && 'min-h-14 px-6 text-lg',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  );
}
