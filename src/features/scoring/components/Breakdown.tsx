import type { AllianceBreakdown } from '../engine';
import type { AllianceColor } from '../rules/types';

/** Line-by-line red vs blue breakdown table. */
export function MatchBreakdown({ result, points }: { result: Record<AllianceColor, AllianceBreakdown>; points: { allianceHalf: number; yellowHalf: number; robotInMidfield: number } }) {
  const rows: Array<{ label: string; key: keyof Omit<AllianceBreakdown, 'autonomousBonus' | 'total'>; each: number }> = [
    { label: 'Alliance-colored halves', key: 'allianceHalves', each: points.allianceHalf },
    { label: 'Yellow halves (quadrants)', key: 'yellowQuadrantHalves', each: points.yellowHalf },
    { label: 'Yellow halves (Midfield Goal)', key: 'yellowMidfieldHalves', each: points.yellowHalf },
    { label: 'Robots in Midfield', key: 'robotsInMidfield', each: points.robotInMidfield },
  ];
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">Score breakdown</caption>
      <thead>
        <tr className="text-muted">
          <th scope="col" className="py-1 text-left font-medium">Item</th>
          <th scope="col" className="py-1 text-right font-medium text-red-team">Red</th>
          <th scope="col" className="py-1 text-right font-medium text-blue-team">Blue</th>
        </tr>
      </thead>
      <tbody className="tabular">
        {rows.map((r) => (
          <tr key={r.key} className="border-t border-line">
            <th scope="row" className="py-1 text-left font-normal">
              {r.label} <span className="text-xs text-muted">×{r.each}</span>
            </th>
            <td className="py-1 text-right">
              {result.red[r.key].count} → {result.red[r.key].points}
            </td>
            <td className="py-1 text-right">
              {result.blue[r.key].count} → {result.blue[r.key].points}
            </td>
          </tr>
        ))}
        <tr className="border-t border-line">
          <th scope="row" className="py-1 text-left font-normal">
            Autonomous Bonus
          </th>
          <td className="py-1 text-right">{result.red.autonomousBonus}</td>
          <td className="py-1 text-right">{result.blue.autonomousBonus}</td>
        </tr>
        <tr className="border-t-2 border-line font-bold">
          <th scope="row" className="py-1 text-left">
            Total
          </th>
          <td className="py-1 text-right text-red-team">{result.red.total}</td>
          <td className="py-1 text-right text-blue-team">{result.blue.total}</td>
        </tr>
      </tbody>
    </table>
  );
}
