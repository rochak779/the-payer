import type { Approval, Money } from '@/domain/types';
import type { GateResult } from './paymentGate';

export type IssuedCard = { id: string; last4: string };
export type ChargeResult = GateResult;

export interface CardIssuer {
  readonly name: 'fake' | 'stripe';
  /** One card per approved purchase, limited to that purchase. The agent never sees it. */
  issueCard(approval: Approval): Promise<IssuedCard>;
  /** Pretend the merchant charges the card. The only simulated step in the flow. */
  simulateCharge(input: { card: IssuedCard; amount: Money; merchant: string }): Promise<ChargeResult>;
  cancelCard(cardId: string): Promise<void>;
}
