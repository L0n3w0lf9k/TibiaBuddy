import { useEffect, useState, type FormEvent } from 'react';
import { ArrowUpRight, Backpack as BackpackIcon, Boxes, ClipboardList, Coins, Edit3, Plus, Trash2, PackageCheck } from 'lucide-react';
import { useApp } from '../context';
import ItemSprite from '../components/ItemSprite';
import BackpackSprite from '../components/BackpackSprite';
import { backpackChoices, backpackSpriteId, backpackSpriteManifest } from '../data/backpackSprites';
import { Badge, EmptyState, Field, Modal, Notice, PageHeader, SearchBox, Stat, Tabs, dateLabel, gp, number, today, uid } from '../shared';
import { catalogItems } from '../domain/catalog';
import { allocateOrder, baseQuantity, cancelOutstanding, changeStock, chargesMatch, deliverableFromLot, deliverOrder, lineAllocated, lineRemaining, lotAllocated, lotAvailable, orderBalance, orderOutstanding, orderPaid, orderStatus, orderTotal, recordPayment, releaseOrderAllocations } from '../domain/inventory';
import type { AppState, Backpack, Order, OrderLine, StockLot } from '../types';

const errorText = (error: unknown) => error instanceof Error ? error.message : 'The change could not be saved.';
const labelUnit = (unit: string, amount: number) => unit === 'backpack' ? 'BP' : unit === 'piece' ? (amount === 1 ? 'item' : 'items') : unit;
const routeTab = () => { const value = typeof window === 'undefined' ? '' : window.location.hash.split('?')[0].split('/')[2]; return ['stock', 'orders', 'backpacks'].includes(value) ? value : 'stock'; };
function Quantity({ quantity, unit, packSize }: { quantity: number; unit: string; packSize: number }) {
  return <span><strong>{number(quantity / packSize, 2)} {labelUnit(unit, quantity / packSize)}</strong>{packSize !== 1 && <small className="muted" style={{ display: 'block' }}>{number(quantity)} individual items</small>}</span>;
}

export default function Supplies() {
  const { state, character, server, update, notify, navigate } = useApp();
  const [tab, setTab] = useState(routeTab);
  const [query, setQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState('open');
  const [lotForm, setLotForm] = useState<StockLot | 'new' | null>(null);
  const [adjust, setAdjust] = useState<{ lot: StockLot; kind: 'add' | 'use' } | null>(null);
  const [orderForm, setOrderForm] = useState<Order | 'new' | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [backpackForm, setBackpackForm] = useState<Backpack | 'new' | null>(null);
  const [remove, setRemove] = useState<{ kind: 'lot' | 'backpack'; id: string; name: string } | null>(null);
  useEffect(() => { const sync = () => { setTab(routeTab()); setQuery(''); }; window.addEventListener('hashchange', sync); return () => window.removeEventListener('hashchange', sync); }, []);
  const items = catalogItems(state, server.id);
  const itemMap = new Map(items.map(i => [i.id, i]));
  const lots = state.lots.filter(l => l.characterId === character.id);
  const orders = state.orders.filter(o => o.characterId === character.id);
  const backpacks = state.backpacks.filter(b => b.characterId === character.id);
  const openOrders = orders.filter(o => orderStatus(o) !== 'Closed' && orderStatus(o) !== 'Cancelled');
  const shortages = lots.filter(l => lotAvailable(state, l) < 0);
  const filteredLots = lots.filter(l => [itemMap.get(l.itemId)?.name, itemMap.get(l.itemId)?.aliases.join(' '), l.notes, backpacks.find(b => b.id === l.locationId)?.name].join(' ').toLowerCase().includes(query.toLowerCase()));
  const filteredOrders = orders.filter(o => (orderFilter === 'all' || (orderFilter === 'open' ? !['Closed', 'Cancelled'].includes(orderStatus(o)) : ['Closed', 'Cancelled'].includes(orderStatus(o)))) && [o.buyer, o.city, o.notes, ...o.lines.map(l => l.nameSnapshot)].join(' ').toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date));
  const selectedOrder = orders.find(o => o.id === orderId);
  const deleteRecord = async () => {
    if (!remove) return;
    try {
      await update(draft => {
        if (remove.kind === 'lot') {
          const lot = draft.lots.find(l => l.id === remove.id && l.characterId === character.id);
          if (!lot) return;
          if (lot.quantity || lot.personalReserve || lotAllocated(draft, lot.id)) throw new Error('Only empty, unreserved stock records can be removed. Use Adjust to correct the actual quantity first.');
          draft.lots = draft.lots.filter(l => l.id !== lot.id);
        } else {
          draft.backpacks = draft.backpacks.filter(b => b.id !== remove.id || b.characterId !== character.id);
          draft.lots.forEach(l => { if (l.locationId === remove.id) l.locationId = undefined; });
        }
      });
      setRemove(null); notify('Record removed. Transaction history is preserved.');
    } catch (e) { notify(errorText(e), 'error'); }
  };
  return <>
    <PageHeader eyebrow={`${character.name} · ${server.name}`} title="Supplies" description="Keep your stock, orders and backpacks in order." actions={<button className="btn btn-primary" onClick={() => tab === 'stock' ? setLotForm('new') : tab === 'orders' ? setOrderForm('new') : setBackpackForm('new')}><Plus size={17} />{tab === 'stock' ? 'Add stock' : tab === 'orders' ? 'New order' : 'Add backpack'}</button>} />
    <div className="stat-grid">
      <Stat label="Tracked items" value={new Set(lots.map(l => l.itemId)).size} detail={`${lots.length} stock records`} icon={<Boxes size={18} />} />
      <Stat label="Available value" value={gp(lots.reduce((sum, l) => sum + Math.max(0, lotAvailable(state, l)) / l.packSize * l.askingPrice, 0))} detail="At your asking prices" icon={<Coins size={18} />} />
      <Stat label="Open orders" value={openOrders.length} detail={`${gp(openOrders.reduce((sum, o) => sum + Math.max(0, orderBalance(o)), 0))} to collect`} icon={<ClipboardList size={18} />} />
      <Stat label="Backpacks" value={backpacks.length} detail="Personal storage labels" icon={<BackpackIcon size={18} />} />
    </div>
    <Tabs tabs={[{ id: 'stock', label: 'Stock', count: lots.length }, { id: 'orders', label: 'Orders', count: orders.length }, { id: 'backpacks', label: 'Backpacks', count: backpacks.length }]} value={tab} onChange={value => { setTab(value); setQuery(''); navigate('supplies/' + value); }} />
    {tab === 'stock' && <>
      {shortages.length > 0 && <Notice tone="warning">{shortages.length} stock {shortages.length === 1 ? 'record has' : 'records have'} more reserved than actually owned. Add stock, lower the personal reserve or release an order allocation.</Notice>}
      <div className="panel"><div className="toolbar"><SearchBox value={query} onChange={setQuery} placeholder="Search your stock…" /><span className="muted">Quantities show your chosen selling unit</span></div>
        {filteredLots.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Item</th><th>On hand</th><th>Available</th><th>Reserved</th><th>Storage</th><th>Asking price</th><th aria-label="Actions" /></tr></thead><tbody>{filteredLots.map(lot => {
          const allocated = lotAllocated(state, lot.id), available = lotAvailable(state, lot), location = backpacks.find(b => b.id === lot.locationId);
          return <tr key={lot.id}><td><div className="item-with-sprite"><ItemSprite itemId={lot.itemId} name={itemMap.get(lot.itemId)?.name} /><span><strong>{itemMap.get(lot.itemId)?.name || lot.itemId}</strong><small className="muted" style={{ display: 'block' }}>{lot.chargesPerItem != null ? `${lot.chargesPerItem} charges per item` : itemMap.get(lot.itemId)?.category || 'Item'}{lot.notes ? ` · ${lot.notes}` : ''}</small></span></div></td><td><Quantity quantity={lot.quantity} unit={lot.unit} packSize={lot.packSize} /></td><td><span className={available < 0 ? 'text-danger' : ''}><Quantity quantity={available} unit={lot.unit} packSize={lot.packSize} /></span>{available < 0 && <Badge tone="warning">Shortage</Badge>}</td><td>{number(lot.personalReserve / lot.packSize, 2)} personal<br /><small className="muted">{number(allocated / lot.packSize, 2)} for orders · {labelUnit(lot.unit, 2)}</small></td><td>{location ? <>{location.name || location.color}<small className="muted" style={{ display: 'block' }}>{location.city}</small></> : <span className="muted">Unassigned</span>}</td><td>{gp(lot.askingPrice)}<small className="muted" style={{ display: 'block' }}>per {lot.unit}</small></td><td><div className="row-actions"><button className="icon-btn" title="Add quantity" aria-label={`Add ${itemMap.get(lot.itemId)?.name || 'item'} stock`} onClick={() => setAdjust({ lot, kind: 'add' })}><Plus size={16} /></button><button className="icon-btn" title="Use available stock" aria-label="Use available stock" onClick={() => setAdjust({ lot, kind: 'use' })}><ArrowUpRight size={16} /></button><button className="icon-btn" title="Edit or adjust" aria-label="Edit or adjust stock" onClick={() => setLotForm(lot)}><Edit3 size={16} /></button>{lot.quantity === 0 && <button className="icon-btn" aria-label="Remove empty stock record" onClick={() => setRemove({ kind: 'lot', id: lot.id, name: itemMap.get(lot.itemId)?.name || 'stock record' })}><Trash2 size={16} /></button>}</div></td></tr>;
        })}</tbody></table></div> : <EmptyState icon={<Boxes />} title={query ? 'No matching stock' : 'Your supplies start here'} description={query ? 'Try another item name or clear your search.' : 'Track any item, from runes and ammunition to equipment and food.'} action={!query && <button className="btn btn-primary" onClick={() => setLotForm('new')}><Plus size={16} />Add your first item</button>} />}
      </div>
      {state.movements.some(m => m.characterId === character.id) && <details className="panel" style={{ marginTop: 18 }}><summary style={{ padding: 16, cursor: 'pointer' }}>Recent stock activity</summary><div className="table-wrap"><table className="data-table"><thead><tr><th>Date</th><th>Item</th><th>Change in items</th><th>Reason</th></tr></thead><tbody>{state.movements.filter(m => m.characterId === character.id).slice(-20).reverse().map(m => <tr key={m.id}><td>{dateLabel(m.date)}</td><td><div className="item-with-sprite"><ItemSprite itemId={m.itemId} name={itemMap.get(m.itemId)?.name} size={28} /><span>{itemMap.get(m.itemId)?.name || m.itemId}</span></div></td><td>{m.delta > 0 ? '+' : ''}{number(m.delta)}</td><td>{m.reason}</td></tr>)}</tbody></table></div></details>}
    </>}
    {tab === 'orders' && <div className="panel"><div className="toolbar"><SearchBox value={query} onChange={setQuery} placeholder="Search buyers, cities or items…" /><select aria-label="Order filter" value={orderFilter} onChange={e => setOrderFilter(e.target.value)}><option value="open">Open orders</option><option value="history">Completed / cancelled</option><option value="all">All orders</option></select></div>{filteredOrders.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Buyer</th><th>Items</th><th>Order date</th><th>Value</th><th>Payment</th><th>Status</th><th /></tr></thead><tbody>{filteredOrders.map(o => <tr key={o.id}><td><strong>{o.buyer}</strong><small className="muted" style={{ display: 'block' }}>{o.city || 'No city'}</small></td><td>{o.lines.map(l => <div className="item-with-sprite" key={l.id}><ItemSprite itemId={l.itemId} name={l.nameSnapshot} size={28} /><span>{number(l.quantity / l.packSize, 2)} {labelUnit(l.unit, l.quantity / l.packSize)} {l.nameSnapshot}</span></div>)}</td><td>{dateLabel(o.date)}{o.imported && <small className="muted" style={{ display: 'block' }}>Workbook history</small>}</td><td>{gp(orderTotal(o))}</td><td>{gp(orderPaid(o))} paid{orderBalance(o) !== 0 && <small className="muted" style={{ display: 'block' }}>{gp(Math.abs(orderBalance(o)))} {orderBalance(o) > 0 ? 'due' : 'to refund'}</small>}</td><td><Badge tone={orderStatus(o) === 'Closed' ? 'success' : orderBalance(o) < 0 ? 'warning' : 'muted'}>{orderStatus(o)}</Badge></td><td><button className="btn btn-secondary" onClick={() => setOrderId(o.id)}>Manage</button></td></tr>)}</tbody></table></div> : <EmptyState icon={<ClipboardList />} title={query ? 'No matching orders' : orderFilter === 'open' ? 'All caught up' : 'No orders here yet'} description={orderFilter === 'open' && orders.length > 0 ? 'Your completed orders are saved in history. Start a new order whenever you need one.' : 'Create an order for any item. Allocate stock now or keep the remaining quantity as a backorder.'} action={<div className="row-actions"><button className="btn btn-primary" onClick={() => setOrderForm('new')}>New order</button>{orders.length > 0 && <button className="btn btn-secondary" onClick={() => setOrderFilter('all')}>View all orders</button>}</div>} />}</div>}
    {tab === 'backpacks' && <><Notice>These are your own colour and city labels. Link a stock record to a backpack when you know where it is stored.</Notice><div className="grid-2">{backpacks.map(b => <div className="card" key={b.id}><div className="toolbar"><div><Badge>{b.color}</Badge><h3 style={{ marginBottom: 4 }}>{b.name || `${b.color} backpack`}</h3><p className="muted">{b.city || 'City not set'}</p></div><div className="backpack-card-art"><BackpackSprite color={b.color} size={64} /></div></div><p>{b.purpose || 'No purpose added yet'}</p><small className="muted">{lots.filter(l => l.locationId === b.id).length} linked stock records</small><div className="modal-actions"><button className="btn btn-secondary" onClick={() => setBackpackForm(b)}><Edit3 size={15} />Edit</button><button className="btn btn-ghost" onClick={() => setRemove({ kind: 'backpack', id: b.id, name: b.name || `${b.color} backpack` })}><Trash2 size={15} />Remove</button></div></div>)}</div>{!backpacks.length && <EmptyState icon={<BackpackIcon />} title="Give every backpack a purpose" description="Save its colour, city and contents so you can find supplies later." action={<button className="btn btn-primary" onClick={() => setBackpackForm('new')}>Add backpack</button>} />}<p className="backpack-art-credit">Tibia graphics © CipSoft GmbH · Standard backpack artwork from Tibia Wiki Brasil. <a href={backpackSpriteManifest} target="_blank" rel="noreferrer">Image sources</a></p></>}
    {lotForm && <StockForm key={lotForm === 'new' ? 'new' : lotForm.id} lot={lotForm === 'new' ? undefined : lotForm} onClose={() => setLotForm(null)} />}
    {adjust && <StockChange lot={adjust.lot} kind={adjust.kind} onClose={() => setAdjust(null)} />}
    {orderForm && <OrderForm order={orderForm === 'new' ? undefined : orderForm} onClose={() => setOrderForm(null)} onSaved={id => { setOrderForm(null); setOrderId(id); setTab('orders'); navigate('supplies/orders'); }} />}
    {selectedOrder && <OrderDetails order={selectedOrder} onClose={() => setOrderId(null)} onEdit={() => { setOrderForm(selectedOrder); setOrderId(null); }} />}
    {backpackForm && <BackpackForm backpack={backpackForm === 'new' ? undefined : backpackForm} onClose={() => setBackpackForm(null)} />}
    {remove && <Modal title={`Remove ${remove.name}?`} onClose={() => setRemove(null)}><p>{remove.kind === 'backpack' ? 'Stock will keep its quantity and become unassigned. This removes the storage label.' : 'The empty stock record will be removed. Its transaction history stays in recent activity.'}</p><div className="modal-actions"><button className="btn btn-secondary" onClick={() => setRemove(null)}>Keep it</button><button className="btn btn-primary" onClick={deleteRecord}>Remove</button></div></Modal>}
  </>;
}

function StockForm({ lot, onClose }: { lot?: StockLot; onClose: () => void }) {
  const { state, character, server, update, notify } = useApp();
  const items = catalogItems(state, server.id).sort((a, b) => a.name.localeCompare(b.name));
  const [itemId, setItemId] = useState(lot?.itemId || items[0]?.id || '');
  const [custom, setCustom] = useState(false), [customName, setCustomName] = useState(''), [category, setCategory] = useState('Other');
  const [unit, setUnit] = useState(lot?.unit || 'piece'), [packSize, setPackSize] = useState(lot?.packSize || 1);
  const [quantity, setQuantity] = useState(lot ? lot.quantity / lot.packSize : 0), [personal, setPersonal] = useState(lot ? lot.personalReserve / lot.packSize : 0);
  const [price, setPrice] = useState(lot?.askingPrice || 0), [locationId, setLocationId] = useState(lot?.locationId || ''), [notes, setNotes] = useState(lot?.notes || '');
  const [charges, setCharges] = useState(lot?.chargesPerItem == null ? '' : String(lot.chargesPerItem));
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const save = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const base = baseQuantity(quantity, packSize), reserved = baseQuantity(personal, packSize);
      if (!unit.trim() || !Number.isFinite(price) || price < 0) throw new Error('Enter a selling unit and a valid asking price.');
      if (charges !== '' && (!Number.isSafeInteger(Number(charges)) || Number(charges) < 0)) throw new Error('Charges must be a non-negative whole number. Leave blank when unknown or not applicable.');
      const newItemId = custom ? uid() : itemId, recordId = lot?.id || uid(), operationId = uid();
      await update(draft => {
        if (custom) {
          if (!customName.trim()) throw new Error('Enter a name for the custom item.');
          if (catalogItems(draft, server.id).some(i => i.name.toLowerCase() === customName.trim().toLowerCase())) throw new Error('An item with that name already exists. Select it from the catalogue.');
          draft.items.push({ id: newItemId, name: customName.trim(), aliases: [], category, serverId: server.id, source: 'Your custom item' });
        } else if (!catalogItems(draft, server.id).some(i => i.id === newItemId)) throw new Error('Choose an item.');
        const current = draft.lots.find(l => l.id === recordId);
        if (lot && (!current || current.quantity !== lot.quantity)) throw new Error('This stock changed while the form was open. Close and reopen it to use the latest count.');
        const data: StockLot = { id: recordId, characterId: character.id, itemId: newItemId, quantity: base, personalReserve: reserved, unit: unit.trim(), packSize, askingPrice: price, locationId: locationId || undefined, notes: notes.trim(), chargesPerItem: charges === '' ? null : Number(charges) };
        if (current) {
          if ((current.chargesPerItem ?? null) !== data.chargesPerItem && lotAllocated(draft, current.id)) throw new Error('Release order allocations before changing this lot’s charge state.');
          const delta = base - current.quantity;
          changeStock(draft, { lotId: recordId, delta, date: new Date().toISOString(), reason: 'Stock count adjusted', operationId });
          Object.assign(current, data);
        } else {
          draft.lots.push(data);
          if (base) draft.movements.push({ id: operationId, operationId, lotId: recordId, characterId: character.id, itemId: newItemId, delta: base, date: new Date().toISOString(), reason: 'Opening stock' });
        }
      });
      notify(lot ? 'Stock updated.' : 'Stock added.'); onClose();
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };
  const resize = (value: number) => { if (value > 0) { setQuantity(quantity * packSize / value); setPersonal(personal * packSize / value); } setPackSize(value); };
  return <Modal title={lot ? 'Edit stock & reservations' : 'Add stock'} onClose={onClose} wide><form onSubmit={save}>{error && <Notice tone="warning">{error}</Notice>}<div className="form-grid">
    <Field label="Item">{custom ? <input required value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Name your item" /> : <select required disabled={Boolean(lot)} value={itemId} onChange={e => setItemId(e.target.value)}>{items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>}</Field>
    {!lot && <Field label={custom ? 'Category' : 'Missing an item?'}>{custom ? <input value={category} onChange={e => setCategory(e.target.value)} /> : <button type="button" className="btn btn-secondary" onClick={() => setCustom(true)}>Create a custom item</button>}</Field>}
    <Field label="Selling unit"><select value={['piece', 'backpack', 'stack', 'package'].includes(unit) ? unit : 'package'} onChange={e => { setUnit(e.target.value); if (e.target.value === 'piece') resize(1); }}><option value="piece">Individual item</option><option value="backpack">Backpack</option><option value="stack">Defined stack</option><option value="package">Package</option></select></Field>
    <Field label="Individual items per unit" hint="This is your package definition, not rune charges."><input type="number" min="1" step="1" required value={packSize} disabled={unit === 'piece'} onChange={e => resize(Number(e.target.value))} /></Field>
    <Field label={`On hand (${unit})`} hint={`${number(quantity * packSize)} individual items`}><input type="number" min="0" step="any" required value={quantity} onChange={e => setQuantity(Number(e.target.value))} /></Field>
    <Field label={`Personal reserve (${unit})`} hint="Set aside for your own use."><input type="number" min="0" step="any" required value={personal} onChange={e => setPersonal(Number(e.target.value))} /></Field>
    <Field label={`Asking price per ${unit} (gp)`}><input type="number" min="0" step="0.01" required value={price} onChange={e => setPrice(Number(e.target.value))} /></Field>
    <Field label="Charges per individual item" hint="Optional. Keep differently used runes in separate stock records."><input type="number" min="0" step="1" value={charges} onChange={e => setCharges(e.target.value)} placeholder="Unknown / not applicable" /></Field>
    <Field label="Backpack / storage"><select value={locationId} onChange={e => setLocationId(e.target.value)}><option value="">Unassigned</option>{state.backpacks.filter(b => b.characterId === character.id).map(b => <option key={b.id} value={b.id}>{b.name || b.color} · {b.city}</option>)}</select></Field>
    <Field label="Notes"><input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional note" /></Field>
  </div>{custom && <button type="button" className="btn btn-ghost" onClick={() => setCustom(false)}>Choose an existing item instead</button>}<div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save stock'}</button></div></form></Modal>;
}

function StockChange({ lot, kind, onClose }: { lot: StockLot; kind: 'add' | 'use'; onClose: () => void }) {
  const { state, server, update, notify } = useApp();
  const [quantity, setQuantity] = useState(1), [reason, setReason] = useState(kind === 'add' ? 'Stock added' : 'Used during play'), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [operationId] = useState(uid);
  const name = catalogItems(state, server.id).find(i => i.id === lot.itemId)?.name || 'item';
  const save = async (e: FormEvent) => { e.preventDefault(); setBusy(true); setError(''); try {
    const base = baseQuantity(quantity, lot.packSize); if (!base) throw new Error('Enter a quantity greater than zero.');
    await update(draft => changeStock(draft, { lotId: lot.id, delta: kind === 'add' ? base : -base, reason: reason.trim() || (kind === 'add' ? 'Added' : 'Used'), date: new Date().toISOString(), operationId, consume: kind === 'use' }));
    notify(kind === 'add' ? 'Stock added. You can allocate it to open orders.' : 'Usage recorded.'); onClose();
  } catch (e) { setError(errorText(e)); } finally { setBusy(false); } };
  return <Modal title={`${kind === 'add' ? 'Add' : 'Use'} ${name}`} onClose={onClose}><form onSubmit={save}>{error && <Notice tone="warning">{error}</Notice>}<Field label={`Quantity (${lot.unit})`} hint={`${number(quantity * lot.packSize)} individual items`}><input type="number" min="0" step="any" required value={quantity} onChange={e => setQuantity(Number(e.target.value))} /></Field><Field label="Reason"><input value={reason} onChange={e => setReason(e.target.value)} /></Field>{kind === 'use' && <p className="muted">Personal and order reservations are protected. To correct a count after a loss, use Edit stock.</p>}<div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy}>{kind === 'add' ? 'Add stock' : 'Record usage'}</button></div></form></Modal>;
}

interface LineForm { id: string; itemId: string; quantity: number; unit: string; packSize: number; unitPrice: number; charges: string }
function OrderForm({ order, onClose, onSaved }: { order?: Order; onClose: () => void; onSaved: (id: string) => void }) {
  const { state, character, server, update, notify } = useApp();
  const items = catalogItems(state, server.id).sort((a, b) => a.name.localeCompare(b.name));
  const chooseLine = (itemId: string): LineForm => { const lot = state.lots.find(l => l.characterId === character.id && l.itemId === itemId), item = items.find(i => i.id === itemId), packSize = lot?.packSize || item?.packSize || 1, charges = lot ? lot.chargesPerItem : item?.charges; return { id: uid(), itemId, quantity: 1, unit: lot?.unit || (packSize > 1 ? 'package' : 'piece'), packSize, unitPrice: lot?.askingPrice || 0, charges: charges == null ? '' : String(charges) }; };
  const [buyer, setBuyer] = useState(order?.buyer || ''), [city, setCity] = useState(order?.city || ''), [date, setDate] = useState(order?.date || today()), [dueDate, setDueDate] = useState(order?.dueDate || ''), [notes, setNotes] = useState(order?.notes || '');
  const [lines, setLines] = useState<LineForm[]>(order ? order.lines.map(l => ({ id: l.id, itemId: l.itemId, quantity: l.quantity / l.packSize, unit: l.unit, packSize: l.packSize, unitPrice: l.unitPrice, charges: l.chargesPerItem == null ? '' : String(l.chargesPerItem) })) : [chooseLine(state.lots.find(l => l.characterId === character.id)?.itemId || items[0]?.id || '')]);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const linesLocked = Boolean(order && (order.imported || order.cancelled || order.payments.length || order.deliveries.length || order.lines.some(l => l.delivered)));
  const patch = (id: string, changes: Partial<LineForm>) => setLines(prev => prev.map(l => l.id === id ? { ...l, ...changes } : l));
  const save = async (e: FormEvent) => { e.preventDefault(); setError(''); setBusy(true); try {
    if (!buyer.trim()) throw new Error('Enter the buyer’s character name.');
    const id = order?.id || uid();
    await update(draft => {
      const existing = draft.orders.find(o => o.id === id);
      if (order && !existing) throw new Error('This order no longer exists.');
      if (existing && !linesLocked && (existing.payments.length || existing.deliveries.length || existing.cancelled || existing.lines.some(l => l.delivered))) throw new Error('This order changed while you were editing it. Reopen it to preserve its history.');
      const freshLines: OrderLine[] = linesLocked && existing ? existing.lines : lines.map(l => {
        const item = catalogItems(draft, server.id).find(i => i.id === l.itemId);
        if (!item) throw new Error('Choose a valid item for every order line.');
        const quantity = baseQuantity(l.quantity, l.packSize);
        if (!quantity || !Number.isFinite(l.unitPrice) || l.unitPrice < 0 || !l.unit.trim()) throw new Error('Every line needs a positive quantity, selling unit and valid price.');
        if (l.charges !== '' && (!Number.isSafeInteger(Number(l.charges)) || Number(l.charges) < 0)) throw new Error('Rune charges must be a non-negative whole number.');
        return { id: l.id, itemId: item.id, nameSnapshot: item.name, quantity, delivered: 0, unit: l.unit, packSize: l.packSize, unitPrice: l.unitPrice, allocations: [], chargesPerItem: l.charges === '' ? null : Number(l.charges) };
      });
      if (existing) Object.assign(existing, { buyer: buyer.trim(), city: city.trim(), date, dueDate: dueDate || undefined, notes: notes.trim(), lines: freshLines });
      else draft.orders.push({ id, characterId: character.id, buyer: buyer.trim(), city: city.trim(), date, dueDate: dueDate || undefined, notes: notes.trim(), lines: freshLines, payments: [], deliveries: [], cancelled: false });
      if (!linesLocked) allocateOrder(draft, id);
    });
    notify(order ? 'Order updated.' : 'Order created. Available stock has been allocated.'); onSaved(id);
  } catch (e) { setError(errorText(e)); } finally { setBusy(false); } };
  return <Modal title={order ? 'Edit order' : 'New order'} onClose={onClose} wide><form onSubmit={save}>{error && <Notice tone="warning">{error}</Notice>}<div className="form-grid"><Field label="Buyer’s character name"><input required value={buyer} onChange={e => setBuyer(e.target.value)} placeholder="Who is the order for?" /></Field><Field label="Delivery city"><input value={city} onChange={e => setCity(e.target.value)} placeholder="Edron" /></Field><Field label="Order date"><input type="date" required value={date} onChange={e => setDate(e.target.value)} /></Field><Field label="Delivery due (optional)"><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></Field></div>
    {linesLocked && <Notice>Items and agreed prices are preserved once a payment or delivery exists. You can still update the buyer, dates and notes.</Notice>}
    {lines.map((line, index) => <div className="card" style={{ marginTop: 14 }} key={line.id}><div className="toolbar"><div className="item-with-sprite"><ItemSprite itemId={line.itemId} name={items.find(item => item.id === line.itemId)?.name} /><h3>Item {index + 1}</h3></div>{lines.length > 1 && !linesLocked && <button type="button" className="icon-btn" aria-label="Remove order line" onClick={() => setLines(prev => prev.filter(l => l.id !== line.id))}><Trash2 size={16} /></button>}</div><div className="form-grid"><Field label="Item"><select disabled={linesLocked} value={line.itemId} onChange={e => patch(line.id, { ...chooseLine(e.target.value), id: line.id })}>{items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></Field><Field label="Selling unit"><select disabled={linesLocked} value={line.unit} onChange={e => patch(line.id, { unit: e.target.value, ...(e.target.value === 'piece' ? { packSize: 1, quantity: line.quantity * line.packSize } : {}) })}><option value="piece">Individual item</option><option value="backpack">Backpack</option><option value="stack">Defined stack</option><option value="package">Package</option></select></Field><Field label="Items per selling unit"><input type="number" required min="1" step="1" disabled={linesLocked || line.unit === 'piece'} value={line.packSize} onChange={e => patch(line.id, { packSize: Number(e.target.value) })} /></Field><Field label={`Quantity (${line.unit})`} hint={`${number(line.quantity * line.packSize)} individual items`}><input required type="number" min="0" step="any" disabled={linesLocked} value={line.quantity} onChange={e => patch(line.id, { quantity: Number(e.target.value) })} /></Field><Field label={`Agreed gp per ${line.unit}`}><input required type="number" min="0" step="0.01" disabled={linesLocked} value={line.unitPrice} onChange={e => patch(line.id, { unitPrice: Number(e.target.value) })} /></Field><Field label="Charges per individual item" hint="Blank matches stock with unknown / unspecified charges."><input type="number" min="0" step="1" disabled={linesLocked} value={line.charges} onChange={e => patch(line.id, { charges: e.target.value })} placeholder="Unknown / not applicable" /></Field></div><p className="muted">Line total <strong>{gp(line.quantity * line.unitPrice)}</strong></p></div>)}
    {!linesLocked && <button type="button" className="btn btn-secondary" style={{ marginTop: 14 }} onClick={() => setLines(prev => [...prev, chooseLine(items[0]?.id || '')])}><Plus size={16} />Add another item</button>}
    <Field label="Order notes"><textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Pickup details or other arrangements" /></Field><div className="modal-actions"><strong style={{ marginRight: 'auto' }}>Total {gp(lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0))}</strong><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save order'}</button></div></form></Modal>;
}

function OrderDetails({ order, onClose, onEdit }: { order: Order; onClose: () => void; onEdit: () => void }) {
  const { state, update, notify } = useApp();
  const [action, setAction] = useState<'delivery' | 'payment' | 'cancel' | 'release' | null>(null);
  const [lineId, setLineId] = useState(order.lines.find(l => lineRemaining(l) > 0)?.id || order.lines[0]?.id || '');
  const [lotId, setLotId] = useState(''), [quantity, setQuantity] = useState(1), [payment, setPayment] = useState(Math.abs(orderBalance(order))), [paymentKind, setPaymentKind] = useState(orderBalance(order) < 0 ? 'refund' : 'payment');
  const [date, setDate] = useState(today()), [operationId, setOperationId] = useState(uid), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const line = order.lines.find(l => l.id === lineId);
  const matchingLots = line ? state.lots.filter(l => l.characterId === order.characterId && l.itemId === line.itemId && chargesMatch(line, l)) : [];
  const shortage = order.lines.some(l => l.allocations.some(a => { const lot = state.lots.find(s => s.id === a.lotId); return !lot || lotAvailable(state, lot) < 0; }));
  const selectedLot = matchingLots.find(l => l.id === lotId) || matchingLots.find(l => line && deliverableFromLot(state, order, line, l) > 0) || matchingLots[0];
  const run = async (recipe: (draft: AppState) => void, message: string) => { setBusy(true); setError(''); try { await update(recipe); notify(message); setAction(null); setOperationId(uid()); } catch (e) { setError(errorText(e)); } finally { setBusy(false); } };
  const openAction = (next: typeof action) => { setAction(next); setError(''); setOperationId(uid()); setPayment(Math.abs(orderBalance(order))); setPaymentKind(orderBalance(order) < 0 ? 'refund' : 'payment'); };
  const actionSubmit = (e: FormEvent) => { e.preventDefault(); if (action === 'delivery') {
    if (!line || !selectedLot) { setError('Add matching stock before recording a delivery.'); return; }
    let base: number; try { base = baseQuantity(quantity, line.packSize); } catch (e) { setError(errorText(e)); return; }
    void run(draft => { deliverOrder(draft, { orderId: order.id, lineId: line.id, lotId: selectedLot.id, quantity: base, date, operationId }); }, 'Delivery recorded. Stock and reservations updated.');
  } else if (action === 'payment') void run(draft => recordPayment(draft, { orderId: order.id, amount: paymentKind === 'refund' ? -payment : payment, date, operationId }), paymentKind === 'refund' ? 'Refund recorded.' : 'Payment recorded.'); };
  return <Modal title={`Order for ${order.buyer}`} onClose={onClose} wide><div className="toolbar"><div><Badge tone={orderStatus(order) === 'Closed' ? 'success' : 'muted'}>{orderStatus(order)}</Badge><p className="muted">{order.city || 'No delivery city'} · {dateLabel(order.date)}{order.dueDate ? ` · Due ${dateLabel(order.dueDate)}` : ''}</p></div><button className="btn btn-secondary" onClick={onEdit}><Edit3 size={15} />Edit details</button></div>
    {order.imported && <Notice>Imported completed order. Its deliveries are historical and have not been deducted from your opening stock again.</Notice>}
    {shortage && <Notice tone="warning">Some allocated stock is now short after a count adjustment. Replenish it or release this order’s allocations and allocate the stock that is actually available before delivery.</Notice>}
    <div className="stat-grid"><Stat label={order.cancelled ? 'Delivered value' : 'Order value'} value={gp(orderTotal(order))} /><Stat label="Paid" value={gp(orderPaid(order))} /><Stat label={orderBalance(order) < 0 ? 'Refund due' : 'To collect'} value={gp(Math.abs(orderBalance(order)))} /></div>
    <div className="table-wrap"><table className="data-table"><thead><tr><th>Item / agreement</th><th>Ordered</th><th>Delivered</th><th>Allocated / still needed</th></tr></thead><tbody>{order.lines.map(l => <tr key={l.id}><td><div className="item-with-sprite"><ItemSprite itemId={l.itemId} name={l.nameSnapshot} /><span><strong>{l.nameSnapshot}</strong><small className="muted" style={{ display: 'block' }}>{gp(l.unitPrice)} per {l.unit} · {l.packSize} items per unit{l.chargesPerItem != null ? ` · ${l.chargesPerItem} charges each` : ''}</small></span></div></td><td><Quantity quantity={l.quantity} unit={l.unit} packSize={l.packSize} /></td><td><Quantity quantity={l.delivered} unit={l.unit} packSize={l.packSize} /></td><td>{order.cancelled ? <span className="muted">Remainder cancelled</span> : <>{number(lineAllocated(l) / l.packSize, 2)} {labelUnit(l.unit, 2)} allocated<small className="muted" style={{ display: 'block' }}>{number(Math.max(0, lineRemaining(l) - lineAllocated(l)) / l.packSize, 2)} still needed</small></>}</td></tr>)}</tbody></table></div>
    {order.notes && <p>{order.notes}</p>}
    <div className="toolbar" style={{ margin: '18px 0' }}><div className="row-actions">{orderOutstanding(order) > 0 && <><button className="btn btn-primary" onClick={() => openAction('delivery')}><PackageCheck size={16} />Record delivery</button><button className="btn btn-secondary" disabled={busy} onClick={() => void run(draft => { allocateOrder(draft, order.id); }, 'Available matching stock allocated.')}>Allocate stock</button></>}{(orderBalance(order) !== 0 || orderPaid(order) > 0) && <button className="btn btn-secondary" onClick={() => openAction('payment')}><Coins size={16} />Payment / refund</button>}</div>{orderOutstanding(order) > 0 && <button className="btn btn-ghost" onClick={() => openAction('cancel')}>Cancel remaining goods</button>}</div>
    {order.lines.some(l => lineAllocated(l)) && <button className="btn btn-ghost" onClick={() => openAction('release')}>Release this order’s stock allocations</button>}
    {error && <Notice tone="warning">{error}</Notice>}
    {action === 'cancel' && <div className="card"><h3>Cancel undelivered goods?</h3><p>Delivered items and payment history stay recorded. Undelivered reservations are released. Any advance payment above the delivered value will be shown as a refund due.</p><div className="modal-actions"><button className="btn btn-secondary" onClick={() => setAction(null)}>Keep order open</button><button className="btn btn-primary" disabled={busy} onClick={() => void run(draft => cancelOutstanding(draft, order.id), 'Undelivered quantities cancelled.')}>Cancel remaining goods</button></div></div>}
    {action === 'release' && <div className="card"><h3>Release allocated stock?</h3><p>The order stays open. Its undelivered quantity becomes still needed, and its allocated items become available to other orders.</p><div className="modal-actions"><button className="btn btn-secondary" onClick={() => setAction(null)}>Keep allocations</button><button className="btn btn-primary" disabled={busy} onClick={() => void run(draft => releaseOrderAllocations(draft, order.id), 'Allocations released.')}>Release allocations</button></div></div>}
    {(action === 'delivery' || action === 'payment') && <form className="card" onSubmit={actionSubmit}><h3>{action === 'delivery' ? 'Record an actual delivery' : 'Record money received or refunded'}</h3><div className="form-grid">{action === 'delivery' ? <><Field label="Order line"><select value={lineId} onChange={e => { setLineId(e.target.value); setLotId(''); setQuantity(1); }}>{order.lines.filter(l => lineRemaining(l) > 0).map(l => <option key={l.id} value={l.id}>{l.nameSnapshot}</option>)}</select></Field><Field label="Take stock from"><select required value={selectedLot?.id || ''} onChange={e => setLotId(e.target.value)}>{!matchingLots.length && <option value="">No matching stock</option>}{matchingLots.map(l => <option key={l.id} value={l.id}>{state.backpacks.find(b => b.id === l.locationId)?.name || 'Unassigned stock'} · {number(line ? deliverableFromLot(state, order, line, l) : 0)} items available{l.notes ? ` · ${l.notes}` : ''}</option>)}</select></Field><Field label={`Delivered quantity (${line?.unit || 'items'})`} hint={`${number(quantity * (line?.packSize || 1))} individual items`}><input type="number" min="0" step="any" required value={quantity} onChange={e => setQuantity(Number(e.target.value))} /></Field></> : <><Field label="Transaction"><select value={paymentKind} onChange={e => setPaymentKind(e.target.value)}><option value="payment">Payment received</option><option value="refund">Refund paid</option></select></Field><Field label="Amount (gp)"><input type="number" min="0.01" step="0.01" required value={payment} onChange={e => setPayment(Number(e.target.value))} /></Field></>}<Field label="Date"><input type="date" required value={date} onChange={e => setDate(e.target.value)} /></Field></div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setAction(null)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : action === 'delivery' ? 'Confirm delivery' : 'Save payment'}</button></div></form>}
    {(order.deliveries.length > 0 || order.payments.length > 0) && <details style={{ marginTop: 18 }}><summary style={{ cursor: 'pointer' }}>Delivery & payment history</summary><div className="table-wrap"><table className="data-table"><thead><tr><th>Date</th><th>Event</th><th>Quantity / amount</th></tr></thead><tbody>{[...order.deliveries.map(d => ({ id: d.id, date: d.date, event: `Delivered ${order.lines.find(l => l.id === d.lineId)?.nameSnapshot || 'item'}`, value: `${number(d.quantity)} items` })), ...order.payments.map(p => ({ id: p.id, date: p.date, event: p.amount < 0 ? 'Refund' : 'Payment', value: gp(Math.abs(p.amount)) }))].sort((a, b) => b.date.localeCompare(a.date)).map(event => <tr key={event.id}><td>{dateLabel(event.date)}</td><td>{event.event}</td><td>{event.value}</td></tr>)}</tbody></table></div></details>}
    <div className="modal-actions"><button className="btn btn-secondary" onClick={onClose}>Done</button></div>
  </Modal>;
}

function BackpackForm({ backpack, onClose }: { backpack?: Backpack; onClose: () => void }) {
  const { character, update, notify } = useApp();
  const [color, setColor] = useState(backpack?.color || 'Blue'), [city, setCity] = useState(backpack?.city || ''), [name, setName] = useState(backpack?.name || ''), [purpose, setPurpose] = useState(backpack?.purpose || ''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const save = async (e: FormEvent) => { e.preventDefault(); setBusy(true); setError(''); try { if (!color.trim()) throw new Error('Choose a backpack colour or enter your own label.'); const id = backpack?.id || uid(); await update(draft => { const record = { id, characterId: character.id, color: color.trim(), city: city.trim(), name: name.trim() || `${color.trim()} backpack`, purpose: purpose.trim() }; const existing = draft.backpacks.find(b => b.id === id); if (existing) Object.assign(existing, record); else draft.backpacks.push(record); }); notify('Backpack saved.'); onClose(); } catch (e) { setError(errorText(e)); } finally { setBusy(false); } };
  return <Modal title={backpack ? 'Edit backpack' : 'Add backpack'} onClose={onClose}><form onSubmit={save}>{error && <Notice tone="warning">{error}</Notice>}<div className="backpack-art-preview"><BackpackSprite color={color} size={48} /><div><strong>{name.trim() || `${color || 'Custom'} backpack`}</strong><p>{backpackSpriteId(color) ? 'Choose the matching backpack below, or keep your own colour label.' : 'Custom colour label. A matching Tibia sprite is not available.'}</p></div></div><div className="backpack-sprite-picker" role="group" aria-label="Choose a backpack colour">{backpackChoices.map(choice => <button type="button" key={choice.id} className={'backpack-sprite-choice ' + (backpackSpriteId(color) === choice.id ? 'selected' : '')} aria-pressed={backpackSpriteId(color) === choice.id} onClick={() => setColor(choice.color)}><BackpackSprite color={choice.color} size={32} /><span>{choice.color}</span></button>)}</div><div className="form-grid"><Field label="Colour / personal label" hint="Gray and Grey use the same actual sprite. Brown uses the standard backpack."><input required value={color} onChange={e => setColor(e.target.value)} placeholder="Blue" /></Field><Field label="City"><input value={city} onChange={e => setCity(e.target.value)} placeholder="Edron" /></Field><Field label="Storage label"><input value={name} onChange={e => setName(e.target.value)} placeholder={`${color} backpack`} /></Field><Field label="Purpose / contents"><input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Runes for hunts, gold, supplies…" /></Field></div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy}>Save backpack</button></div></form></Modal>;
}
