import Link from 'next/link';
import { ArrowIcon, CheckIcon } from '@/components/icons';
import { buttonClass, EMPTY, Nudge, ScreenTitle } from '@/components/ui';
import { formatMoney } from '@/domain/money';
import { currentStore } from '@/store/visitor';
import { ApprovalReceipt } from './ApprovalReceipt';

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
  const pending = (await currentStore()).read().approvals.filter((a) => a.status === 'pending').reverse();
  return (
    <div>
      <ScreenTitle before="Waiting for " highlight="you" />
      {pending.length === 0 ? (
        <div className={`step-in flex flex-col items-center ${EMPTY} px-6 py-10`}>
          <span className="flex size-11 items-center justify-center rounded-full border border-ink bg-mint text-ink">
            <CheckIcon width={22} height={22} strokeWidth={2.25} />
          </span>
          <p className="mt-3 font-display text-lg font-extrabold tracking-[-0.02em] text-ink">Nothing to approve.</p>
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
