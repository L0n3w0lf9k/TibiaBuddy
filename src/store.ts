import Dexie, { type Table } from 'dexie';
import type { AppState } from './types';
import { makeSeed } from './seed';
import { validateBackup } from './domain/backupValidation';
export { validateBackup } from './domain/backupValidation';

class BuddyDatabase extends Dexie {
  snapshots!: Table<{ id: string; data: AppState }>;
  constructor() { super('tibia-buddy-v1'); this.version(1).stores({ snapshots: 'id' }); }
}
const db = new BuddyDatabase();
const listeners = new Set<(state: AppState) => void>();
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('tibia-buddy-v1') : null;
export const subscribe = (fn: (state: AppState) => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
function publish(state: AppState) { listeners.forEach(fn => fn(state)); channel?.postMessage(state.revision); }
channel?.addEventListener('message', () => { void readState().then(state => listeners.forEach(fn => fn(state))); });

export async function readState(): Promise<AppState> {
  return db.transaction('rw', db.snapshots, async () => {
    const current = await db.snapshots.get('current');
    if (current) return current.data;
    const data = makeSeed(); await db.snapshots.put({ id: 'current', data }); return data;
  });
}
export async function mutateState(recipe: (draft: AppState) => void) {
  const next = await db.transaction('rw', db.snapshots, async () => {
    const current = (await db.snapshots.get('current'))?.data ?? makeSeed();
    const draft = structuredClone(current); recipe(draft); draft.revision = current.revision + 1;
    await db.snapshots.put({ id: 'current', data: draft }); return draft;
  });
  publish(next);
}
export async function replaceState(data: AppState) {
  validateBackup(data);
  await mutateState(draft => { const revision = draft.revision; Object.assign(draft, data, { revision }); });
}
export function downloadBackup(state: AppState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = 'tibia-buddy-backup-' + new Date().toISOString().slice(0, 10) + '.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
