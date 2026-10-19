'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from './ui';

/** A form button that shows a spinner on itself, not its siblings, while the form submits. */
export function SubmitButton({ name, value, children }: { name: string; value: string; children: ReactNode }) {
  const { pending, data } = useFormStatus();
  const mine = pending && data?.get(name) === value;
  return (
    <Button variant="secondary" size="xs" name={name} value={value} disabled={pending} busy={mine}>
      {children}
    </Button>
  );
}
