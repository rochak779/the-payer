import { newId } from '@/domain/ids';
import type { LogEntry, LogType } from '@/domain/types';
import type { Db } from '@/store/store';

/** Call inside store.update(). */
export function appendLog(db: Db, now: Date, type: LogType, approvalId: string | null, message: string): LogEntry {
  const entry: LogEntry = { id: newId('log'), at: now.toISOString(), type, approvalId, message };
  db.log.push(entry);
  return entry;
}
