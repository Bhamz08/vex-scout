import type { ReactNode } from 'react';
import { Badge, UnverifiedFlag } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { ScoringRules } from '../rules/types';

/** Rules version label, "How scoring works" summary (in our own words, linking to the manual) and UNVERIFIED notes. */
export function RulesInfo({ rules, children }: { rules: ScoringRules; children: ReactNode }) {
  return (
    <Card className="space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">Rules: Game Manual v{rules.manual.version}</Badge>
        <span className="text-xs text-muted">
          released {rules.manual.date}, in effect from {rules.manual.effective} · {rules.manual.sections.join(', ')}
        </span>
      </div>
      <details>
        <summary className="cursor-pointer font-semibold">How scoring works</summary>
        <div className="mt-2 space-y-2 text-muted">
          {children}
          <p>
            This is a summary to help you use the calculator, not the rules. Read the{' '}
            <a href={rules.manual.url} target="_blank" rel="noreferrer" className="text-accent-ink underline">
              official Game Manual
            </a>{' '}
            and the{' '}
            <a href={rules.manual.qaUrl} target="_blank" rel="noreferrer" className="text-accent-ink underline">
              official Q&amp;A
            </a>{' '}
            for rulings.
          </p>
        </div>
      </details>
      {rules.unverified.map((u) => (
        <div key={u.key} className="flex flex-wrap items-start gap-2">
          <UnverifiedFlag note={u.note} />
          <span className="text-xs text-muted">{u.note}</span>
        </div>
      ))}
    </Card>
  );
}
