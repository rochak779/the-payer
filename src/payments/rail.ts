import type { Approval, Money, RailName } from '@/domain/types';
import type { GateResult } from './paymentGate';

export type { RailName } from '@/domain/types';
export type PaymentHandle = { id: string; label: string };
export type ChargeResult = GateResult & { providerRef?: string };

export interface PaymentRail {
  readonly name: RailName;
  /** Sets up a one-time payment for exactly the approved total. The agent never sees it. */
  open(approval: Approval): Promise<PaymentHandle>;
  /** The shop asks to be paid. The payment check decides; the rail only moves money it approves. */
  charge(input: { handle: PaymentHandle; amount: Money; merchant: string }): Promise<ChargeResult>;
  cancel(handleId: string): Promise<void>;
}
