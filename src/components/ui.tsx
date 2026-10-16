import type { ReactNode } from 'react';
import { OUTCOME_LABEL } from '@/domain/labels';
import type { Outcome } from '@/domain/types';

export function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">{children}</div>;
}

const TONE: Record<Outcome, string> = {
  approve: 'bg-emerald-100 text-emerald-800',
  ask: 'bg-amber-100 text-amber-800',
  block: 'bg-red-100 text-red-800',
};

export function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TONE[outcome]}`}>{OUTCOME_LABEL[outcome]}</span>;
}
