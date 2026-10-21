import fs from 'node:fs';
import path from 'node:path';

/** Daily caps on live AI use in the hosted demo. Past a cap, runs use the offline agent instead of failing. */
export type Limits = { tasksPerVisitorPerDay: number; tasksPerDay: number; previewsPerVisitorPerDay: number };
export const DEFAULT_LIMITS: Limits = { tasksPerVisitorPerDay: 8, tasksPerDay: 30, previewsPerVisitorPerDay: 20 };
export const OFFLINE_NOTICE = "Today's live AI limit is used up, so this run uses the offline demo agent. Payments still go through PayPal's sandbox.";

type Usage = { day: string; tasks: number; tasksBy: Record<string, number>; previewsBy: Record<string, number> };

export const usageFile = () => path.join(process.cwd(), 'data', 'usage.json');

type Env = Record<string, string | undefined>;

function count(env: Env, name: string, fallback: number): number {
  const raw = env[name];
  return raw && /^\d+$/.test(raw) ? Number(raw) : fallback;
}

export function limitsFromEnv(env: Env = process.env): Limits {
  return {
    tasksPerVisitorPerDay: count(env, 'LIMIT_TASKS_PER_VISITOR', DEFAULT_LIMITS.tasksPerVisitorPerDay),
    tasksPerDay: count(env, 'LIMIT_TASKS_PER_DAY', DEFAULT_LIMITS.tasksPerDay),
    previewsPerVisitorPerDay: count(env, 'LIMIT_PREVIEWS_PER_VISITOR', DEFAULT_LIMITS.previewsPerVisitorPerDay),
  };
}

function read(file: string, day: string): Usage {
  const empty: Usage = { day, tasks: 0, tasksBy: {}, previewsBy: {} };
  try {
    const usage = JSON.parse(fs.readFileSync(file, 'utf8')) as Usage;
    return usage.day === day && typeof usage.tasks === 'number' ? usage : empty;
  } catch {
    return empty; // missing or unreadable: count from zero
  }
}

/** Counts one use if allowed. Days are UTC. A missing or unreadable file counts as zero. */
export function takeAllowance(file: string, kind: 'task' | 'preview', visitorId: string, now: Date, limits: Limits): boolean {
  const usage = read(file, now.toISOString().slice(0, 10));
  if (kind === 'task') {
    const mine = usage.tasksBy[visitorId] ?? 0;
    if (mine >= limits.tasksPerVisitorPerDay || usage.tasks >= limits.tasksPerDay) return false;
    usage.tasks += 1;
    usage.tasksBy[visitorId] = mine + 1;
  } else {
    const mine = usage.previewsBy[visitorId] ?? 0;
    if (mine >= limits.previewsPerVisitorPerDay) return false;
    usage.previewsBy[visitorId] = mine + 1;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(usage));
  fs.renameSync(tmp, file);
  return true;
}
