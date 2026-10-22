'use client';

import { useState, useTransition } from 'react';
import { decideApproval } from '@/app/actions';
import { CheckIcon, ExternalIcon } from '@/components/icons';
import { Button, ReasonLines, Receipt, ReceiptHead, ReceiptSection, Stamp } from '@/components/ui';
import type { Reason } from '@/domain/types';

type Props = { id: string; item: string; merchant: string; amount: string; summary: string; reasons: Reason[]; refundPolicy: string; url: string };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function ApprovalReceipt({ id, item, merchant, amount, summary, reasons, refundPolicy, url }: Props) {
  const [choice, setChoice] = useState<'approve' | 'decline' | null>(null);
  const [pending, startTransition] = useTransition();

  // The new stamp lands first, so the decision is seen before the receipt leaves the list.
  const decide = (c: 'approve' | 'decline') => {
    setChoice(c);
    startTransition(async () => {
      const form = new FormData();
      form.set('id', id);
      form.set('choice', c);
      await Promise.all([decideApproval(form), wait(650)]);
    });
  };

  return (
    <Receipt className="step-in" tone={choice === null ? 'ask' : choice === 'approve' ? 'approve' : 'declined'}>
      <ReceiptHead title={item} sub={`Agent wants to spend ${amount} at ${merchant}`} amount={amount} />
      <ReceiptSection className="space-y-3">
        {choice === null ? <Stamp outcome="ask" /> : <Stamp key={choice} outcome={choice === 'approve' ? 'approve' : 'declined'} land />}
        {choice === null && <p className="text-[0.8125rem] font-bold text-ink">Asking because:</p>}
        <ReasonLines reasons={reasons} fallback={summary} />
        {refundPolicy && <p className="text-[0.8125rem] leading-relaxed text-muted">Refunds: {refundPolicy}</p>}
        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[0.8125rem] font-[650] text-ink underline decoration-yellow decoration-[3px] underline-offset-4 transition-colors duration-200 hover:decoration-ink">
          View listing <ExternalIcon width={15} height={15} strokeWidth={2} />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </ReceiptSection>
      <ReceiptSection className="grid grid-cols-2 gap-2.5">
        <Button variant="secondary" size="md" disabled={pending} busy={pending && choice === 'decline'} onClick={() => decide('decline')}>
          Decline
        </Button>
        <Button size="md" disabled={pending} busy={pending && choice === 'approve'} onClick={() => decide('approve')}>
          {!(pending && choice === 'approve') && <CheckIcon width={17} height={17} strokeWidth={2.25} />}
          Approve
        </Button>
      </ReceiptSection>
    </Receipt>
  );
}
