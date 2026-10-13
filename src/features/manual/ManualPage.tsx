import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { OVERRIDE_MANUAL } from '@/features/scoring/rules/manual';

/** Links out to the official documents. The manual's text is intentionally not copied into the app. */
export function ManualPage() {
  const links = [
    { href: OVERRIDE_MANUAL.url, title: 'Override Game Manual', body: `Official rules for V5RC, VEX U and Robot Skills. The calculators currently use v${OVERRIDE_MANUAL.version}.` },
    { href: OVERRIDE_MANUAL.qaUrl, title: 'Official Q&A', body: 'Rulings from the Game Design Committee on events.vex.com. Treat these as part of the rules.' },
    { href: 'https://events.vex.com', title: 'VEX Events', body: 'Event listings, registration and results (formerly RobotEvents).' },
  ];
  return (
    <>
      <PageHeader title="Game manual & Q&A" subtitle="Always check the official documents. This app summarises scoring for convenience only." />
      <ul className="grid border-t border-line sm:grid-cols-2 sm:gap-x-8">
        {links.map((l) => (
          <li key={l.href}>
            <a href={l.href} target="_blank" rel="noreferrer" className="group flex h-full items-center justify-between gap-4 border-b border-line px-1 py-4 transition-colors hover:bg-surface-2">
              <span>
              <span className="block font-display text-xl font-semibold uppercase">{l.title}</span>
              <span className="mt-0.5 block text-sm text-muted">{l.body}</span>
              </span>
              <span aria-hidden="true" className="font-display text-xl text-muted transition-transform group-hover:translate-x-1 group-hover:text-fg">
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
      <Card className="mt-6 text-sm text-muted">
        The manual is copyrighted by Innovation First, Inc. / VEX Robotics, so VEX Scout links to it instead of reproducing it.
      </Card>
    </>
  );
}
