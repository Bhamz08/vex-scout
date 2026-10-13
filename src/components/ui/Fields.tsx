import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const control =
  'min-h-11 w-full rounded border border-line bg-surface px-3 text-fg transition-colors placeholder:text-muted/70 hover:border-muted focus:border-fg';

export function TextField({
  label,
  hint,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div className={cn('space-y-1', className)}>
      <label htmlFor={id} className="eyebrow block">
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
      <label htmlFor={id} className="eyebrow block">
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
      <label htmlFor={id} className="eyebrow block">
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
        className={cn('relative h-6 w-11 shrink-0 rounded-full border transition', checked ? 'border-fg bg-fg' : 'border-line bg-surface-2')}
      >
        <span
          aria-hidden="true"
          className={cn('absolute top-0.5 size-[18px] rounded-full transition-all', checked ? 'left-[22px] bg-accent' : 'left-0.5 bg-muted')}
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
          className="size-10 rounded border border-line text-lg font-semibold transition-colors hover:border-fg disabled:opacity-30 disabled:hover:border-line"
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
          className="num h-10 w-12 border-0 bg-transparent text-center text-xl"
        />
        <button
          type="button"
          aria-label={`Increase ${accessible}`.trim()}
          className="size-10 rounded border border-line text-lg font-semibold transition-colors hover:border-fg disabled:opacity-30 disabled:hover:border-line"
          disabled={value >= max}
          onClick={() => onChange(clamp(value + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}
