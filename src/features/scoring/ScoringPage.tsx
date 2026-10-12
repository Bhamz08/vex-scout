import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { useSettings } from '@/features/settings/store';
import { MatchCalculator } from './components/MatchCalculator';
import { SkillsCalculator } from './components/SkillsCalculator';
import { v5rcRules } from './rules/v5rc';
import { vexuRules } from './rules/vexu';

type Mode = 'v5rc' | 'vexu' | 'skills';
const MODES: { id: Mode; label: string }[] = [
  { id: 'v5rc', label: 'V5RC Match' },
  { id: 'vexu', label: 'VEX U Match' },
  { id: 'skills', label: 'Skills' },
];

export function ScoringPage() {
  const program = useSettings((s) => s.program);
  const [params, setParams] = useSearchParams();
  const mode = MODES.find((m) => m.id === params.get('mode'))?.id ?? (program === 'VEXU' ? 'vexu' : 'v5rc');

  return (
    <>
      <PageHeader title="Score calculator" subtitle="Override 2026-27. Each mode keeps its own inputs on this device." />
      <div className="mb-4">
        <Tabs<Mode> label="Calculator mode" value={mode} onChange={(m) => setParams({ mode: m }, { replace: true })} items={MODES} />
      </div>
      {mode === 'v5rc' && <MatchCalculator key="v5rc" rules={v5rcRules} />}
      {mode === 'vexu' && <MatchCalculator key="vexu" rules={vexuRules} />}
      {mode === 'skills' && <SkillsCalculator />}
    </>
  );
}
