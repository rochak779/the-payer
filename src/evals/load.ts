import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { PurchaseRequest, Rule } from '@/domain/types';
import { EvalCaseInput, type EvalCase } from './schema';

const REQUEST_DEFAULTS = {
  url: 'https://example.com/listing',
  purchaseDate: '2026-11-10',
  refundPolicy: 'Full refund within 30 days.',
  agentNote: '',
  listingText: '',
};

const readJson = (file: string): unknown => JSON.parse(fs.readFileSync(file, 'utf8'));

export function loadEvalSet(dir = path.join(process.cwd(), 'evals')): { rules: Rule[]; cases: EvalCase[] } {
  const rules = z.array(Rule).parse(readJson(path.join(dir, 'rules.json')));
  const raw = z.array(EvalCaseInput).parse(readJson(path.join(dir, 'cases.json')));
  const seen = new Set<string>();
  const cases = raw.map((c) => {
    if (seen.has(c.id)) throw new Error(`Duplicate eval case id: ${c.id}`);
    seen.add(c.id);
    const parsed = PurchaseRequest.safeParse({ ...REQUEST_DEFAULTS, ...c.request });
    if (!parsed.success) throw new Error(`Case ${c.id} has an invalid request: ${parsed.error.message}`);
    return { ...c, request: parsed.data };
  });
  return { rules, cases };
}
