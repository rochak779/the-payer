import { describe, expect, it } from 'vitest';
import { recordDecision } from '@/approvals/approvals';
import type { Outcome } from '@/domain/types';
import { makeRequest } from '@/test/factories';
import { tempStore } from '@/test/tempStore';
import { checkCharge } from './paymentGate';

const now = new Date('2026-11-10T10:00:00Z');
const gbp = (minor: number) => ({ minor, currency: 'GBP' as const });
const MERCHANT = 'Hotel Lisboa Plaza';

function purchase(outcome: Outcome = 'approve') {
  const store = tempStore();
  const a = recordDecision(store, makeRequest(), { outcome, reasons: [], summary: 'x', checker: 'test' }, now);
  return { store, a };
}

describe('checkCharge', () => {
  it('approves the exact approved charge once, then treats the payment as used', () => {
    const { store, a } = purchase();
    expect(checkCharge(store, { approvalId: a.id, amount: gbp(24000), merchant: MERCHANT }, now)).toEqual({ approved: true, reasons: [] });
    expect(store.read().approvals[0].status).toBe('used');
    const again = checkCharge(store, { approvalId: a.id, amount: gbp(24000), merchant: MERCHANT }, now);
    expect(again.approved).toBe(false);
    expect(again.reasons).toContain('This one-time payment has already been used.');
  });

  it('allows a smaller charge and a differently written merchant name', () => {
    const { store, a } = purchase();
    expect(checkCharge(store, { approvalId: a.id, amount: gbp(20000), merchant: 'HOTEL LISBOA PLAZA LTD' }, now).approved).toBe(true);
  });

  it('declines £20 more than approved', () => {
    const { store, a } = purchase();
    const r = checkCharge(store, { approvalId: a.id, amount: gbp(26000), merchant: MERCHANT }, now);
    expect(r).toEqual({ approved: false, reasons: ['£260 is more than the approved £240.'] });
  });

  it('declines a different merchant, and lists every problem at once', () => {
    const { store, a } = purchase();
    const r = checkCharge(store, { approvalId: a.id, amount: gbp(26000), merchant: 'Totally Legit Electronics Ltd' }, now);
    expect(r.approved).toBe(false);
    expect(r.reasons).toHaveLength(2);
    expect(r.reasons[1]).toContain("isn't the approved merchant");
  });

  it('declines after the approval expires', () => {
    const { store, a } = purchase();
    const late = new Date('2026-11-10T10:31:00Z');
    expect(checkCharge(store, { approvalId: a.id, amount: gbp(24000), merchant: MERCHANT }, late).reasons).toEqual(['The approval has expired.']);
  });

  it('declines everything when the agent is off', () => {
    const { store, a } = purchase();
    store.update((db) => { db.settings.agentEnabled = false; });
    expect(checkCharge(store, { approvalId: a.id, amount: gbp(24000), merchant: MERCHANT }, now).reasons).toContain('The agent is turned off.');
  });

  it('declines a currency mismatch', () => {
    const { store, a } = purchase();
    expect(checkCharge(store, { approvalId: a.id, amount: { minor: 24000, currency: 'EUR' }, merchant: MERCHANT }, now).approved).toBe(false);
  });

  it('declines pending and blocked purchases', () => {
    const p = purchase('ask');
    expect(checkCharge(p.store, { approvalId: p.a.id, amount: gbp(24000), merchant: MERCHANT }, now).reasons).toEqual(['This purchase is pending, not approved.']);
    const b = purchase('block');
    expect(checkCharge(b.store, { approvalId: b.a.id, amount: gbp(24000), merchant: MERCHANT }, now).approved).toBe(false);
  });

  it('declines a charge with no matching approval and still logs it', () => {
    const { store } = purchase();
    expect(checkCharge(store, { approvalId: null, amount: gbp(100), merchant: MERCHANT }, now)).toEqual({ approved: false, reasons: ['No approved purchase matches this payment.'] });
    expect(store.read().log.at(-1)).toMatchObject({ type: 'charge_declined', approvalId: null });
  });
});
