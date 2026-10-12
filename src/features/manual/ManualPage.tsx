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
      <ul className="grid gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.href}>
            <a href={l.href} target="_blank" rel="noreferrer" className="block h-full rounded-xl border border-line bg-surface p-4 hover:border-accent">
              <span className="font-semibold">{l.title} ↗</span>
              <span className="mt-1 block text-sm text-muted">{l.body}</span>
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
