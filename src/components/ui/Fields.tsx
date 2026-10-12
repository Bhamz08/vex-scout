import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const control = 'min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-fg placeholder:text-muted';

export function TextField({
  label,
  hint,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div className={cn('space-y-1', className)}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input id={id} className={control} aria-describedby={hint ? `${id}-hint` : undefined} {...rest} />
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export function SelectField({
  label,
  children,
  className,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <div className={cn('space-y-1', className)}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <select id={id} className={control} {...rest}>
        {children}
      </select>
    </div>
  );
}

export function TextArea({ label, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const id = useId();
  return (
    <div className={cn('space-y-1', className)}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <textarea id={id} className={cn(control, 'min-h-24 py-2')} {...rest} />
    </div>
  );
}

export function Switch({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative h-7 w-12 shrink-0 rounded-full border border-line transition', checked ? 'bg-accent' : 'bg-surface-2')}
      >
        <span
          aria-hidden="true"
          className={cn('absolute top-0.5 size-5 rounded-full border border-line bg-surface shadow transition-all', checked ? 'left-6' : 'left-0.5')}
        />
      </button>
    </div>
  );
}

/** Large-touch-target integer stepper for scoring inputs. */
export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  tone,
  name,
}: {
  label: ReactNode;
  /** Plain-text name for the +/- buttons, e.g. "Red 1 Alliance Goal red halves" (defaults to `label` if it is a string) */
  name?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  tone?: 'red' | 'blue';
}) {
  const id = useId();
  const accessible = name ?? (typeof label === 'string' ? label : '');
  const clamp = (v: number) => Math.max(min, Math.min(max, Number.isFinite(v) ? Math.round(v) : min));
  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className={cn('text-sm', tone === 'red' && 'text-red-team', tone === 'blue' && 'text-blue-team')}>
        {label}
      </label>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label={`Decrease ${accessible}`.trim()}
          className="size-10 rounded-lg border border-line bg-surface-2 text-lg font-bold disabled:opacity-40"
          disabled={value <= min}
          onClick={() => onChange(clamp(value - 1))}
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          className="tabular h-10 w-14 rounded-lg border border-line bg-surface text-center"
        />
        <button
          type="button"
          aria-label={`Increase ${accessible}`.trim()}
          className="size-10 rounded-lg border border-line bg-surface-2 text-lg font-bold disabled:opacity-40"
          disabled={value >= max}
          onClick={() => onChange(clamp(value + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}
