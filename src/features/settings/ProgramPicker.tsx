import { SelectField } from '@/components/ui/Fields';
import { PROGRAM_MODES, useSettings, type ProgramMode } from './store';

export function ProgramPicker({ className }: { className?: string }) {
  const program = useSettings((s) => s.program);
  const setProgram = useSettings((s) => s.setProgram);
  return (
    <SelectField label="Program" className={className} value={program} onChange={(e) => setProgram(e.target.value as ProgramMode)}>
      {Object.entries(PROGRAM_MODES).map(([id, p]) => (
        <option key={id} value={id}>
          {p.label}
        </option>
      ))}
    </SelectField>
  );
}
