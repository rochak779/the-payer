import { decideApproval } from '@/app/actions';
import { Card } from '@/components/ui';
import { formatMoney } from '@/domain/money';
import { defaultStore } from '@/store/store';

export const dynamic = 'force-dynamic';

export default function ApprovalsPage() {
  const pending = defaultStore().read().approvals.filter((a) => a.status === 'pending').reverse();
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">Waiting for you</h2>
      {pending.length === 0 && <p className="text-sm text-neutral-500">Nothing to approve.</p>}
      {pending.map((a) => (
        <Card key={a.id}>
          <p className="text-sm font-semibold">Agent wants to spend {formatMoney(a.request.total)} at {a.request.merchant}</p>
          <p className="text-sm text-neutral-600">{a.request.item}</p>
          <p className="mt-3 text-sm"><span className="font-medium">Asking because:</span> {a.decision.summary}</p>
          {a.request.refundPolicy && <p className="mt-1 text-xs text-neutral-500">Refunds: {a.request.refundPolicy}</p>}
          <a href={a.request.url} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-blue-700 underline">View listing</a>
          <form action={decideApproval} className="mt-4 grid grid-cols-2 gap-2">
            <input type="hidden" name="id" value={a.id} />
            <button name="choice" value="decline" className="rounded-full py-2 text-sm ring-1 ring-neutral-300">Decline</button>
            <button name="choice" value="approve" className="rounded-full bg-neutral-900 py-2 text-sm font-medium text-white">Approve</button>
          </form>
        </Card>
      ))}
    </div>
  );
}
