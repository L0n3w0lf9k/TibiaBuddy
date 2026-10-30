import type { HuntSession } from '../types';

export const MAX_LEVEL = 10000;
export function xpForLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > MAX_LEVEL + 1) throw new Error('Enter a level between 1 and 10,000.');
  return Math.round((50 * level ** 3 - 300 * level ** 2 + 850 * level - 600) / 3);
}
export const MAX_XP = xpForLevel(MAX_LEVEL + 1) - 1;
export function checkXP(xp: number) {
  if (!Number.isSafeInteger(xp) || xp < 0 || xp > MAX_XP) throw new Error('Experience must be a whole number from 0 to ' + MAX_XP.toLocaleString() + '.');
  return xp;
}
export function levelForXP(xp: number): number {
  checkXP(xp);
  let lo = 1, hi = MAX_LEVEL;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (xpForLevel(mid) <= xp) lo = mid; else hi = mid - 1;
  }
  return lo;
}
export function xpProgress(xp: number) {
  const level = levelForXP(xp), floor = xpForLevel(level), next = xpForLevel(level + 1);
  return { level, floor, next, remaining: next - xp, gained: xp - floor, percent: 100 * (xp - floor) / (next - floor) };
}
export function xpFromRemaining(level: number, remaining: number): number {
  if (!Number.isFinite(remaining) || remaining < 0 || remaining > 100) throw new Error('Percentage remaining must be from 0 to 100.');
  const floor = xpForLevel(level), next = xpForLevel(level + 1);
  return Math.min(next - 1, Math.round(floor + (next - floor) * (1 - remaining / 100)));
}
export function activeSeconds(session: HuntSession, at = Date.now()): number {
  if (session.durationOverride !== undefined) return session.durationOverride;
  return session.intervals.reduce((sum, i) => sum + Math.max(0, Math.min(i.end ?? at, at) - i.start) / 1000, 0);
}
export function huntMetrics(session: HuntSession, at = Date.now()) {
  const seconds = activeSeconds(session, at);
  const checkpoint = session.checkpoints.at(-1);
  const xp = session.endXP ?? checkpoint?.xp ?? null;
  const measuredSeconds = session.endXP === null ? checkpoint?.activeSeconds ?? 0 : seconds;
  const gain = xp === null ? null : xp - session.startXP;
  const rate = gain !== null && measuredSeconds > 0 ? gain * 3600 / measuredSeconds : null;
  const progress = xp === null ? null : xpProgress(xp);
  const eta = rate !== null && rate > 0 && progress ? progress.remaining * 3600 / rate : null;
  return { seconds, measuredSeconds, xp, gain, rate, progress, eta, checkpoint };
}
export function pauseHunt(session: HuntSession, at: number) {
  if (session.status !== 'running') return;
  const current = session.intervals.at(-1);
  if (current && current.end === null) current.end = Math.max(current.start, at);
  session.status = 'paused';
}
export function resumeHunt(session: HuntSession, at: number) {
  if (session.status !== 'paused') return;
  session.intervals.push({ start: at, end: null }); session.status = 'running';
}
export function stopHunt(session: HuntSession, at: number) {
  if (session.status !== 'running' && session.status !== 'paused') return;
  pauseHunt(session, at); session.status = 'awaiting_xp'; session.stoppedAt = at;
}
export function completeHunt(session: HuntSession, endXP: number) {
  checkXP(endXP);
  if (session.status !== 'awaiting_xp') throw new Error('Stop the timer before entering final experience.');
  session.endXP = endXP; session.status = 'completed';
}
