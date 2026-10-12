import { SelectField } from '@/components/ui/Fields';
import { pickCurrentSeason, useActiveSeason } from '@/data/queries';
import { useSettings } from './store';

/** Season selector for the active program. "Current" follows the season in progress. */
export function SeasonPicker({ className }: { className?: string }) {
  const chosen = useSettings((s) => s.seasonId);
  const set = useSettings((s) => s.set);
  const { seasons, isLoading } = useActiveSeason();
  const current = pickCurrentSeason(seasons);
  const value = chosen !== null && seasons.some((s) => s.id === chosen) ? String(chosen) : 'current';

  return (
    <SelectField
      label="Season"
      className={className}
      value={value}
      disabled={isLoading}
      onChange={(e) => set('seasonId', e.target.value === 'current' ? null : Number(e.target.value))}
    >
      <option value="current">Current{current ? ` (${current.name})` : ''}</option>
      {seasons.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </SelectField>
  );
}
