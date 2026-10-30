import test from 'node:test';
import assert from 'node:assert/strict';
import type { AppState, Order, StockLot } from '../src/types';
import { allocateOrder, baseQuantity, cancelOutstanding, changeStock, deliverOrder, lotAvailable, orderBalance, orderTotal, recordPayment } from '../src/domain/inventory';

function fixture(): AppState {
  const lot: StockLot = { id: 'lot', characterId: 'char', itemId: 'item', quantity: 10, personalReserve: 2, unit: 'piece', packSize: 1, askingPrice: 100, notes: '' };
  const order: Order = { id: 'order', characterId: 'char', buyer: 'Synthetic customer', city: 'Test town', date: '2000-01-01', notes: '', lines: [{ id: 'line', itemId: 'item', nameSnapshot: 'Item', quantity: 12, delivered: 0, packSize: 1, unit: 'piece', unitPrice: 100, allocations: [] }], payments: [], deliveries: [], cancelled: false };
  return { schemaVersion: 1, revision: 0, activeCharacterId: 'char', characters: [], servers: [], items: [], npcs: [], offers: [], itemOverrides: {}, npcOverrides: {}, offerOverrides: {}, lots: [lot], orders: [order], movements: [], backpacks: [], hunts: [], bookmarks: [], favourites: [], preferences: {} };
}

test('backpack quantities convert to base items; fractional objects are rejected', () => {
  assert.equal(baseQuantity(2, 20), 40);
  assert.equal(baseQuantity(0.05, 20), 1);
  assert.throws(() => baseQuantity(0.01, 20));
});
test('orders allocate only real free stock, with excess demand left unallocated', () => {
  const state = fixture();
  assert.equal(allocateOrder(state, 'order'), 8);
  assert.equal(state.lots[0].quantity, 10);
  assert.equal(state.orders[0].lines[0].allocations[0].quantity, 8);
  assert.equal(lotAvailable(state, state.lots[0]), 0);
  assert.equal(allocateOrder(state, 'order'), 0);
});
test('delivery deducts once, releases its reservation and does not imply payment', () => {
  const state = fixture(); allocateOrder(state, 'order');
  const delivery = { orderId: 'order', lineId: 'line', lotId: 'lot', quantity: 3, date: '2000-01-01', operationId: 'op' };
  assert.equal(deliverOrder(state, delivery), true);
  assert.equal(deliverOrder(state, delivery), false);
  assert.equal(state.lots[0].quantity, 7);
  assert.equal(state.orders[0].lines[0].allocations[0].quantity, 5);
  assert.equal(state.orders[0].lines[0].delivered, 3);
  assert.equal(lotAvailable(state, state.lots[0]), 0);
  assert.equal(state.movements.length, 1);
  assert.equal(state.orders[0].payments.length, 0);
});
test('delivery cannot steal another order allocation or personal stock', () => {
  const state = fixture(); allocateOrder(state, 'order');
  state.orders.push({ ...structuredClone(state.orders[0]), id: 'other', lines: [{ ...structuredClone(state.orders[0].lines[0]), id: 'other-line', allocations: [] }] });
  assert.throws(() => deliverOrder(state, { orderId: 'other', lineId: 'other-line', lotId: 'lot', quantity: 1, date: '2000-01-01', operationId: 'bad' }));
  assert.equal(state.lots[0].quantity, 10);
});
test('delivery from a different free lot releases excess reservations elsewhere', () => {
  const state = fixture(); state.orders[0].lines[0].quantity = 8;
  allocateOrder(state, 'order');
  state.lots.push({ ...state.lots[0], id: 'fresh-lot', quantity: 5, personalReserve: 0 });
  deliverOrder(state, { orderId: 'order', lineId: 'line', lotId: 'fresh-lot', quantity: 5, date: '2000-01-01', operationId: 'fresh-delivery' });
  assert.equal(state.orders[0].lines[0].allocations[0].quantity, 3);
  assert.equal(lotAvailable(state, state.lots[0]), 5);
  assert.equal(state.orders[0].lines[0].delivered, 5);
});
test('rune charge state and character identity isolate allocations', () => {
  const state = fixture(); state.orders[0].lines[0].chargesPerItem = 5;
  state.lots.push({ ...state.lots[0], id: 'other-char', characterId: 'other', chargesPerItem: 5 });
  state.lots[0].chargesPerItem = 2;
  assert.equal(allocateOrder(state, 'order'), 0);
});
test('stock corrections can reveal shortages while ordinary consumption protects reservations', () => {
  const state = fixture(); allocateOrder(state, 'order');
  assert.throws(() => changeStock(state, { lotId: 'lot', delta: -3, reason: 'Used', date: '2000-01-01', operationId: 'use', consume: true }));
  changeStock(state, { lotId: 'lot', delta: -3, reason: 'Count corrected', date: '2000-01-01', operationId: 'adjust' });
  assert.equal(lotAvailable(state, state.lots[0]), -3);
});
test('agreed prices and packing survive stock price changes', () => {
  const state = fixture(); state.orders[0].lines[0].packSize = 20; state.orders[0].lines[0].quantity = 40; state.orders[0].lines[0].unitPrice = 900;
  state.lots[0].askingPrice = 1200; state.lots[0].packSize = 10;
  assert.equal(orderTotal(state.orders[0]), 1800);
});
test('cancel outstanding goods retains delivered debt and exposes advance-payment refund', () => {
  const state = fixture(); allocateOrder(state, 'order');
  recordPayment(state, { orderId: 'order', amount: 600, date: '2000-01-01', operationId: 'pay' });
  deliverOrder(state, { orderId: 'order', lineId: 'line', lotId: 'lot', quantity: 3, date: '2000-01-01', operationId: 'deliver' });
  cancelOutstanding(state, 'order');
  assert.equal(orderTotal(state.orders[0]), 300);
  assert.equal(orderBalance(state.orders[0]), -300);
  assert.equal(state.orders[0].lines[0].allocations.length, 0);
  recordPayment(state, { orderId: 'order', amount: -300, date: '2000-01-01', operationId: 'refund' });
  assert.equal(orderBalance(state.orders[0]), 0);
  assert.equal(state.lots[0].quantity, 7);
});
