import Link from 'next/link';
import { ArrowIcon, CheckIcon } from '@/components/icons';
import { buttonClass, Nudge, ScreenTitle } from '@/components/ui';
import { formatMoney } from '@/domain/money';
import { defaultStore } from '@/store/store';
import { ApprovalReceipt } from './ApprovalReceipt';

export const dynamic = 'force-dynamic';

export default function ApprovalsPage() {
  const pending = defaultStore().read().approvals.filter((a) => a.status === 'pending').reverse();
  return (
    <div>
      <ScreenTitle before="Waiting for " script="you" />
      {pending.length === 0 ? (
        <div className="step-in flex flex-col items-center rounded-[20px] border border-dashed border-line px-6 py-10 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-forest/[0.08] text-forest">
            <CheckIcon width={22} height={22} strokeWidth={2.25} />
          </span>
          <p className="mt-3 text-[0.9375rem] font-semibold text-forest">Nothing to approve.</p>
          <Link href="/ask" className={buttonClass('quiet', 'md', 'mt-2')}>
            Ask the agent
            <Nudge><ArrowIcon width={16} height={16} strokeWidth={2} /></Nudge>
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {pending.map((a) => (
            <ApprovalReceipt
              key={a.id}
              id={a.id}
              item={a.request.item}
              merchant={a.request.merchant}
              amount={formatMoney(a.request.total)}
              summary={a.decision.summary}
              reasons={a.decision.reasons.filter((r) => r.outcome !== 'approve')}
              refundPolicy={a.request.refundPolicy}
              url={a.request.url}
            />
          ))}
        </div>
      )}
    </div>
  );
}
