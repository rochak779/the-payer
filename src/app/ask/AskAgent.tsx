'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition, type ComponentType, type SVGProps } from 'react';
import { startTask } from '@/app/actions';
import { AgentIcon, AlertIcon, ArrowIcon, BagIcon, CardIcon, SearchIcon, StampIcon } from '@/components/icons';
import { Button, buttonClass, CHIP, FIELD, Note, Nudge, ReasonLines, Receipt, ReceiptHead, ReceiptSection, Stamp, stampFor } from '@/components/ui';
import { OUTCOME_LABEL, STATUS_LABEL } from '@/domain/labels';
import { formatMoney } from '@/domain/money';
import type { RunEvent } from '@/domain/types';
import type { RunPurchase, RunView } from '@/flow/runs';

/** The icon says what kind of step it is; a few kinds also lead with a word, inline. */
const KIND: Record<string, { lead?: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }> = {
  status: { Icon: AgentIcon },
  search: { lead: 'Searched', Icon: SearchIcon },
  request: { Icon: BagIcon },
  decision: { lead: 'Checker', Icon: StampIcon },
  error: { lead: 'Error', Icon: AlertIcon },
};

/** A search result arrives as "Title (url)": show the title, keep the link. */
const splitFound = (text: string) => {
  const m = text.match(/^(.*) \((https?:\/\/[^)]+)\)$/);
  return m ? { name: m[1], url: m[2] } : { name: text, url: null };
};

/** A decision event's own purchase: its text is the outcome label and summary the checker gave. */
function purchaseFor(e: RunEvent, purchases: RunPurchase[], used: Set<string>): RunPurchase | undefined {
  const match = purchases.find((p) => !used.has(p.id) && e.text === `${OUTCOME_LABEL[p.outcome]}: ${p.summary}`);
  if (match) used.add(match.id);
  return match;
}

function RunReceipt({ p }: { p: RunPurchase }) {
  const shown = p.reasons.filter((r) => r.outcome !== 'approve');
  return (
    <Receipt className="step-in">
      <ReceiptHead title={p.item} sub={`${p.merchant} · ${STATUS_LABEL[p.status]}`} amount={formatMoney(p.total)} />
      <ReceiptSection className="space-y-3">
        <Stamp outcome={stampFor(p.status, p.outcome)} land />
        <ReasonLines reasons={shown} fallback={p.summary} />
      </ReceiptSection>
      {p.paymentLabel && (
        <ReceiptSection className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink-soft">
          <CardIcon width={18} height={18} />
          {p.paymentLabel}
        </ReceiptSection>
      )}
    </Receipt>
  );
}

function Step({ e }: { e: RunEvent }) {
  if (e.kind === 'found') {
    const { name, url } = splitFound(e.text);
    return (
      <li className="step-in truncate pl-10 text-[0.8125rem] text-muted">
        {url ? <a href={url} target="_blank" rel="noreferrer" title={url} className="hover:text-forest hover:underline">{name}</a> : name}
      </li>
    );
  }
  const { lead, Icon } = KIND[e.kind] ?? KIND.status;
  const error = e.kind === 'error';
  return (
    <li className="step-in relative flex items-start gap-3">
      <span className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full ring-4 ring-cream ${error ? 'bg-peach text-orange-ink' : 'bg-forest/[0.08] text-forest'}`}>
        <Icon width={15} height={15} strokeWidth={2} />
      </span>
      <p className={`min-w-0 pt-1 text-sm leading-relaxed ${error ? 'text-orange-ink' : 'text-slate'}`}>
        {lead && <span className={`font-bold ${error ? '' : 'text-forest'}`}>{lead}: </span>}
        {e.text}
      </p>
    </li>
  );
}

/** `suggestions` come from the server: the demo module uses Node's crypto, so the browser can't import it. */
export function AskAgent({ suggestions }: { suggestions: readonly string[] }) {
  const [task, setTask] = useState('');
  const [runId, setRunId] = useState<string | null>(null);
  const [run, setRun] = useState<RunView | null>(null);
  const [error, setError] = useState('');
  const [starting, startTransition] = useTransition();

  useEffect(() => {
    if (!runId) return;
    let stopped = false;
    const poll = async () => {
      const res = await fetch(`/api/runs/${runId}`, { cache: 'no-store' });
      if (stopped || !res.ok) return;
      const next = (await res.json()) as RunView;
      setRun(next);
      if (next.status === 'running') setTimeout(poll, 1000);
    };
    void poll();
    return () => { stopped = true; };
  }, [runId]);

  const busy = starting || run?.status === 'running';
  const waitingForYou = run?.approvals.some((a) => a.status === 'pending');

  const submit = () =>
    startTransition(async () => {
      setError('');
      setRun(null);
      try {
        setRunId(await startTask(task));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    });

  const used = new Set<string>();

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label htmlFor="task" className="sr-only">What should the agent buy?</label>
        <textarea
          id="task"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !busy && task.trim()) submit(); }}
          rows={3}
          placeholder="What should the agent buy?"
          className={FIELD}
        />
        <div className="flex flex-wrap gap-2">
          {suggestions.map((ex) => (
            <button key={ex} type="button" onClick={() => setTask(ex)} aria-pressed={task === ex} className={`${CHIP} ${task === ex ? 'bg-peach ring-orange-soft' : ''}`}>
              {ex}
            </button>
          ))}
        </div>
        <Button className="w-full" busy={busy} disabled={busy || !task.trim()} onClick={submit}>
          {busy ? 'Agent is working…' : 'Send to agent'}
          {!busy && <Nudge><ArrowIcon width={18} height={18} strokeWidth={2} /></Nudge>}
        </Button>
        {error && <Note tone="error">{error}</Note>}
      </div>

      {run && (
        <section aria-live="polite" aria-label="Agent progress" className="space-y-4">
          <ol className="relative space-y-3 before:absolute before:bottom-3 before:left-[13px] before:top-3 before:w-px before:bg-line">
            {run.events.map((e, i) => {
              const p = e.kind === 'decision' ? purchaseFor(e, run.approvals, used) : undefined;
              return p ? <li key={i} className="relative z-10 py-1"><RunReceipt p={p} /></li> : <Step key={i} e={e} />;
            })}
            {run.status === 'running' && (
              <li className="relative flex items-center gap-3">
                <span className="thinking relative z-10 flex size-7 items-center justify-center gap-[3px] rounded-full bg-forest/[0.08] ring-4 ring-cream">
                  <span className="size-1 rounded-full bg-forest" />
                  <span className="size-1 rounded-full bg-forest" />
                  <span className="size-1 rounded-full bg-forest" />
                </span>
                <span className="text-sm text-muted">Working…</span>
              </li>
            )}
          </ol>
          {waitingForYou && (
            <Link href="/approvals" className={buttonClass('needs', 'lg', 'step-in w-full')}>
              Review in Approvals
              <Nudge><ArrowIcon width={18} height={18} strokeWidth={2} /></Nudge>
            </Link>
          )}
          {run.status !== 'running' && !waitingForYou && (
            <Link href="/activity" className={buttonClass('quiet', 'md', 'step-in w-full')}>
              See it in the activity log
              <Nudge><ArrowIcon width={16} height={16} strokeWidth={2} /></Nudge>
            </Link>
          )}
        </section>
      )}
    </div>
  );
}
