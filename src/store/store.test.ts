import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createStore } from './store';

function tempFile() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'am-store-')), 'nested', 'db.json');
}

describe('store', () => {
  it('starts empty with the agent switched on', () => {
    const db = createStore(tempFile()).read();
    expect(db).toEqual({ rules: [], approvals: [], log: [], runs: [], settings: { agentEnabled: true, paypal: null, paypalPending: null } });
  });

  it('persists updates across store instances and leaves no temp file', () => {
    const file = tempFile();
    createStore(file).update((db) => { db.settings.agentEnabled = false; });
    expect(createStore(file).read().settings.agentEnabled).toBe(false);
    expect(fs.existsSync(`${file}.tmp`)).toBe(false);
  });

  it('does not write anything when the update function throws', () => {
    const file = tempFile();
    const store = createStore(file);
    expect(() => store.update(() => { throw new Error('boom'); })).toThrow('boom');
    expect(fs.existsSync(file)).toBe(false);
  });
});
