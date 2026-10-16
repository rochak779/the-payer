import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStore, type Store } from '@/store/store';

export function tempStore(): Store {
  return createStore(path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'am-')), 'db.json'));
}
