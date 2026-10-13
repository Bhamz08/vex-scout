/** Brand mark: an ink "V" chevron on a signal-yellow tile (matches the favicon and app icons). */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="10" fill="#f2c200" />
      <path d="M16 17 32 47 48 17" fill="none" stroke="#141417" strokeWidth="8" strokeLinejoin="miter" strokeLinecap="square" />
    </svg>
  );
}
