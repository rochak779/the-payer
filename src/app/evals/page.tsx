import { Card } from '@/components/ui';
import { loadRuns } from '@/evals/results';

export const dynamic = 'force-dynamic';

const pct = (x: number) => `${Math.round(x * 100)}%`;

export default function EvalsPage() {
  const runs = loadRuns().reverse().slice(0, 10);
  const latest = runs[0];
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">How well does the checker decide?</h2>
      <p className="text-sm text-neutral-600">
        65 purchase requests, each labelled approve / ask / block against one fixed set of rules. 17 are held back as a test set and never used for tuning.
      </p>
      {!latest && <p className="text-sm text-neutral-500">No runs yet. Run <code>npm run eval</code>.</p>}
      {latest && (
        <Card>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Latest · {latest.checker} · held-out test set</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[
              ['Wrong approvals', latest.metrics.test.wrongApprovals, 'money at risk'],
              ['Needless asks', latest.metrics.test.needlessAsks, 'annoyance'],
              ['Wrong blocks', latest.metrics.test.wrongBlocks, 'task fails'],
              ['Accuracy', pct(latest.metrics.test.accuracy), `${latest.metrics.test.correct}/${latest.metrics.test.total}`],
            ].map(([label, value, note]) => (
              <div key={String(label)} className="rounded-xl bg-neutral-50 p-3">
                <p className="text-2xl font-semibold">{value}</p>
                <p className="text-xs font-medium">{label}</p>
                <p className="text-[11px] text-neutral-500">{note}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
      {runs.length > 0 && (
        <Card>
          <p className="mb-2 text-xs uppercase tracking-wide text-neutral-500">All runs (test set)</p>
          <table className="w-full text-left text-xs">
            <thead><tr className="text-neutral-500"><th>Checker</th><th>Acc.</th><th>WA</th><th>NA</th><th>WB</th></tr></thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.ranAt} className="border-t border-neutral-100">
                  <td className="py-1 pr-2">{r.checker}{r.label ? ` · ${r.label}` : ''}</td>
                  <td>{pct(r.metrics.test.accuracy)}</td>
                  <td>{r.metrics.test.wrongApprovals}</td>
                  <td>{r.metrics.test.needlessAsks}</td>
                  <td>{r.metrics.test.wrongBlocks}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-neutral-500">WA = wrong approvals · NA = needless asks · WB = wrong blocks</p>
        </Card>
      )}
    </div>
  );
}
