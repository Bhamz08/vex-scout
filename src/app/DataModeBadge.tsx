import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { effectiveDataMode, PROGRAM_MODES, useSettings } from '@/features/settings/store';

/** Always-visible indicator of where data comes from, plus the active program mode. */
export function DataModeBadge() {
  const mode = effectiveDataMode(useSettings((s) => s.dataMode));
  const program = useSettings((s) => s.program);
  return (
    <Link to="/settings" className="flex items-center gap-1" aria-label={`${mode === 'demo' ? 'Demo data' : 'Live data'}, ${PROGRAM_MODES[program].label}. Open settings`}>
      {mode === 'demo' ? (
        <Badge tone="warn">Demo data</Badge>
      ) : (
        <Badge tone="ok">Live</Badge>
      )}
      <Badge className="detail hidden sm:inline-flex">{PROGRAM_MODES[program].short}</Badge>
    </Link>
  );
}
