import Link from 'next/link';
import { demoCharge, toggleAgent } from '@/app/actions';
import { Card, OutcomeBadge } from '@/components/ui';
import { STATUS_LABEL } from '@/domain/labels';
import { formatMoney } from '@/domain/money';
import type { Approval, LogEntry } from '@/domain/types';
import { defaultStore } from '@/store/store';

export const dynamic = 'force-dynamic';

const time = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

function PurchaseEntry({ approval: a, log }: { approval: Approval; log: LogEntry[] }) {
  const shown = a.decision.reasons.filter((r) => r.outcome !== 'approve');
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{a.request.item}</p>
          <p className="text-xs text-neutral-500">{a.request.merchant} · {formatMoney(a.request.total)} · {STATUS_LABEL[a.status]}</p>
        </div>
        <OutcomeBadge outcome={a.decision.outcome} />
      </div>
      <ul className="mt-2 space-y-1">
        {shown.length === 0 && <li className="text-xs text-neutral-600">{a.decision.summary}</li>}
        {shown.map((r, i) => (
          <li key={i} className="text-xs">
            <span className="mr-1 rounded bg-neutral-100 px-1 text-[10px] uppercase text-neutral-600">{r.by}</span>
            {r.message}
          </li>
        ))}
      </ul>
      {a.card && <p className="mt-2 text-xs text-neutral-600">One-time card •••• {a.card.last4} ({a.card.provider})</p>}
      <ol className="mt-2 space-y-0.5 border-l border-neutral-200 pl-3">
        {log.map((l) => <li key={l.id} className="text-[11px] text-neutral-600">{time(l.at)} · {l.message}</li>)}
      </ol>
      {a.card && (
        <form action={demoCharge} className="mt-3 flex flex-wrap gap-2">
          <input type="hidden" name="id" value={a.id} />
          <span className="w-full text-[11px] font-medium text-neutral-500">Demo: pretend a merchant tries to…</span>
          <button name="kind" value="more" className="rounded-full px-3 py-1 text-xs ring-1 ring-neutral-300">charge £20 more</button>
          <button name="kind" value="other_merchant" className="rounded-full px-3 py-1 text-xs ring-1 ring-neutral-300">charge from another shop</button>
          <button name="kind" value="repeat" className="rounded-full px-3 py-1 text-xs ring-1 ring-neutral-300">charge again</button>
        </form>
      )}
    </Card>
  );
}

export default function ActivityPage() {
  const db = defaultStore().read();
  const purchases = [...db.approvals].reverse();
  const system = db.log.filter((l) => l.approvalId === null).reverse().slice(0, 10);
  const on = db.settings.agentEnabled;
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Activity</h2>
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Agent is {on ? 'on' : 'off'}</p>
            <p className="text-xs text-neutral-500">Turning it off cancels every open approval and card.</p>
          </div>
          <form action={toggleAgent}>
            <input type="hidden" name="enabled" value={on ? 'false' : 'true'} />
            <button className={`rounded-full px-3 py-1.5 text-xs font-medium text-white ${on ? 'bg-red-700' : 'bg-emerald-700'}`}>
              {on ? 'Turn off agent' : 'Turn on'}
            </button>
          </form>
        </div>
      </Card>
      {purchases.length === 0 && <p className="text-sm text-neutral-500">No purchases yet.</p>}
      {purchases.map((a) => <PurchaseEntry key={a.id} approval={a} log={db.log.filter((l) => l.approvalId === a.id)} />)}
      {system.length > 0 && (
        <section>
          <h3 className="mb-1 text-xs font-semibold uppercase text-neutral-500">Other events</h3>
          <ol className="space-y-0.5">
            {system.map((l) => <li key={l.id} className="text-[11px] text-neutral-600">{time(l.at)} · {l.message}</li>)}
          </ol>
        </section>
      )}
      <Link href="/evals" className="block text-center text-xs text-blue-700 underline">How well does the checker decide? →</Link>
    </div>
  );
}
