import type { HuntSession } from '../types';
import { activeSeconds } from './xp';

export interface HuntHistoryEntry {
  id: string;
  kind: 'start' | 'checkpoint' | 'finish';
  label: string;
  at: number;
  activeSeconds: number;
  xp: number;
  gained: number | null;
  intervalSeconds: number | null;
  rate: number | null;
}

/** Rates belong to each recorded interval, not the entire hunt or the live clock. */
export function huntHistory(session: HuntSession): HuntHistoryEntry[] {
  const rows: HuntHistoryEntry[] = [{ id: `start:${session.id}`, kind: 'start', label: 'Hunt started', at: session.startedAt,
    activeSeconds: 0, xp: session.startXP, gained: null, intervalSeconds: null, rate: null }];
  const append = (entry: Pick<HuntHistoryEntry, 'id' | 'kind' | 'label' | 'at' | 'activeSeconds' | 'xp'>) => {
    const previous = rows[rows.length - 1];
    const seconds = entry.activeSeconds - previous.activeSeconds;
    const gained = entry.xp - previous.xp;
    rows.push({ ...entry, gained, intervalSeconds: Number.isFinite(seconds) && seconds >= 0 ? seconds : null,
      rate: Number.isFinite(seconds) && seconds > 0 ? gained * 3600 / seconds : null });
  };
  session.checkpoints.forEach((checkpoint, index) => append({ ...checkpoint, kind: 'checkpoint', label: `Checkpoint ${index + 1}` }));
  if (session.status === 'completed' && session.endXP !== null && session.stoppedAt !== null) {
    append({ id: `finish:${session.id}`, kind: 'finish', label: 'Hunt finished', at: session.stoppedAt,
      activeSeconds: activeSeconds(session, session.stoppedAt), xp: session.endXP });
  }
  return rows;
}
