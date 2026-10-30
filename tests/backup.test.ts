import test from 'node:test';
import assert from 'node:assert/strict';
import { makeTestState, testCharacter, TEST_DATE, TEST_TIMESTAMP } from './fixtures/appState';
import { validateBackup } from '../src/domain/backupValidation';
import { allocateOrder, cancelOutstanding, changeStock, deliverOrder, recordPayment } from '../src/domain/inventory';
import type { AppState, HuntSession, Order } from '../src/types';

function newOrder(state: AppState): Order {
  const lot = state.lots[0];
  const order: Order = { id: 'test-order', characterId: lot.characterId, buyer: 'Synthetic new customer', city: 'Test town', date: TEST_DATE, notes: '', cancelled: false, lines: [{ id: 'test-line', itemId: lot.itemId, nameSnapshot: 'Synthetic item A', quantity: 20, delivered: 0, unit: 'package', packSize: 10, unitPrice: 100, chargesPerItem: null, allocations: [] }], payments: [], deliveries: [] };
  state.orders.push(order); return order;
}
function runningHunt(state: AppState): HuntSession {
  const c = state.characters[0], at = Date.parse(TEST_TIMESTAMP);
  return { id: 'test-hunt', characterId: c.id, serverId: c.serverId, startedAt: at, stoppedAt: null, startXP: c.xp, endXP: null, location: 'Test hunting ground', notes: '', intervals: [{ start: at, end: null }], checkpoints: [], status: 'running' };
}
function bad(edit: (state: AppState) => void, pattern?: RegExp) { const state = makeTestState(); edit(state); assert.throws(() => validateBackup(state), pattern); }

test('synthetic state with imported history survives a complete JSON round-trip without mutation', () => {
  const json = JSON.stringify(makeTestState()), state: unknown = JSON.parse(json);
  validateBackup(state);
  assert.equal(JSON.stringify(state), json);
  assert.equal(state.orders.length, 1);
});
test('null catalogue clears and server-specific edits survive JSON restore', () => {
  const state = makeTestState(), server = state.servers[0].id;
  state.itemOverrides[server + '::test:item:a'] = { name: 'Custom test item', packSize: null, charges: null, weight: null };
  state.npcOverrides[server + '::' + state.npcs[0].id] = { city: 'My town', x: null, y: null, z: null };
  state.offerOverrides[server + '::' + state.offers[0].id] = { price: 9, enabled: false, notes: 'Local change' };
  validateBackup(JSON.parse(JSON.stringify(state)));
});
test('physical skill rates round-trip while older backups retain their 1x fallback', () => {
  const state = makeTestState();
  assert.equal(state.servers[0].skillRate, undefined);
  validateBackup(state);
  state.servers[0].skillRate = 2.5;
  const restored = JSON.parse(JSON.stringify(state));
  validateBackup(restored);
  assert.equal(restored.servers[0].skillRate, 2.5);
  for (const rate of [0, -1, 0.001, 1001, Number.NaN, null]) {
    bad(s => { s.servers[0].skillRate = rate as number; }, /server skillRate/);
  }
});
test('valid partial delivery and cancellation keep advance-payment refund due', () => {
  const state = makeTestState(), order = newOrder(state), lot = state.lots[0];
  allocateOrder(state, order.id);
  recordPayment(state, { orderId: order.id, amount: 150, date: TEST_DATE, operationId: 'test-payment' });
  deliverOrder(state, { orderId: order.id, lineId: 'test-line', lotId: lot.id, quantity: 10, date: TEST_DATE, operationId: 'test-delivery' });
  cancelOutstanding(state, order.id);
  validateBackup(JSON.parse(JSON.stringify(state)));
});
test('physical stock shortages are legitimate; reservations cannot exceed remaining order demand', () => {
  const state = makeTestState(), order = newOrder(state), lot = state.lots[0];
  allocateOrder(state, order.id);
  changeStock(state, { lotId: lot.id, delta: -95, reason: 'Corrected count', date: TEST_TIMESTAMP, operationId: 'test-adjustment' });
  validateBackup(state);
  order.lines[0].allocations[0].quantity = 21;
  assert.throws(() => validateBackup(state), /remaining demand/);
});
test('removed empty stock identities remain valid in immutable delivery/movement history', () => {
  const state = makeTestState(), order = newOrder(state), lot = state.lots[0];
  allocateOrder(state, order.id);
  deliverOrder(state, { orderId: order.id, lineId: 'test-line', lotId: lot.id, quantity: 10, date: TEST_DATE, operationId: 'test-delivery' });
  cancelOutstanding(state, order.id);
  changeStock(state, { lotId: lot.id, delta: -lot.quantity, reason: 'Count correction', date: TEST_TIMESTAMP, operationId: 'test-correction' });
  lot.personalReserve = 0; state.lots = state.lots.filter(l => l.id !== lot.id);
  validateBackup(state);
});
test('active allocations reject missing stock, wrong owner, wrong item and charge mismatch', () => {
  const changes = [
    (s: AppState) => { newOrder(s).lines[0].allocations = [{ lotId: 'missing-lot', quantity: 1 }]; },
    (s: AppState) => { const o = newOrder(s); s.characters.push(testCharacter('other-character', 'Other', s.servers[0].id)); s.lots[0].characterId = 'other-character'; o.lines[0].allocations = [{ lotId: s.lots[0].id, quantity: 1 }]; },
    (s: AppState) => { newOrder(s).lines[0].allocations = [{ lotId: s.lots[1].id, quantity: 1 }]; },
    (s: AppState) => { const o = newOrder(s); s.lots[0].chargesPerItem = 5; o.lines[0].allocations = [{ lotId: s.lots[0].id, quantity: 1 }]; },
  ];
  changes.forEach(edit => bad(edit, /allocation/));
});
test('malformed override identity, foreign server and duplicate effective offers are rejected', () => {
  bad(s => { s.offerOverrides[s.servers[0].id + '::' + s.offers[0].id] = { price: 1, itemId: 'bad' } as never; }, /unsupported field/);
  bad(s => { s.itemOverrides['missing-server::' + s.items[0].id] = { name: 'Changed' }; }, /override/);
  bad(s => { s.items.push({ id: 'foreign-item', name: 'Foreign', category: 'Item', aliases: [], serverId: 'unknown-server' }); }, /item server/);
  bad(s => { s.servers.push({ ...s.servers[0], id: 'other-server', name: 'Other server' }); s.items.push({ id: 'foreign-item', name: 'Foreign', category: 'Item', aliases: [], serverId: 'other-server' }); s.lots[0].itemId = 'foreign-item'; }, /owner’s server/);
  bad(s => { s.offers.push({ ...s.offers[0], id: 'duplicate-custom-offer', serverId: s.servers[0].id, sourcePresetId: null }); }, /duplicate active/);
});
test('base quantities, package definitions, dates and required rendered text are validated', () => {
  bad(s => { s.lots[0].quantity = 1.5; }, /whole number/);
  bad(s => { s.lots[0].packSize = 0; }, /number/);
  bad(s => { s.orders[0].date = '2000-02-30'; }, /date/);
  bad(s => { delete (s.orders[0] as Partial<Order>).date; }, /text/);
  bad(s => { s.items[0].aliases = [42] as never; }, /aliases/);
  bad(s => { s.npcs[0].z = 16; s.npcs[0].x = 32000; s.npcs[0].y = 32000; }, /NPC Z/);
});
test('delivery totals and nested identities must agree with the order', () => {
  bad(s => { s.orders[0].deliveries[0].quantity = 1; }, /delivery history/);
  bad(s => { s.orders[0].payments.push({ ...s.orders[0].payments[0] }); }, /duplicate identity/);
  bad(s => { s.orders[0].deliveries[0].lineId = 'missing-line'; }, /missing order line/);
  bad(s => { s.orders[0].payments.push({ id: 'over-refund', date: TEST_DATE, amount: -100000 }); }, /net paid/);
});
test('running, paused, stopped and manually logged hunts round-trip', () => {
  for (const status of ['running', 'paused', 'awaiting_xp', 'completed'] as const) {
    const state = makeTestState(), hunt = runningHunt(state);
    if (status !== 'running') hunt.intervals[0].end = hunt.startedAt + 60000;
    if (status === 'awaiting_xp' || status === 'completed') hunt.stoppedAt = hunt.startedAt + 60000;
    if (status === 'completed') hunt.endXP = hunt.startXP - 50;
    hunt.status = status; state.hunts.push(hunt); validateBackup(JSON.parse(JSON.stringify(state)));
  }
  const state = makeTestState(), manual = runningHunt(state);
  manual.intervals = []; manual.durationOverride = 2700; manual.status = 'completed'; manual.stoppedAt = manual.startedAt + 2700000; manual.endXP = manual.startXP + 1234;
  state.hunts.push(manual); validateBackup(state);
});
test('overlapping timers, conflicting unfinished hunts and missing final XP fail', () => {
  bad(s => { const h = runningHunt(s); h.intervals = [{ start: h.startedAt, end: h.startedAt + 10000 }, { start: h.startedAt + 5000, end: null }]; s.hunts.push(h); }, /overlap/);
  bad(s => { const h = runningHunt(s); s.hunts.push(h, { ...structuredClone(h), id: 'another-hunt' }); }, /unfinished/);
  bad(s => { const h = runningHunt(s); h.status = 'completed'; h.intervals[0].end = h.startedAt; h.stoppedAt = h.startedAt; s.hunts.push(h); }, /final XP/);
});
test('malformed known preferences and prototype-changing payloads are rejected', () => {
  bad(s => { s.preferences.xpCreatureIds = 'not-an-array'; }, /supported list/);
  const state = JSON.parse(JSON.stringify(makeTestState()));
  state.preferences = JSON.parse('{"__proto__":{"unsafe":true}}');
  assert.throws(() => validateBackup(state), /unsupported property/);
});
