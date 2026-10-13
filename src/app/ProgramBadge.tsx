import { Link } from 'react-router-dom';
import { PROGRAM_MODES, useSettings } from '@/features/settings/store';

/** Active program mode in the header; links to Settings to change it. */
export function ProgramBadge() {
  const program = useSettings((s) => s.program);
  return (
    <Link
      to="/settings"
      aria-label={`${PROGRAM_MODES[program].label}. Open settings`}
      className="rounded-sm border border-white/20 px-1.5 py-px font-display text-xs font-semibold tracking-wider text-[#a8a7ae] uppercase hover:border-white/50 hover:text-white"
    >
      {PROGRAM_MODES[program].short}
    </Link>
  );
}
