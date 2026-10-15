import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadEvalSet } from './load';

describe('loadEvalSet', () => {
  it('loads the real eval set and fills request defaults', () => {
    const { rules, cases } = loadEvalSet();
    expect(rules.length).toBeGreaterThanOrEqual(9);
    expect(cases.length).toBeGreaterThanOrEqual(10);
    const train = cases.find((c) => c.id === 'within-02')!;
    expect(train.request.purchaseDate).toBe('2026-11-10');
    expect(train.split).toBe('dev');
  });

  it('rejects duplicate ids', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'am-evals-'));
    fs.copyFileSync(path.join(process.cwd(), 'evals', 'rules.json'), path.join(dir, 'rules.json'));
    const one = { id: 'within-01', category: 'within', expected: 'approve', why: 'duplicate',
      request: { item: 'x', merchant: 'y', category: 'other', total: { minor: 1, currency: 'GBP' } } };
    fs.writeFileSync(path.join(dir, 'cases.json'), JSON.stringify([one, one]));
    expect(() => loadEvalSet(dir)).toThrow('Duplicate eval case id: within-01');
  });

  it('covers every category with at least 6 cases once complete', () => {
    const { cases } = loadEvalSet();
    const counts = new Map<string, number>();
    for (const c of cases) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
    for (const cat of ['within', 'against', 'ambiguous', 'conflict']) expect(counts.get(cat)).toBeGreaterThanOrEqual(6);
  });
});
