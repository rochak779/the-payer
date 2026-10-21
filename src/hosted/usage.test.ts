import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getDeps } from '@/deps';
import { DEFAULT_LIMITS, limitsFromEnv, takeAllowance } from './usage';

const usageFile = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'payer-usage-')), 'usage.json');
const day1 = new Date('2026-12-01T10:00:00Z');
const take = (file: string, visitor: string, now = day1, kind: 'task' | 'preview' = 'task') => takeAllowance(file, kind, visitor, now, DEFAULT_LIMITS);

describe('takeAllowance', () => {
  it("allows a visitor's 8 tasks a day, refuses the 9th, and still allows another visitor", () => {
    const file = usageFile();
    expect(Array.from({ length: 8 }, () => take(file, 'a'))).toEqual(Array(8).fill(true));
    expect(take(file, 'a')).toBe(false);
    expect(take(file, 'b')).toBe(true);
  });

  it('refuses the 31st task of the day across all visitors', () => {
    const file = usageFile();
    for (let i = 0; i < 30; i++) expect(take(file, `visitor${i}`)).toBe(true);
    expect(take(file, 'visitor30')).toBe(false);
  });

  it('starts counting again on the next UTC day', () => {
    const file = usageFile();
    const lateNight = new Date('2026-12-01T23:59:00Z');
    for (let i = 0; i < 8; i++) take(file, 'a', lateNight);
    expect(take(file, 'a', lateNight)).toBe(false);
    expect(take(file, 'a', new Date('2026-12-02T00:01:00Z'))).toBe(true);
  });

  it('counts previews separately from tasks', () => {
    const file = usageFile();
    for (let i = 0; i < 8; i++) take(file, 'a');
    expect(take(file, 'a')).toBe(false);
    expect(Array.from({ length: 20 }, () => take(file, 'a', day1, 'preview'))).toEqual(Array(20).fill(true));
    expect(take(file, 'a', day1, 'preview')).toBe(false);
    expect(take(file, 'b')).toBe(true);
  });

  it('treats an unreadable file as zero and rewrites it', () => {
    const file = usageFile();
    fs.writeFileSync(file, 'not json');
    expect(take(file, 'a')).toBe(true);
    expect(() => JSON.parse(fs.readFileSync(file, 'utf8'))).not.toThrow();
  });
});

describe('limitsFromEnv', () => {
  it('reads whole numbers and ignores anything else', () => {
    expect(limitsFromEnv({ LIMIT_TASKS_PER_DAY: '2' })).toEqual({ ...DEFAULT_LIMITS, tasksPerDay: 2 });
    expect(limitsFromEnv({ LIMIT_TASKS_PER_DAY: 'lots', LIMIT_TASKS_PER_VISITOR: '-1', LIMIT_PREVIEWS_PER_VISITOR: '' })).toEqual(DEFAULT_LIMITS);
  });
});

describe('getDeps({ live: false })', () => {
  const before = process.env.SHOPPER;
  afterEach(() => {
    if (before === undefined) delete process.env.SHOPPER;
    else process.env.SHOPPER = before;
  });

  it('uses the offline agent even when a live one is configured', async () => {
    process.env.SHOPPER = 'gemini';
    const deps = await getDeps({ live: false });
    expect(deps.shopper.name).toBe('scripted');
    expect(deps.search.name).toBe('fixtures');
  });
});
