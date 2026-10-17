import { Panel, Receipt, ReceiptHead, ReceiptSection, ScreenTitle } from '@/components/ui';
import { loadRuns } from '@/evals/results';

export const dynamic = 'force-dynamic';

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** One printed line of the scorecard, with a dotted leader to its figure. */
function Line({ label, value, note, alarm = false }: { label: string; value: string | number; note: string; alarm?: boolean }) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-[0.9375rem] font-semibold text-slate">{label}</span>
        <span aria-hidden="true" className="flex-1 -translate-y-1 border-b-[1.5px] border-dotted border-line" />
        <span className={`text-lg font-extrabold tabular-nums ${alarm ? 'text-orange-ink' : 'text-forest'}`}>{value}</span>
      </div>
      <p className="text-[0.75rem] text-muted">{note}</p>
    </div>
  );
}

export default function EvalsPage() {
  const runs = loadRuns().reverse().slice(0, 10);
  const latest = runs[0];
  const t = latest?.metrics.test;
  return (
    <div className="space-y-5">
      <ScreenTitle before="How well does the checker " script="decide" after="?">
        67 purchase requests, each labelled approve / ask / block against one fixed set of rules. 17 are held back as a test set and never used for tuning.
      </ScreenTitle>
      {!latest && (
        <p className="rounded-[20px] border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
          No runs yet. Run <code className="rounded bg-cream px-1 font-mono text-[0.75rem]">npm run eval</code>.
        </p>
      )}
      {latest && t && (
        <Receipt>
          <ReceiptHead title="Latest run" sub={`${latest.checker} · held-out test set`} amount={pct(t.accuracy)} />
          <ReceiptSection className="space-y-3">
            <Line label="Wrong approvals" value={t.wrongApprovals} note="money at risk" alarm={t.wrongApprovals > 0} />
            <Line label="Needless asks" value={t.needlessAsks} note="annoyance" />
            <Line label="Wrong blocks" value={t.wrongBlocks} note="task fails" />
            <Line label="Correct" value={`${t.correct}/${t.total}`} note="accuracy on cases never used for tuning" />
          </ReceiptSection>
        </Receipt>
      )}
      {runs.length > 0 && (
        <Panel className="overflow-hidden">
          <h3 className="px-4 pb-2 pt-4 text-sm font-bold text-forest">All runs (test set)</h3>
          <div className="overflow-x-auto px-4">
            <table className="w-full text-left text-[0.8125rem] tabular-nums">
              <thead>
                <tr className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-muted">
                  <th scope="col" className="pb-2 pr-3 font-bold">Checker</th>
                  <th scope="col" className="pb-2 pr-2 text-right font-bold">Acc.</th>
                  <th scope="col" className="pb-2 pr-2 text-right font-bold"><abbr title="Wrong approvals" className="no-underline">WA</abbr></th>
                  <th scope="col" className="pb-2 pr-2 text-right font-bold"><abbr title="Needless asks" className="no-underline">NA</abbr></th>
                  <th scope="col" className="pb-2 text-right font-bold"><abbr title="Wrong blocks" className="no-underline">WB</abbr></th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r, i) => (
                  <tr key={r.ranAt} className={`rule-dashed ${i === 0 ? 'bg-forest/[0.04]' : ''}`}>
                    <td className="py-2 pr-3">
                      <span className="block font-semibold text-slate">{r.label || r.checker.split(':')[0]}</span>
                      <span className="block max-w-[11rem] truncate text-[0.75rem] text-muted" title={r.checker}>{r.checker}</span>
                    </td>
                    <td className="py-2 pr-2 text-right font-bold text-forest">{pct(r.metrics.test.accuracy)}</td>
                    <td className={`py-2 pr-2 text-right font-semibold ${r.metrics.test.wrongApprovals > 0 ? 'text-orange-ink' : 'text-slate'}`}>{r.metrics.test.wrongApprovals}</td>
                    <td className="py-2 pr-2 text-right text-slate">{r.metrics.test.needlessAsks}</td>
                    <td className="py-2 text-right text-slate">{r.metrics.test.wrongBlocks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-4 pb-4 pt-3 text-[0.75rem] text-muted">WA = wrong approvals · NA = needless asks · WB = wrong blocks</p>
        </Panel>
      )}
    </div>
  );
}
