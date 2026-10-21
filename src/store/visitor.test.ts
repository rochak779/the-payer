import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { isValidVisitorId, newVisitorId, openVisitorStore, pruneVisitors, visitorStorePath } from './visitor';

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'payer-visitors-'));

describe('visitor ids', () => {
  it('rejects anything that is not exactly 24 lowercase letters or digits', () => {
    for (const bad of [undefined, '', '../../etc/passwd', 'A'.repeat(24), 'a'.repeat(23), 'a'.repeat(25), 'a'.repeat(23) + '/']) {
      expect(isValidVisitorId(bad)).toBe(false);
    }
  });

  it('accepts every id it makes', () => {
    for (let i = 0; i < 100; i++) expect(isValidVisitorId(newVisitorId())).toBe(true);
  });

  it('never turns an invalid id into a path', () => {
    const dir = tempDir();
    expect(() => visitorStorePath(dir, '../x')).toThrow();
    const file = visitorStorePath(dir, newVisitorId());
    expect(path.dirname(file)).toBe(dir);
  });
});

describe('visitor stores', () => {
  it('seeds the demo on first open', async () => {
    const dir = tempDir();
    const id = newVisitorId();
    const db = (await openVisitorStore(dir, id)).read();
    expect(fs.existsSync(visitorStorePath(dir, id))).toBe(true);
    expect(db.rules).toHaveLength(4);
    expect(db.settings.agentEnabled).toBe(true);
  });

  it('does not re-seed a visitor who already has data', async () => {
    const dir = tempDir();
    const id = newVisitorId();
    const first = await openVisitorStore(dir, id);
    first.update((db) => { db.rules = db.rules.slice(0, 1); });
    expect((await openVisitorStore(dir, id)).read().rules).toHaveLength(1);
  });

  it('keeps two visitors apart', async () => {
    const dir = tempDir();
    const a = await openVisitorStore(dir, newVisitorId());
    const b = await openVisitorStore(dir, newVisitorId());
    a.update((db) => { db.rules = []; });
    expect(a.read().rules).toHaveLength(0);
    expect(b.read().rules).toHaveLength(4);
  });

  it('pruning keeps only the newest files', async () => {
    const dir = tempDir();
    const ids = [newVisitorId(), newVisitorId(), newVisitorId()];
    for (const [i, id] of ids.entries()) {
      await openVisitorStore(dir, id);
      const t = new Date(Date.UTC(2026, 10, 1, 10, i));
      fs.utimesSync(visitorStorePath(dir, id), t, t);
    }
    pruneVisitors(dir, 2);
    expect(ids.map((id) => fs.existsSync(visitorStorePath(dir, id)))).toEqual([false, true, true]);
  });
});
