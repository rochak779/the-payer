import { describe, expect, it } from 'vitest';
import type { Decision } from '@/domain/types';
import { makeRequest } from '@/test/factories';
import { tempStore } from '@/test/tempStore';
import { recordDecision, userDecides } from './approvals';

const now = new Date('2026-11-10T10:00:00Z');
const decision = (outcome: Decision['outcome']): Decision => ({
  outcome, reasons: [], summary: outcome === 'approve' ? 'Within all your rules.' : 'Because.', checker: 'test',
});

describe('recordDecision', () => {
  it('auto-approves with a 30-minute window and logs it', () => {
    const store = tempStore();
    const a = recordDecision(store, makeRequest(), decision('approve'), now);
    expect(a).toMatchObject({ status: 'approved', approvedBy: 'rules', expiresAt: '2026-11-10T10:30:00.000Z' });
    const db = store.read();
    expect(db.approvals).toHaveLength(1);
    expect(db.log[0]).toMatchObject({ type: 'decision', approvalId: a.id });
    expect(db.log[0].message).toBe('Approved: Hotel Lisboa Plaza, 2 nights at Hotel Lisboa Plaza for £240. Within all your rules.');
  });

  it('leaves an ask pending and a block blocked', () => {
    const store = tempStore();
    expect(recordDecision(store, makeRequest(), decision('ask'), now)).toMatchObject({ status: 'pending', expiresAt: null, decidedAt: null });
    expect(recordDecision(store, makeRequest(), decision('block'), now).status).toBe('blocked');
  });
});

describe('userDecides', () => {
  it('approves a pending purchase with a fresh 30-minute window', () => {
    const store = tempStore();
    const a = recordDecision(store, makeRequest(), decision('ask'), now);
    const later = new Date('2026-11-10T11:00:00Z');
    expect(userDecides(store, a.id, 'approve', later)).toMatchObject({ status: 'approved', approvedBy: 'user', expiresAt: '2026-11-10T11:30:00.000Z' });
    expect(store.read().log.at(-1)?.type).toBe('user_approved');
  });

  it('declines a pending purchase', () => {
    const store = tempStore();
    const a = recordDecision(store, makeRequest(), decision('ask'), now);
    expect(userDecides(store, a.id, 'decline', now).status).toBe('declined');
    expect(store.read().log.at(-1)?.type).toBe('user_declined');
  });

  it('refuses to decide twice or on an unknown id', () => {
    const store = tempStore();
    const a = recordDecision(store, makeRequest(), decision('ask'), now);
    userDecides(store, a.id, 'decline', now);
    expect(() => userDecides(store, a.id, 'approve', now)).toThrow('already declined');
    expect(() => userDecides(store, 'apv_nope', 'approve', now)).toThrow('No purchase');
  });
});
