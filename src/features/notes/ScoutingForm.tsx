import { useEffect, useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { SelectField, TextArea } from '@/components/ui/Fields';
import type { EndgameAbility, Rating, ScoutingRecord } from '@/data/db';
import { useSettings } from '@/features/settings/store';
import { cn } from '@/lib/cn';
import { ENDGAME_LABELS, saveScouting, useTeamScouting, type ScoutingDraft } from './repo';

const RATINGS: Rating[] = [1, 2, 3, 4, 5];

/** Structured scouting form for one team at one event. Edits this device's form; teammates' forms are read-only. */
export function ScoutingForm({ eventId, teamNumber, onSaved }: { eventId: number; teamNumber: string; onSaved?: () => void }) {
  const deviceId = useSettings((s) => s.deviceId);
  const records = useTeamScouting(eventId, teamNumber);
  const mine = records?.find((r) => r.deviceId === deviceId);
  const [draft, setDraft] = useState<ScoutingDraft>(() => blank(eventId, teamNumber));
  const [saved, setSaved] = useState(false);

  // Load this device's existing form once it arrives from IndexedDB.
  useEffect(() => {
    if (mine) setDraft(fromRecord(mine));
  }, [mine]);

  const set = <K extends keyof ScoutingDraft>(k: K, v: ScoutingDraft[K]) => {
    setSaved(false);
    setDraft((d) => ({ ...d, [k]: v }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await saveScouting(draft, mine);
    setSaved(true);
    onSaved?.();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <RatingField label="Autonomous reliability" value={draft.autonReliability} onChange={(v) => set('autonReliability', v)} />
      <RatingField label="Scoring ability" value={draft.scoringAbility} onChange={(v) => set('scoringAbility', v)} />
      <RatingField label="Driver skill" value={draft.driverSkill} onChange={(v) => set('driverSkill', v)} />
      <SelectField label="Endgame (Midfield)" value={draft.endgame} onChange={(e) => set('endgame', e.target.value as EndgameAbility)}>
        {Object.entries(ENDGAME_LABELS).map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </SelectField>
      <RatingField label="Overall rating" value={draft.rating} onChange={(v) => set('rating', v)} />
      <TextArea label="Scouting notes" value={draft.notes} onChange={(e) => set('notes', e.target.value)} rows={3} />
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" size="sm">
          {mine ? 'Update scouting' : 'Save scouting'}
        </Button>
        {saved && (
          <span role="status" className="text-sm text-ok">
            ✓ Saved
          </span>
        )}
      </div>
    </form>
  );
}

function RatingField({ label, value, onChange }: { label: string; value: Rating; onChange: (v: Rating) => void }) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <div className="flex gap-1">
        {RATINGS.map((r) => (
          <label key={r} className="flex-1">
            <input type="radio" name={name} value={r} checked={value === r} onChange={() => onChange(r)} className="peer sr-only" />
            <span
              className={cn(
                'flex min-h-11 cursor-pointer items-center justify-center rounded border text-sm font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-accent',
                value === r ? 'border-accent bg-accent text-on-accent' : 'border-line',
              )}
            >
              {r}
            </span>
          </label>
        ))}
      </div>
      <div className="mt-0.5 flex justify-between text-xs text-muted">
        <span>1 poor</span>
        <span>5 excellent</span>
      </div>
    </fieldset>
  );
}

function blank(eventId: number, teamNumber: string): ScoutingDraft {
  return { eventId, teamNumber, autonReliability: 3, scoringAbility: 3, driverSkill: 3, endgame: 'sometimes', rating: 3, notes: '' };
}

function fromRecord(r: ScoutingRecord): ScoutingDraft {
  return {
    eventId: r.eventId,
    teamNumber: r.teamNumber,
    autonReliability: r.autonReliability,
    scoringAbility: r.scoringAbility,
    driverSkill: r.driverSkill,
    endgame: r.endgame,
    rating: r.rating,
    notes: r.notes,
  };
}
