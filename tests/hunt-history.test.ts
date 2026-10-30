import test from 'node:test';
import assert from 'node:assert/strict';
import type { HuntSession } from '../src/types';
import { huntHistory } from '../src/domain/huntHistory';
import { manualHuntTiming } from '../src/domain/xp';
import { validateBackup } from '../src/domain/backupValidation';
import { makeTestState } from './fixtures/appState';

function session(): HuntSession {
  return { id: 'hunt', characterId: 'character', serverId: 'server', startedAt: 1000000, stoppedAt: null,
    startXP: 10000, endXP: null, location: 'Rotworms', notes: '', status: 'running',
    intervals: [{ start: 1000000, end: null }], checkpoints: [] };
}

test('first checkpoint uses starting XP and subsequent rates use only their interval', () => {
  const hunt = session();
  hunt.checkpoints = [
    { id: 'cp1', at: 1060000, activeSeconds: 60, xp: 10600 },
    { id: 'cp2', at: 1180000, activeSeconds: 180, xp: 13000 }
  ];
  const rows = huntHistory(hunt);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].rate, null);
  assert.deepEqual(rows.slice(1).map(r => [r.gained, r.intervalSeconds, r.rate]), [[600, 60, 36000], [2400, 120, 72000]]);
  assert.equal(rows[2].activeSeconds, 180);
});

test('pauses do not dilute a checkpoint interval rate', () => {
  const hunt = session();
  hunt.intervals = [{ start: 1000000, end: 1060000 }, { start: 1600000, end: null }];
  hunt.checkpoints = [
    { id: 'cp1', at: 1060000, activeSeconds: 60, xp: 10600 },
    { id: 'cp2', at: 1660000, activeSeconds: 120, xp: 11200 }
  ];
  const row = huntHistory(hunt)[2];
  assert.equal(row.at - hunt.checkpoints[0].at, 600000);
  assert.equal(row.intervalSeconds, 60);
  assert.equal(row.rate, 36000);
});

test('zero-time checkpoints have no rate while losses and zero gains stay meaningful', () => {
  const hunt = session();
  hunt.checkpoints = [
    { id: 'cp1', at: 1060000, activeSeconds: 60, xp: 9900 },
    { id: 'cp2', at: 1070000, activeSeconds: 60, xp: 9800 },
    { id: 'cp3', at: 1130000, activeSeconds: 120, xp: 9800 }
  ];
  assert.deepEqual(huntHistory(hunt).slice(1).map(r => r.rate), [-6000, null, 0]);
});

test('completed hunt appends final XP with the final interval pace', () => {
  const hunt = session();
  hunt.status = 'completed'; hunt.stoppedAt = 1120000; hunt.endXP = 11200;
  hunt.intervals[0].end = 1120000;
  hunt.checkpoints = [{ id: 'cp1', at: 1060000, activeSeconds: 60, xp: 10600 }];
  const last = huntHistory(hunt).at(-1)!;
  assert.equal(last.kind, 'finish'); assert.equal(last.activeSeconds, 120);
  assert.equal(last.gained, 600); assert.equal(last.rate, 36000);
});

test('manual completed hunt uses its recorded active duration and leaves source untouched', () => {
  const hunt = session(); hunt.status = 'completed'; hunt.stoppedAt = 4600000;
  hunt.endXP = 13000; hunt.intervals = []; hunt.durationOverride = 1800;
  const before = structuredClone(hunt);
  assert.equal(huntHistory(hunt).at(-1)!.rate, 6000);
  assert.deepEqual(hunt, before);
});

test('impossible checkpoint durations are rejected on import, including final-duration overrides', () => {
  const state = makeTestState(), hunt = session();
  hunt.characterId = state.characters[0].id; hunt.serverId = state.servers[0].id;
  hunt.status = 'completed'; hunt.stoppedAt = 1120000; hunt.endXP = 11200; hunt.intervals[0].end = 1120000;
  hunt.checkpoints = [{ id: 'cp1', at: 1060000, activeSeconds: 600, xp: 10600 }];
  state.hunts = [hunt];
  assert.throws(() => validateBackup(state), /checkpoint active time/);
  assert.equal(huntHistory(hunt).at(-1)!.intervalSeconds, null);
  hunt.checkpoints[0].activeSeconds = 60;
  assert.doesNotThrow(() => validateBackup(state));
  hunt.durationOverride = 30;
  assert.throws(() => validateBackup(state), /checkpoint active time/);
});

test('checkpoint validation counts pauses and allows another record during a pause', () => {
  const state = makeTestState(), hunt = session();
  hunt.characterId = state.characters[0].id; hunt.serverId = state.servers[0].id;
  hunt.status = 'paused'; hunt.intervals[0].end = 1060000;
  hunt.checkpoints = [{ id: 'cp1', at: 1060000, activeSeconds: 60, xp: 10600 },
    { id: 'cp2', at: 1660000, activeSeconds: 60, xp: 10600 }];
  state.hunts = [hunt];
  assert.doesNotThrow(() => validateBackup(state));
  hunt.checkpoints[1].activeSeconds = 61;
  assert.throws(() => validateBackup(state), /checkpoint active time/);
});

test('manual hunt duration cannot create an invalid stored timestamp', () => {
  assert.deepEqual(manualHuntTiming(1000000, 1.5), { seconds: 90, stoppedAt: 1090000 });
  for (const minutes of [0, -1, NaN, Infinity, 1e13]) assert.throws(() => manualHuntTiming(1000000, minutes));
  assert.throws(() => manualHuntTiming(NaN, 1));
});
