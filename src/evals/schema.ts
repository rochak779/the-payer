import { z } from 'zod';
import { Outcome, type PurchaseRequest } from '@/domain/types';

export const EvalCategory = z.enum([
  'within', 'against', 'ambiguous', 'conflict', 'price_edge', 'refund_wording', 'gifts_others', 'injection',
]);
export type EvalCategory = z.infer<typeof EvalCategory>;

export const EvalCaseInput = z.object({
  id: z.string().regex(/^[a-z]+-\d{2}$/),
  category: EvalCategory,
  split: z.enum(['dev', 'test']).default('dev'),
  expected: Outcome,
  why: z.string().min(5),
  source: z.string().optional(),
  request: z.record(z.string(), z.unknown()),
});

export type EvalCase = Omit<z.infer<typeof EvalCaseInput>, 'request'> & { request: PurchaseRequest };
