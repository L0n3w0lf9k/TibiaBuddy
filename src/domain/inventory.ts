import type { AppState, Order, OrderLine, StockLot } from '../types';

export const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export function baseQuantity(value: number, packSize: number): number {
  if (!Number.isFinite(value) || value < 0 || !Number.isSafeInteger(packSize) || packSize < 1) throw new Error('Enter a valid quantity and whole-number package size.');
  const result = value * packSize;
  if (!Number.isSafeInteger(Math.round(result)) || Math.abs(result - Math.round(result)) > 0.000001) throw new Error('The quantity must represent a whole number of individual items.');
  return Math.round(result);
}
export const lineRemaining = (line: OrderLine) => Math.max(0, line.quantity - line.delivered);
export const lineAllocated = (line: OrderLine) => line.allocations.reduce((sum, a) => sum + a.quantity, 0);
export const orderTotal = (order: Order) => money(order.lines.reduce((sum, line) => sum + (order.cancelled ? line.delivered : line.quantity) / line.packSize * line.unitPrice, 0));
export const orderPaid = (order: Order) => money(order.payments.reduce((sum, p) => sum + p.amount, 0));
export const orderBalance = (order: Order) => money(orderTotal(order) - orderPaid(order));
export const orderOutstanding = (order: Order) => order.cancelled ? 0 : order.lines.reduce((sum, line) => sum + lineRemaining(line), 0);
export function orderStatus(order: Order): string {
  if (order.cancelled) return orderBalance(order) < 0 ? 'Refund due' : orderBalance(order) > 0 ? 'Payment due' : 'Cancelled';
  if (!orderOutstanding(order)) return orderBalance(order) > 0 ? 'Payment due' : orderBalance(order) < 0 ? 'Refund due' : 'Closed';
  return order.lines.some(line => line.delivered > 0 || lineAllocated(line) > 0) ? 'Fulfilling' : 'Ordered';
}
export function lotAllocated(state: Pick<AppState, 'orders'>, lotId: string): number {
  return state.orders.filter(o => !o.cancelled).reduce((sum, order) => sum + order.lines.reduce((lineSum, line) => lineSum + line.allocations.filter(a => a.lotId === lotId).reduce((n, a) => n + a.quantity, 0), 0), 0);
}
export const lotAvailable = (state: Pick<AppState, 'orders'>, lot: StockLot) => lot.quantity - lot.personalReserve - lotAllocated(state, lot.id);
export const chargesMatch = (line: OrderLine, lot: StockLot) => (line.chargesPerItem ?? null) === (lot.chargesPerItem ?? null);
export function deliverableFromLot(state: Pick<AppState, 'orders'>, order: Order, line: OrderLine, lot: StockLot): number {
  if (order.cancelled || lot.characterId !== order.characterId || lot.itemId !== line.itemId || !chargesMatch(line, lot)) return 0;
  const own = line.allocations.filter(a => a.lotId === lot.id).reduce((n, a) => n + a.quantity, 0);
  return Math.max(0, Math.min(lineRemaining(line), lot.quantity - lot.personalReserve - lotAllocated(state, lot.id) + own));
}
export function allocateOrder(state: AppState, orderId: string): number {
  const order = state.orders.find(o => o.id === orderId);
  if (!order || order.cancelled) throw new Error('This order is no longer open.');
  let added = 0;
  for (const line of order.lines) {
    let needed = Math.max(0, lineRemaining(line) - lineAllocated(line));
    for (const lot of state.lots.filter(l => l.characterId === order.characterId && l.itemId === line.itemId && chargesMatch(line, l))) {
      const quantity = Math.min(needed, Math.max(0, lotAvailable(state, lot)));
      if (!quantity) continue;
      const allocation = line.allocations.find(a => a.lotId === lot.id);
      if (allocation) allocation.quantity += quantity;
      else line.allocations.push({ lotId: lot.id, quantity });
      needed -= quantity; added += quantity;
      if (!needed) break;
    }
  }
  return added;
}
export function releaseOrderAllocations(state: AppState, orderId: string): void {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) throw new Error('Order not found.');
  order.lines.forEach(line => { line.allocations = []; });
}
export function deliverOrder(state: AppState, args: { orderId: string; lineId: string; lotId: string; quantity: number; date: string; operationId: string }): boolean {
  if (state.movements.some(m => m.operationId === args.operationId) || state.orders.some(o => o.deliveries.some(d => d.id === args.operationId))) return false;
  if (!Number.isSafeInteger(args.quantity) || args.quantity <= 0) throw new Error('Delivery must contain a positive whole number of items.');
  const order = state.orders.find(o => o.id === args.orderId);
  const line = order?.lines.find(l => l.id === args.lineId);
  const lot = state.lots.find(l => l.id === args.lotId);
  if (!order || !line || !lot) throw new Error('The order line or stock location no longer exists.');
  if (args.quantity > deliverableFromLot(state, order, line, lot)) throw new Error('Not enough matching stock is available. Personal reserves and other orders are protected.');
  lot.quantity -= args.quantity;
  line.delivered += args.quantity;
  let toRelease = args.quantity;
  for (const allocation of line.allocations.filter(a => a.lotId === lot.id)) {
    const released = Math.min(allocation.quantity, toRelease);
    allocation.quantity -= released; toRelease -= released;
  }
  line.allocations = line.allocations.filter(a => a.quantity > 0);
  // Delivery may come from free stock in another lot. Release any allocations
  // now exceeding the undelivered demand rather than leaving phantom reserves.
  let excess = Math.max(0, lineAllocated(line) - lineRemaining(line));
  for (const allocation of [...line.allocations].reverse()) {
    const released = Math.min(allocation.quantity, excess);
    allocation.quantity -= released; excess -= released;
    if (!excess) break;
  }
  line.allocations = line.allocations.filter(a => a.quantity > 0);
  order.deliveries.push({ id: args.operationId, date: args.date, lineId: line.id, quantity: args.quantity, lotId: lot.id });
  state.movements.push({ id: args.operationId, operationId: args.operationId, date: args.date, characterId: order.characterId, lotId: lot.id, itemId: lot.itemId, delta: -args.quantity, reason: 'Delivery to ' + order.buyer });
  return true;
}
export function cancelOutstanding(state: AppState, orderId: string): void {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) throw new Error('Order not found.');
  order.cancelled = true;
  order.lines.forEach(line => { line.allocations = []; });
}
export function recordPayment(state: AppState, args: { orderId: string; amount: number; date: string; operationId: string }): void {
  const order = state.orders.find(o => o.id === args.orderId);
  if (!order) throw new Error('Order not found.');
  if (order.payments.some(p => p.id === args.operationId)) return;
  const amount = money(args.amount);
  if (!Number.isFinite(amount) || amount === 0) throw new Error('Enter a non-zero payment or refund amount.');
  if (amount > Math.max(0, orderBalance(order))) throw new Error('Payment exceeds the outstanding balance.');
  if (amount < 0 && -amount > orderPaid(order)) throw new Error('A refund cannot exceed payments received.');
  order.payments.push({ id: args.operationId, date: args.date, amount });
}
export function changeStock(state: AppState, args: { lotId: string; delta: number; reason: string; date: string; operationId: string; consume?: boolean }): void {
  if (state.movements.some(m => m.operationId === args.operationId)) return;
  const lot = state.lots.find(l => l.id === args.lotId);
  if (!lot) throw new Error('Stock record not found.');
  if (!Number.isSafeInteger(args.delta) || lot.quantity + args.delta < 0) throw new Error('Stock must remain a non-negative whole number of items.');
  if (args.consume && args.delta < 0 && -args.delta > Math.max(0, lotAvailable(state, lot))) throw new Error('This would consume reserved stock. Release its reservation or use Adjust to correct the actual count.');
  lot.quantity += args.delta;
  if (args.delta) state.movements.push({ id: args.operationId, operationId: args.operationId, characterId: lot.characterId, itemId: lot.itemId, lotId: lot.id, date: args.date, delta: args.delta, reason: args.reason });
}
