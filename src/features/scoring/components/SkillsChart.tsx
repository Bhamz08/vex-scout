import { useState } from 'react';
import type { SkillsRunRecord } from '@/data/db';
import { formatDate } from '@/lib/format';

const SERIES = [
  { type: 'driver', label: 'Driver', color: 'var(--series-1)', shape: 'circle' },
  { type: 'programming', label: 'Programming', color: 'var(--series-2)', shape: 'square' },
] as const;

const W = 640;
const H = 220;
const PAD = { top: 12, right: 16, bottom: 28, left: 40 };

/**
 * Skills scores over attempts (x = attempt number in time order, one y-axis). Two series, told apart by
 * color, marker shape and a legend; hover or focus a point for its value; a table view is provided too.
 */
export function SkillsChart({ runs }: { runs: SkillsRunRecord[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const ordered = [...runs].sort((a, b) => a.createdAt - b.createdAt);
  if (ordered.length < 2) return <p className="text-sm text-muted">Save at least two runs to see a chart.</p>;

  const maxY = Math.max(10, ...ordered.map((r) => r.score));
  const niceMax = Math.ceil(maxY / 10) * 10;
  const x = (i: number) => PAD.left + (i / Math.max(1, ordered.length - 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - v / niceMax) * (H - PAD.top - PAD.bottom);
  const ticks = [0, niceMax / 2, niceMax];
  const hovered = ordered.find((r) => r.id === hover);

  return (
    <figure className="space-y-2">
      <div className="flex flex-wrap gap-4 text-sm" aria-hidden="true">
        {SERIES.map((s) => (
          <span key={s.type} className="inline-flex items-center gap-2">
            <svg width="14" height="14">
              {s.shape === 'circle' ? <circle cx="7" cy="7" r="5" fill={s.color} /> : <rect x="2" y="2" width="10" height="10" rx="2" fill={s.color} />}
            </svg>
            {s.label}
          </span>
        ))}
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Skills scores by attempt">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
              <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
                {t}
              </text>
            </g>
          ))}
          <text x={(W + PAD.left) / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--muted)">
            Attempt (oldest → newest)
          </text>
          {SERIES.map((s) => {
            const points = ordered.map((r, i) => ({ r, i })).filter((p) => p.r.type === s.type);
            return (
              <g key={s.type}>
                {points.length > 1 && (
                  <polyline points={points.map((p) => `${x(p.i)},${y(p.r.score)}`).join(' ')} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
                )}
                {points.map(({ r, i }) => (
                  <g
                    key={r.id}
                    tabIndex={0}
                    role="img"
                    aria-label={`${s.label} ${r.score} on ${formatDate(new Date(r.createdAt).toISOString())}`}
                    onMouseEnter={() => setHover(r.id)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(r.id)}
                    onBlur={() => setHover(null)}
                    className="cursor-pointer outline-none"
                  >
                    {/* Larger invisible hit target than the mark */}
                    <circle cx={x(i)} cy={y(r.score)} r={12} fill="transparent" />
                    {s.shape === 'circle' ? (
                      <circle cx={x(i)} cy={y(r.score)} r={hover === r.id ? 6 : 4.5} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
                    ) : (
                      <rect x={x(i) - 4.5} y={y(r.score) - 4.5} width={9} height={9} rx={2} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
                    )}
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
        {hovered && (
          <div className="pointer-events-none absolute top-1 right-1 rounded border border-line bg-surface px-2 py-1 text-xs shadow">
            <span className="font-semibold">{hovered.type === 'driver' ? 'Driver' : 'Programming'}</span> {hovered.score} ·{' '}
            {formatDate(new Date(hovered.createdAt).toISOString())}
          </div>
        )}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted">Show as table</summary>
        <table className="mt-2 w-full">
          <thead className="text-muted">
            <tr>
              <th className="text-left font-medium">#</th>
              <th className="text-left font-medium">Type</th>
              <th className="text-right font-medium">Score</th>
              <th className="text-right font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {ordered.map((r, i) => (
              <tr key={r.id} className="border-t border-line">
                <td>{i + 1}</td>
                <td>{r.type === 'driver' ? 'Driver' : 'Programming'}</td>
                <td className="text-right">{r.score}</td>
                <td className="text-right">{formatDate(new Date(r.createdAt).toISOString())}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
