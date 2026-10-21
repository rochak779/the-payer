import fs from 'node:fs';
import path from 'node:path';
import { randomInt } from 'node:crypto';
import { cookies } from 'next/headers';
import { seedDemo } from '@/demo/demoContent';
import { createStore, defaultStore, emptyDb, type Store } from './store';

/** Hosted mode (HOSTED=1): each visitor gets their own seeded demo file, named by a random id in this cookie. */
export const VISITOR_COOKIE = 'payer_visitor';
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const ID = /^[a-z0-9]{24}$/;
const FILE = /^[a-z0-9]{24}\.json$/;
const KEEP_VISITORS = 300;

export function newVisitorId(): string {
  return Array.from({ length: 24 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
}

export function isValidVisitorId(id: string | undefined): id is string {
  return typeof id === 'string' && ID.test(id);
}

/** The only way a visitor id becomes a path: anything but a valid id throws, so a cookie can never name another file. */
export function visitorStorePath(dataDir: string, id: string): string {
  if (!isValidVisitorId(id)) throw new Error('Invalid visitor id');
  return path.join(dataDir, `${id}.json`);
}

/** Opens a visitor's file, seeding the demo the first time. */
export async function openVisitorStore(dataDir: string, id: string): Promise<Store> {
  const file = visitorStorePath(dataDir, id);
  const store = createStore(file);
  if (!fs.existsSync(file)) {
    const seeded = emptyDb();
    await seedDemo(seeded);
    store.update((db) => { Object.assign(db, seeded); });
  }
  return store;
}

/** Deletes the oldest visitor files beyond `keep`, so a public demo can't fill the disk. */
export function pruneVisitors(dataDir: string, keep: number): void {
  if (!fs.existsSync(dataDir)) return;
  const files = fs.readdirSync(dataDir)
    .filter((name) => FILE.test(name))
    .map((name) => ({ file: path.join(dataDir, name), mtime: fs.statSync(path.join(dataDir, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  for (const { file } of files.slice(keep)) fs.rmSync(file, { force: true });
}

const visitorsDir = () => path.join(process.cwd(), 'data', 'visitors');

/** This request's visitor id from the cookie, or null if it's missing or invalid. Hosted mode only. */
export async function currentVisitorId(): Promise<string | null> {
  const fromCookie = (await cookies()).get(VISITOR_COOKIE)?.value;
  return isValidVisitorId(fromCookie) ? fromCookie : null;
}

/** Locally: the one shared file. Hosted: this visitor's own file (the proxy sets the cookie before any page runs). */
export async function currentStore(): Promise<Store> {
  if (process.env.HOSTED !== '1') return defaultStore();
  // A missing id shouldn't happen after the proxy; a fresh id for this request only, never a shared file. Pruning removes it later.
  const id = (await currentVisitorId()) ?? newVisitorId();
  const dir = visitorsDir();
  const isNew = !fs.existsSync(visitorStorePath(dir, id));
  const store = await openVisitorStore(dir, id);
  if (isNew) pruneVisitors(dir, KEEP_VISITORS);
  return store;
}
