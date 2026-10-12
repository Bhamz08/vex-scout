import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/cn';
import { ProgramPicker } from './ProgramPicker';
import { SeasonPicker } from './SeasonPicker';
import { ACCENTS, LIVE_API_AVAILABLE, useSettings, type Accent, type ThemePref } from './store';

const THEMES: { id: ThemePref; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

export function SettingsPage() {
  const s = useSettings();

  return (
    <>
      <PageHeader title="Settings" />
      <div className="space-y-4">
        <Card className="space-y-4">
          <h2 className="font-semibold">Competition</h2>
          <ProgramPicker />
          <SeasonPicker />
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Data source</h2>
          <fieldset className="space-y-2">
            <legend className="sr-only">Data source</legend>
            <label className="flex items-center gap-3">
              <input type="radio" name="datamode" checked={s.dataMode === 'demo'} onChange={() => s.set('dataMode', 'demo')} className="size-5 accent-[var(--accent)]" />
              <span>
                <span className="font-medium">Demo data</span>
                <span className="block text-sm text-muted">Generated teams, an event and matches. Works with no API key.</span>
              </span>
            </label>
            <label className={cn('flex items-center gap-3', !LIVE_API_AVAILABLE && 'opacity-60')}>
              <input
                type="radio"
                name="datamode"
                disabled={!LIVE_API_AVAILABLE}
                checked={s.dataMode === 'live'}
                onChange={() => s.set('dataMode', 'live')}
                className="size-5 accent-[var(--accent)]"
              />
              <span>
                <span className="font-medium">Live (VEX Events API)</span>
                <span className="block text-sm text-muted">
                  {LIVE_API_AVAILABLE
                    ? 'Uses the API through this site’s server proxy.'
                    : 'Not configured on this deployment. See the README to add an API key.'}
                </span>
              </span>
            </label>
          </fieldset>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Appearance</h2>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Theme</legend>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((t) => (
                <label
                  key={t.id}
                  className={cn(
                    'flex min-h-11 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium',
                    s.theme === t.id ? 'border-accent bg-accent text-on-accent' : 'border-line',
                  )}
                >
                  <input type="radio" name="theme" className="sr-only" checked={s.theme === t.id} onChange={() => s.set('theme', t.id)} />
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Accent color</legend>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a: Accent) => (
                <label key={a} data-accent={a} className="cursor-pointer">
                  <input type="radio" name="accent" className="peer sr-only" checked={s.accent === a} onChange={() => s.set('accent', a)} />
                  <span className="flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm capitalize peer-checked:border-2 peer-checked:border-fg peer-checked:font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                    <span className="size-4 rounded-full bg-accent" aria-hidden="true" />
                    {a}
                    {s.accent === a && <span aria-hidden="true">✓</span>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <Switch
            label="Minimalist mode"
            description="Hide secondary details for a cleaner, faster view at events."
            checked={s.minimalist}
            onChange={(v) => s.set('minimalist', v)}
          />
        </Card>

        <p className="text-xs text-muted">
          Device ID (used to label your notes when sharing): <code className="break-all">{s.deviceId}</code>
        </p>
      </div>
    </>
  );
}
