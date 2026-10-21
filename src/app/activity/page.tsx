import Link from 'next/link';
import { demoCharge } from '@/app/actions';
import { ArrowIcon, CardIcon, ChartIcon } from '@/components/icons';
import { SubmitButton } from '@/components/SubmitButton';
import { buttonClass, Nudge, Panel, ReasonLines, Receipt, ReceiptHead, ReceiptSection, ScreenTitle, Stamp, stampFor } from '@/components/ui';
import { STATUS_LABEL } from '@/domain/labels';
import { formatMoney } from '@/domain/money';
import type { Approval, LogEntry } from '@/domain/types';
import { currentStore } from '@/store/visitor';
import { AgentSwitch } from './AgentSwitch';

export const dynamic = 'force-dynamic';

const time = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

function LogLines({ log }: { log: LogEntry[] }) {
  return (
    <ol className="space-y-1.5">
      {log.map((l) => (
        <li key={l.id} className="flex gap-2.5 text-[0.75rem] leading-relaxed text-ink-soft">
          <span className="shrink-0 font-semibold text-muted tabular-nums">{time(l.at)}</span>
          <span className="min-w-0">{l.message}</span>
        </li>
      ))}
    </ol>
  );
}

function PurchaseEntry({ approval: a, log }: { approval: Approval; log: LogEntry[] }) {
  const shown = a.decision.reasons.filter((r) => r.outcome !== 'approve');
  return (
    <Receipt>
      <ReceiptHead title={a.request.item} sub={`${a.request.merchant} · ${STATUS_LABEL[a.status]}`} amount={formatMoney(a.request.total)} />
      <ReceiptSection className="space-y-3">
        <Stamp outcome={stampFor(a.status, a.decision.outcome)} />
        <ReasonLines reasons={shown} fallback={a.decision.summary} />
      </ReceiptSection>
      {a.payment && (
        <ReceiptSection className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink-soft">
          <CardIcon width={18} height={18} />
          {a.payment.label}
        </ReceiptSection>
      )}
      {log.length > 0 && (
        <ReceiptSection>
          <LogLines log={log} />
        </ReceiptSection>
      )}
      {a.payment && (
        <ReceiptSection>
          <form action={demoCharge}>
            <input type="hidden" name="id" value={a.id} />
            <p className="mb-2 text-[0.75rem] font-semibold text-ink-soft">Demo: what if…</p>
            <div className="flex flex-wrap gap-1.5">
              <SubmitButton name="kind" value="more">Shop asks for {formatMoney({ ...a.request.total, minor: 2000 })} more</SubmitButton>
              <SubmitButton name="kind" value="other_merchant">Another shop asks</SubmitButton>
              <SubmitButton name="kind" value="repeat">Shop asks again</SubmitButton>
            </div>
            {a.payment.provider === 'paypal' && (
              <p className="mt-2.5 text-[0.75rem] leading-relaxed text-muted">
                On its own, PayPal lets a shop take up to 15% more than was held (capped at $75). Your mandate holds it to the penny.
              </p>
            )}
          </form>
        </ReceiptSection>
      )}
    </Receipt>
  );
}

export default async function ActivityPage() {
  const db = (await currentStore()).read();
  const purchases = [...db.approvals].reverse();
  const system = db.log.filter((l) => l.approvalId === null).reverse().slice(0, 10);
  const on = db.settings.agentEnabled;
  return (
    <div className="space-y-5">
      <ScreenTitle script="Activity" />
      <Panel className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-[0.9375rem] font-bold text-forest">Agent is {on ? 'on' : 'off'}</p>
          <p className="text-[0.8125rem] leading-snug text-muted">Turning it off cancels every open approval and payment.</p>
        </div>
        <AgentSwitch on={on} />
      </Panel>
      {purchases.length === 0 && (
        <p className="rounded-[20px] border border-dashed border-line px-4 py-6 text-center text-sm text-muted">No purchases yet.</p>
      )}
      {purchases.map((a) => <PurchaseEntry key={a.id} approval={a} log={db.log.filter((l) => l.approvalId === a.id)} />)}
      {system.length > 0 && (
        <section className="space-y-2 pt-1">
          <h3 className="text-sm font-bold text-forest">Other events</h3>
          <LogLines log={system} />
        </section>
      )}
      <Link href="/evals" className={buttonClass('secondary', 'md', 'w-full')}>
        <ChartIcon width={17} height={17} />
        How well does the checker decide?
        <Nudge><ArrowIcon width={16} height={16} strokeWidth={2} /></Nudge>
      </Link>
    </div>
  );
}
