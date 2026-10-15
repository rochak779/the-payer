import fs from 'node:fs';
import path from 'node:path';
import type { Approval, LogEntry, Rule, Run, Settings } from '@/domain/types';

export type Db = { rules: Rule[]; approvals: Approval[]; log: LogEntry[]; runs: Run[]; settings: Settings };
export type Store = { read(): Db; update<T>(fn: (db: Db) => T): T };

export function emptyDb(): Db {
  return { rules: [], approvals: [], log: [], runs: [], settings: { agentEnabled: true } };
}

/** One JSON file. Writes are synchronous and atomic (write temp, then rename), which is enough for one local user. */
export function createStore(filePath: string): Store {
  const read = (): Db =>
    fs.existsSync(filePath) ? { ...emptyDb(), ...JSON.parse(fs.readFileSync(filePath, 'utf8')) } : emptyDb();

  const write = (db: Db) => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
    fs.renameSync(tmp, filePath);
  };

  return {
    read,
    update(fn) {
      const db = read();
      const result = fn(db);
      write(db);
      return result;
    },
  };
}

export function defaultStore(): Store {
  return createStore(process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'db.json'));
}
