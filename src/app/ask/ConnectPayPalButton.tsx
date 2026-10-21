'use client';

import { useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { connectPayPal } from '@/app/actions';
import { Button, Note } from '@/components/ui';

/** Opens PayPal's approve page in a new tab, so this tab stays put for "Finish connecting". */
export function ConnectPayPalButton({ label, variant }: { label: string; variant: 'primary' | 'secondary' }) {
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const connect = () => {
    setError(null);
    // Opened inside the click, before any await, so pop-up blockers allow it; PayPal's page is loaded into it below.
    const tab = window.open('', '_blank');
    if (tab) tab.opener = null;
    start(async () => {
      const result = await connectPayPal();
      if ('error' in result) {
        tab?.close();
        setError(result.error);
      } else if (tab) {
        tab.location.href = result.approveUrl;
      } else {
        window.location.href = result.approveUrl; // pop-ups blocked: use this tab, and come back to finish
      }
    });
  };

  return (
    <>
      <Button size="sm" variant={variant} busy={busy} disabled={busy} onClick={connect}>{label}</Button>
      {error && <Note tone="error">{error}</Note>}
    </>
  );
}

/** "Finish connecting" takes a couple of seconds (two PayPal calls): a spinner, and no second submit. */
export function FinishPayPalButton() {
  const { pending } = useFormStatus();
  return <Button size="sm" busy={pending} disabled={pending}>Finish connecting</Button>;
}
