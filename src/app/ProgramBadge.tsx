import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { PROGRAM_MODES, useSettings } from '@/features/settings/store';

/** Shows the active program mode in the header; links to Settings to change it. */
export function ProgramBadge() {
  const program = useSettings((s) => s.program);
  return (
    <Link to="/settings" aria-label={`${PROGRAM_MODES[program].label}. Open settings`}>
      <Badge>{PROGRAM_MODES[program].short}</Badge>
    </Link>
  );
}
