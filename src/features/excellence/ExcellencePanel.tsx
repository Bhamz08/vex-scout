import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { UnverifiedFlag } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState, Loading } from '@/components/ui/States';
import { useDivisionMatches, useDivisionRankings, useEventSkills, useEventTeams } from '@/data/queries';
import type { Division, VexEvent } from '@/data/types';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/format';
import { evaluateExcellence, type Criterion } from './excellence';
import { excellenceRules as rules } from './rules';

export function ExcellencePanel({ event, division }: { event: VexEvent; division: Division }) {
  const rankingsQ = useDivisionRankings(event.id, division.id);
  const matchesQ = useDivisionMatches(event.id, division.id);
  const skillsQ = useEventSkills(event.id);
  const teamsQ = useEventTeams(event.id);

  const rows = useMemo(() => {
    const matches = matchesQ.data?.data;
    if (!matches || !rankingsQ.data || !skillsQ.data || !teamsQ.data) return undefined;
    const divisionTeams = new Map<number, { id: number; number: string }>();
    for (const m of matches) for (const t of [...m.red.teams, ...m.blue.teams]) divisionTeams.set(t.id, { id: t.id, number: t.number });
    return evaluateExcellence([...divisionTeams.values()], rankingsQ.data.data, skillsQ.data.data, teamsQ.data.data.length, rules);
  }, [matchesQ.data, rankingsQ.data, skillsQ.data, teamsQ.data]);

  if (!rows) return <Loading />;

  return (
    <div className="space-y-4">
      <Card className="space-y-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">Excellence Award eligibility</span>
          {!rules.verified && <UnverifiedFlag note={rules.note} />}
        </div>
        <p className="text-muted">
          A team must rank in the top {formatPercent(rules.qualificationTopFraction)} of qualification rankings (this division), the top{' '}
          {formatPercent(rules.skillsTopFraction)} of Robot Skills and the top {formatPercent(rules.autonSkillsTopFraction)} of Autonomous Coding Skills (whole event)
          {rules.requireBothSkillsTypes && ', with scores in both skills types'}. The engineering notebook is judged and not checked here. Source: {rules.source}.
        </p>
      </Card>
      {!rows.length ? (
        <EmptyState title="No teams yet" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Excellence eligibility per team</caption>
            <thead className="text-muted">
              <tr>
                <th scope="col" className="py-2 pr-3 font-medium">Team</th>
                <th scope="col" className="py-2 pr-3 font-medium">Eligible?</th>
                <th scope="col" className="py-2 pr-3 font-medium">Qual rank</th>
                <th scope="col" className="py-2 pr-3 font-medium">Skills rank</th>
                <th scope="col" className="py-2 pr-3 font-medium">Auton skills</th>
                <th scope="col" className="py-2 font-medium">Both skills</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.team.id} className="border-t border-line">
                  <td className="py-2 pr-3">
                    <Link to={`/teams/${encodeURIComponent(r.team.number)}`} className="font-semibold hover:underline">
                      {r.team.number}
                    </Link>
                  </td>
                  <td className={cn('py-2 pr-3 font-semibold', r.eligible ? 'text-ok' : 'text-muted')}>{r.eligible ? '✓ Yes' : '✗ No'}</td>
                  <CriterionCell c={r.qualification} />
                  <CriterionCell c={r.skills} />
                  <CriterionCell c={r.autonSkills} />
                  <td className={cn('py-2', r.bothSkills ? 'text-ok' : 'text-bad')}>{r.bothSkills ? '✓ Yes' : '✗ No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CriterionCell({ c }: { c: Criterion }) {
  return (
    <td className={cn('tabular py-2 pr-3', c.pass ? 'text-ok' : 'text-bad')}>
      {c.pass ? '✓' : '✗'} {c.rank ?? '—'} <span className="text-muted">/ ≤{c.cutoff}</span>
    </td>
  );
}
