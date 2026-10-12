import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { skillsV5rcRules } from '@/features/scoring/rules/skills';
import { v5rcRules } from '@/features/scoring/rules/v5rc';
import { vexuRules } from '@/features/scoring/rules/vexu';
import type { MatchRules } from '@/features/scoring/rules/types';
import { useSettings } from '@/features/settings/store';
import { MatchTimer } from './MatchTimer';
import type { Period } from './timerMachine';

type Mode = 'v5rc' | 'vexu' | 'skills';

/** The final 10 seconds are the Endgame (manual, "The Endgame: Final 10 Seconds"). */
const ENDGAME_WARNING_SECONDS = [10];

function matchPeriods(rules: MatchRules): Period[] {
  return [
    { id: 'auton', label: 'Autonomous', seconds: rules.periods.autonomousSeconds },
    { id: 'driver', label: 'Driver control', seconds: rules.periods.driverSeconds },
  ];
}

export function TimerPage() {
  const program = useSettings((s) => s.program);
  const [mode, setMode] = useState<Mode>(program === 'VEXU' ? 'vexu' : 'v5rc');
  const periods = useMemo<Period[]>(
    () => (mode === 'skills' ? [{ id: 'skills', label: 'Skills run', seconds: skillsV5rcRules.runSeconds }] : matchPeriods(mode === 'vexu' ? vexuRules : v5rcRules)),
    [mode],
  );

  return (
    <>
      <PageHeader title="Practice timer" subtitle="Keeps the screen awake while running (where supported). Durations come from the rules configs." />
      <div className="mb-6">
        <Tabs<Mode>
          label="Timer mode"
          value={mode}
          onChange={setMode}
          items={[
            { id: 'v5rc', label: `V5RC ${v5rcRules.periods.autonomousSeconds}s + ${formatShort(v5rcRules.periods.driverSeconds)}` },
            { id: 'vexu', label: `VEX U ${vexuRules.periods.autonomousSeconds}s + ${formatShort(vexuRules.periods.driverSeconds)}` },
            { id: 'skills', label: `Skills ${formatShort(skillsV5rcRules.runSeconds)}` },
          ]}
        />
      </div>
      <Card className="py-8">
        <MatchTimer key={mode} periods={periods} warnAtSeconds={mode === 'skills' ? [] : ENDGAME_WARNING_SECONDS} />
      </Card>
    </>
  );
}

function formatShort(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}
