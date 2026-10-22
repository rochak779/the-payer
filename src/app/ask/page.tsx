import { disconnectPayPal, finishPayPal } from '@/app/actions';
import { CardIcon } from '@/components/icons';
import { Button, Note, Panel, ScreenTitle } from '@/components/ui';
import { paymentsName } from '@/deps';
import { SUGGESTED_TASKS } from '@/demo/demoContent';
import { vaultIdFor } from '@/integrations/paypal/vault';
import { currentStore } from '@/store/visitor';
import { AskAgent } from './AskAgent';
import { ConnectPayPalButton, FinishPayPalButton } from './ConnectPayPalButton';

export default async function AskPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { paypal } = await searchParams;
  return (
    <div>
      <ScreenTitle before="Ask the " highlight="agent">
        The agent finds an option and asks to buy it. It never sees how you pay.
      </ScreenTitle>
      {paymentsName() === 'paypal' && <PayPalStrip result={paypal} />}
      <AskAgent suggestions={SUGGESTED_TASKS} />
    </div>
  );
}

const RESULT_NOTE: Record<string, { tone: 'ok' | 'error'; text: string }> = {
  connected: { tone: 'ok', text: 'PayPal connected. Approved purchases are paid from it.' },
  waiting: { tone: 'error', text: "PayPal hasn't recorded your approval yet. Approve in the PayPal tab, then finish here." },
  cancelled: { tone: 'error', text: "PayPal wasn't connected. Nothing changed." },
};

/** Which PayPal pays for approved purchases: the person's own, one waiting for their approval, the sandbox demo buyer, or none yet. */
async function PayPalStrip({ result }: { result: string | string[] | undefined }) {
  const db = (await currentStore()).read();
  const own = db.settings.paypal;
  const pending = !own && db.settings.paypalPending;
  const demo = !own && vaultIdFor(db) !== null;
  const note = typeof result === 'string' ? RESULT_NOTE[result] : undefined;
  return (
    <div className="mb-6 space-y-2">
      <Panel className="flex flex-wrap items-center gap-3 px-4 py-3">
        <CardIcon width={18} height={18} className="shrink-0 text-ink" />
        <p className="min-w-0 flex-1 text-sm text-ink">
          {own ? 'PayPal connected.'
            : pending ? 'Approve on PayPal in the new tab, then come back and finish.'
            : demo ? 'Using the demo PayPal buyer (sandbox).'
            : 'Connect PayPal once so the agent can pay for purchases you approve.'}
        </p>
        {own ? (
          <form action={disconnectPayPal}><Button size="sm" variant="secondary">Disconnect</Button></form>
        ) : pending ? (
          <>
            <a href={pending.approveUrl} target="_blank" rel="noopener noreferrer" className="text-[0.8125rem] font-[650] text-ink underline decoration-yellow decoration-[3px] underline-offset-4 hover:decoration-ink">
              Open PayPal again
            </a>
            <form action={disconnectPayPal}><Button size="sm" variant="quiet">Cancel</Button></form>
            <form action={finishPayPal}><FinishPayPalButton /></form>
          </>
        ) : (
          <ConnectPayPalButton label={demo ? 'Connect your own PayPal' : 'Connect PayPal'} variant={demo ? 'secondary' : 'primary'} />
        )}
      </Panel>
      {note && <Note tone={note.tone}>{note.text}</Note>}
    </div>
  );
}
