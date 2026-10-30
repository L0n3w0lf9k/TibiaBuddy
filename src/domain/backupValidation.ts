import type { AppState } from '../types';
import { activeSeconds, checkXP, levelForXP, MAX_LEVEL } from './xp';
import { catalogOffers, overrideKey } from './catalog';
import { spells } from '../data/game';
import { normalizeGuideUrl } from './guides';

type DataRecord = Record<string, unknown>;
const MAX_RECORDS = 100_000;
const MAX_DATE = 8_640_000_000_000_000;
function fail(where: string, message: string): never { throw new Error(`Invalid backup: ${where} ${message}`); }
function object(value: unknown, where: string): asserts value is DataRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail(where, 'must be an object.');
  for (const key of Object.keys(value)) if (['__proto__', 'prototype', 'constructor'].includes(key)) fail(where, 'contains an unsupported property.');
}
function string(value: unknown, where: string, nonempty = false): asserts value is string {
  if (typeof value !== 'string' || (nonempty && !value.trim()) || value.length > 1_000_000) fail(where, 'must be valid text.');
}
function id(value: unknown, where: string): asserts value is string { string(value, where, true); if (value.length > 500 || value.includes('::') || value.includes('\0')) fail(where, 'has an invalid identifier.'); }
function bool(value: unknown, where: string): asserts value is boolean { if (typeof value !== 'boolean') fail(where, 'must be true or false.'); }
function numeric(value: unknown, where: string, min = 0, max = Number.MAX_SAFE_INTEGER): asserts value is number { if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) fail(where, 'has an invalid number.'); }
function integer(value: unknown, where: string, min = 0, max = Number.MAX_SAFE_INTEGER): asserts value is number { numeric(value, where, min, max); if (!Number.isSafeInteger(value)) fail(where, 'must be a whole number.'); }
function optionalText(value: unknown, where: string) { if (value !== undefined) string(value, where); }
function optionalNumber(value: unknown, where: string, whole = false, min = 0, max = Number.MAX_SAFE_INTEGER) { if (value !== undefined && value !== null) { if (whole) integer(value, where, min, max); else numeric(value, where, min, max); } }
function dateOnly(value: unknown, where: string) { string(value, where); if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value + 'T00:00:00Z')) || new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) !== value) fail(where, 'must be a valid date (YYYY-MM-DD).'); }
function timestamp(value: unknown, where: string) { numeric(value, where, -MAX_DATE, MAX_DATE); }
function eventDate(value: unknown, where: string) {
  string(value, where);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) dateOnly(value, where);
  else {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) fail(where, 'must be a valid timestamp.');
    dateOnly(value.slice(0, 10), where);
  }
}
function array(value: unknown, where: string): asserts value is unknown[] { if (!Array.isArray(value) || value.length > MAX_RECORDS) fail(where, 'must be a supported list.'); }
function stringList(value: unknown, where: string) { array(value, where); value.forEach(v => string(v, where)); }
function keyedList(value: unknown, where: string, ids = new Set<string>()): asserts value is DataRecord[] {
  array(value, where);
  for (const entry of value) { object(entry, where); id(entry.id, where + ' identity'); if (ids.has(entry.id)) fail(where, 'contains a duplicate identity.'); ids.add(entry.id); }
}
function whitelist(record: DataRecord, keys: string[], where: string) { const allowed = new Set(keys); for (const key of Object.keys(record)) if (!allowed.has(key)) fail(where, `contains unsupported field “${key}”.`); }
function jsonValue(value: unknown, where: string, depth = 0): void {
  if (depth > 25) fail(where, 'is nested too deeply.');
  if (value === null || value === undefined || typeof value === 'boolean') return;
  if (typeof value === 'string') { string(value, where); return; }
  if (typeof value === 'number') { numeric(value, where, -Number.MAX_VALUE, Number.MAX_VALUE); return; }
  if (Array.isArray(value)) { array(value, where); value.forEach(v => jsonValue(v, where, depth + 1)); return; }
  object(value, where); Object.values(value).forEach(v => jsonValue(v, where, depth + 1));
}
function itemFields(item: DataRecord, where: string, partial: boolean) {
  if (!partial || item.name !== undefined) string(item.name, where + ' name', true);
  if (!partial || item.category !== undefined) string(item.category, where + ' category');
  if (!partial || item.aliases !== undefined) stringList(item.aliases, where + ' aliases');
  for (const field of ['weight', 'attack', 'defense', 'armor']) optionalNumber(item[field], where + ' ' + field);
  optionalNumber(item.charges, where + ' charges', true);
  optionalNumber(item.packSize, where + ' package size', true, 1);
  optionalText(item.image, where + ' image'); optionalText(item.source, where + ' source');
}
function npcFields(npc: DataRecord, where: string, partial: boolean) {
  if (!partial || npc.name !== undefined) string(npc.name, where + ' name', true);
  if (!partial || npc.city !== undefined) string(npc.city, where + ' city');
  optionalText(npc.notes, where + ' notes');
  optionalNumber(npc.x, where + ' X', true, 0, 65535); optionalNumber(npc.y, where + ' Y', true, 0, 65535); optionalNumber(npc.z, where + ' Z', true, 0, 15);
}

/** Validate an imported snapshot without changing any value or the current journal. */
export function validateBackup(data: unknown): asserts data is AppState {
  object(data, 'journal');
  if (data.schemaVersion !== 1) fail('schema version', 'is not supported; use a version 1 Tibia Buddy backup.');
  whitelist(data, ['schemaVersion', 'revision', 'activeCharacterId', 'characters', 'servers', 'items', 'npcs', 'offers', 'itemOverrides', 'npcOverrides', 'offerOverrides', 'spellOverrides', 'lots', 'orders', 'movements', 'backpacks', 'hunts', 'bookmarks', 'guideLinks', 'favourites', 'preferences'], 'journal');
  integer(data.revision, 'revision'); id(data.activeCharacterId, 'active character');
  const listKeys = ['characters', 'servers', 'items', 'npcs', 'offers', 'lots', 'orders', 'movements', 'backpacks', 'hunts', 'bookmarks'] as const;
  for (const key of listKeys) keyedList(data[key], key);
  for (const key of ['itemOverrides', 'npcOverrides', 'offerOverrides', 'preferences']) object(data[key], key);
  if (data.spellOverrides !== undefined) object(data.spellOverrides, 'spell overrides');
  if (data.guideLinks !== undefined) keyedList(data.guideLinks, 'guide links');
  stringList(data.favourites, 'favourites');
  const s = data as unknown as AppState;
  for (const guide of s.guideLinks ?? []) {
    object(guide, 'guide');
    whitelist(guide, ['id', 'title', 'url', 'description', 'kind', 'vocations', 'versionLabel', 'createdAt', 'updatedAt'], 'guide');
    string(guide.title, 'guide title', true); string(guide.url, 'guide URL', true);
    string(guide.description, 'guide description'); string(guide.versionLabel, 'guide version');
    if (guide.title.length > 160 || guide.url.length > 2048 || guide.description.length > 1000 || guide.versionLabel.length > 100) fail('guide', 'contains text beyond the supported length.');
    try { normalizeGuideUrl(guide.url); } catch { fail('guide URL', 'must be an http/https link without credentials or control characters.'); }
    if (!['article', 'video', 'reference'].includes(guide.kind)) fail('guide kind', 'is unsupported.');
    array(guide.vocations, 'guide vocations');
    if (guide.vocations.some(v => !['knight', 'paladin', 'sorcerer', 'druid'].includes(v)) || new Set(guide.vocations).size !== guide.vocations.length) fail('guide vocations', 'must contain distinct classic vocations.');
    eventDate(guide.createdAt, 'guide creation time'); eventDate(guide.updatedAt, 'guide update time');
    if (!guide.createdAt.includes('T') || !guide.updatedAt.includes('T')) fail('guide timestamps', 'must include a time and timezone.');
  }
  const characters = new Map(s.characters.map(c => [c.id, c])), servers = new Map(s.servers.map(x => [x.id, x])), items = new Map(s.items.map(x => [x.id, x])), npcs = new Map(s.npcs.map(x => [x.id, x])), offers = new Map(s.offers.map(x => [x.id, x])), lots = new Map(s.lots.map(x => [x.id, x])), backpacks = new Map(s.backpacks.map(x => [x.id, x]));
  if (!characters.size || !characters.has(s.activeCharacterId)) fail('active character', 'does not exist.');
  const belongsToServer = (entity: { serverId?: string } | undefined, serverId: string) => Boolean(entity && (!entity.serverId || entity.serverId === serverId));
  const owner = (characterId: unknown, where: string) => { id(characterId, where); const c = characters.get(characterId); if (!c) fail(where, 'does not exist.'); return c; };
  for (const server of s.servers) {
    string(server.name, 'server name', true); string(server.pricePreset, 'merchant preset');
    for (const field of ['xpRate', 'magicRate', 'regenerationRate'] as const) numeric(server[field], 'server ' + field, 0.01, 1000);
    if (server.skillRate !== undefined) numeric(server.skillRate, 'server skillRate', 0.01, 1000);
    if (server.ruleset !== 'tibia77') fail('mechanics ruleset', 'is not supported.');
  }
  for (const c of s.characters) {
    if (!servers.has(c.serverId)) fail('character server', 'does not exist.');
    string(c.name, 'character name', true);
    if (!['unselected', 'knight', 'paladin', 'sorcerer', 'druid'].includes(c.vocation)) fail('vocation', 'is unsupported.');
    bool(c.promoted, 'promotion'); bool(c.premium, 'premium'); bool(c.xpEstimated, 'XP estimate flag');
    checkXP(c.xp); integer(c.level, 'level', 1, MAX_LEVEL);
    if (levelForXP(c.xp) !== c.level) fail('character level', 'does not match the saved experience.');
    numeric(c.percentRemaining, 'level progress', 0, 100); numeric(c.magicPercentRemaining, 'magic progress', 0, 100);
    for (const field of ['magicLevel', 'goalML', 'meleeSkill', 'distanceSkill', 'shieldingSkill', 'fishingSkill'] as const) integer(c[field], 'character ' + field, 0, 10_000);
    for (const field of ['axeSkill', 'swordSkill', 'clubSkill', 'fistSkill'] as const) if (c[field] !== undefined) integer(c[field], 'character ' + field, 0, 10_000);
    for (const field of ['maxMana', 'maxHP', 'capacity'] as const) if (c[field] !== undefined) numeric(c[field], 'character ' + field);
  }
  for (const item of s.items) {
    itemFields(item as unknown as DataRecord, 'item', false);
    if (item.serverId !== undefined && !servers.has(item.serverId)) fail('item server', 'does not exist.');
  }
  for (const npc of s.npcs) {
    npcFields(npc as unknown as DataRecord, 'NPC', false);
    if (npc.serverId !== undefined && !servers.has(npc.serverId)) fail('NPC server', 'does not exist.');
  }
  for (const offer of s.offers) {
    id(offer.itemId, 'offer item'); id(offer.npcId, 'offer NPC');
    if (!items.has(offer.itemId) || !npcs.has(offer.npcId)) fail('offer', 'references a missing item or NPC.');
    if (!['buy', 'sell'].includes(offer.direction)) fail('offer direction', 'must be buy or sell.');
    numeric(offer.price, 'offer price'); bool(offer.enabled, 'offer enabled'); optionalText(offer.notes, 'offer notes');
    if (offer.sourcePresetId !== null) optionalText(offer.sourcePresetId, 'offer preset');
    if (offer.serverId !== undefined) {
      if (!servers.has(offer.serverId) || !belongsToServer(items.get(offer.itemId), offer.serverId) || !belongsToServer(npcs.get(offer.npcId), offer.serverId)) fail('custom offer', 'references another server or its private catalogue.');
    } else if (items.get(offer.itemId)?.serverId || npcs.get(offer.npcId)?.serverId) fail('shared offer', 'cannot reference a server-specific item or NPC.');
  }
  const checkOverrides = (entries: Record<string, unknown>, entities: Map<string, { serverId?: string }>, kind: 'item' | 'NPC' | 'offer', fields: string[]) => {
    for (const [key, value] of Object.entries(entries)) {
      const [serverId, entityId, extra] = key.split('::');
      if (extra !== undefined || !servers.has(serverId) || !entities.has(entityId) || !belongsToServer(entities.get(entityId), serverId)) fail(kind + ' override', 'has an invalid server/entity key.');
      object(value, kind + ' override'); whitelist(value, fields, kind + ' override');
      if (kind === 'item') itemFields(value, 'item override', true);
      if (kind === 'NPC') npcFields(value, 'NPC override', true);
      if (kind === 'offer') { if (value.price !== undefined) numeric(value.price, 'offer override price'); if (value.enabled !== undefined) bool(value.enabled, 'offer override enabled'); optionalText(value.notes, 'offer override notes'); }
    }
  };
  checkOverrides(s.itemOverrides, items, 'item', ['name', 'aliases', 'category', 'image', 'weight', 'attack', 'defense', 'armor', 'charges', 'packSize', 'source']);
  checkOverrides(s.npcOverrides, npcs, 'NPC', ['name', 'city', 'x', 'y', 'z', 'notes']);
  checkOverrides(s.offerOverrides, offers, 'offer', ['price', 'enabled', 'notes']);
  const spellIds = new Set(spells.map(spell => spell.id));
  for (const [key, value] of Object.entries(s.spellOverrides ?? {})) {
    const [serverId, spellId, extra] = key.split('::');
    if (extra !== undefined || !servers.has(serverId) || !spellIds.has(spellId)) fail('spell override', 'has an invalid server/spell key.');
    object(value, 'spell override');
    whitelist(value, ['mana', 'runeCharges', 'soulCost', 'price', 'vocations'], 'spell override');
    optionalNumber(value.mana, 'spell mana', true);
    optionalNumber(value.soulCost, 'spell soul cost', true);
    optionalNumber(value.runeCharges, 'rune charges', true, 1);
    optionalNumber(value.price, 'spell learning price');
    if (value.vocations !== undefined && value.vocations !== null) {
      array(value.vocations, 'spell vocations');
      const known = new Set(['knight', 'paladin', 'sorcerer', 'druid']);
      if (value.vocations.some(v => typeof v !== 'string' || !known.has(v)) || new Set(value.vocations).size !== value.vocations.length) fail('spell vocations', 'must contain distinct classic vocations.');
    }
  }
  if (s.servers.length * s.offers.length > 5_000_000) fail('merchant catalogue', 'contains too many server/offer combinations.');
  for (const server of s.servers) {
    const activeOffers = new Set<string>();
    for (const offer of catalogOffers(s, server.id)) if (offer.enabled) {
      const key = JSON.stringify([offer.itemId, offer.npcId, offer.direction]);
      if (activeOffers.has(key)) fail('merchant offers', 'contain a duplicate active item/NPC/direction relationship on one server.');
      activeOffers.add(key);
    }
    for (const npc of s.npcs.filter(n => !n.serverId || n.serverId === server.id)) {
      const effective = { ...npc, ...s.npcOverrides[overrideKey(server.id, npc.id)] };
      const coords = [effective.x, effective.y, effective.z];
      if (coords.some(v => v != null) && !coords.every(v => v != null)) fail('NPC map location', 'must include X, Y and Z together.');
    }
  }
  for (const backpack of s.backpacks) {
    owner(backpack.characterId, 'backpack owner');
    for (const field of ['color', 'city', 'name', 'purpose'] as const) string(backpack[field], 'backpack ' + field);
  }
  for (const lot of s.lots) {
    const c = owner(lot.characterId, 'stock owner');
    if (!belongsToServer(items.get(lot.itemId), c.serverId)) fail('stock item', 'does not exist on its owner’s server.');
    integer(lot.quantity, 'stock quantity'); integer(lot.personalReserve, 'personal reserve'); integer(lot.packSize, 'stock package size', 1); numeric(lot.askingPrice, 'asking price');
    string(lot.unit, 'stock unit', true); string(lot.notes, 'stock notes'); optionalNumber(lot.chargesPerItem, 'stock charges', true);
    if (lot.locationId !== undefined && backpacks.get(lot.locationId)?.characterId !== lot.characterId) fail('stock location', 'does not belong to the stock’s character.');
  }
  const allLineIds = new Set<string>(), allDeliveryIds = new Set<string>(), allPaymentIds = new Set<string>();
  for (const order of s.orders) {
    const c = owner(order.characterId, 'order owner');
    string(order.buyer, 'order buyer', true); string(order.city, 'order city'); string(order.notes, 'order notes'); bool(order.cancelled, 'cancelled flag'); if (order.imported !== undefined) bool(order.imported, 'imported flag');
    dateOnly(order.date, 'order date'); if (order.dueDate !== undefined) dateOnly(order.dueDate, 'order due date');
    keyedList(order.lines, 'order lines', allLineIds); keyedList(order.payments, 'payments', allPaymentIds); keyedList(order.deliveries, 'deliveries', allDeliveryIds);
    if (!order.lines.length) fail('order', 'must contain an item line.');
    const lineMap = new Map(order.lines.map(l => [l.id, l]));
    for (const line of order.lines) {
      if (!belongsToServer(items.get(line.itemId), c.serverId)) fail('order item', 'does not exist on its owner’s server.');
      string(line.nameSnapshot, 'agreed item name', true); string(line.unit, 'order unit', true);
      integer(line.quantity, 'order quantity', 1); integer(line.delivered, 'delivered quantity', 0, line.quantity); integer(line.packSize, 'order package size', 1); numeric(line.unitPrice, 'agreed price'); optionalNumber(line.chargesPerItem, 'agreed charge state', true);
      numeric(line.quantity / line.packSize * line.unitPrice, 'order line value');
      array(line.allocations, 'order allocations'); const allocatedLots = new Set<string>(); let allocated = 0;
      for (const a of line.allocations) {
        object(a, 'allocation'); id(a.lotId, 'allocated stock'); integer(a.quantity, 'allocated quantity', 1);
        const lot = lots.get(a.lotId);
        if (!lot || lot.characterId !== order.characterId || lot.itemId !== line.itemId || (lot.chargesPerItem ?? null) !== (line.chargesPerItem ?? null)) fail('allocation', 'references missing or mismatched stock.');
        if (allocatedLots.has(a.lotId)) fail('allocation', 'duplicates a stock record on the same order line.');
        allocatedLots.add(a.lotId); allocated += a.quantity;
      }
      if (allocated > line.quantity - line.delivered || (order.cancelled && allocated)) fail('allocation', 'exceeds the order’s remaining demand.');
      // A count correction can legitimately leave allocated + personal > on hand.
    }
    const deliveredByLine = new Map<string, number>();
    for (const d of order.deliveries) {
      id(d.lineId, 'delivery line'); const line = lineMap.get(d.lineId); if (!line) fail('delivery', 'references a missing order line.');
      integer(d.quantity, 'delivery quantity', 1); dateOnly(d.date, 'delivery date');
      if (d.lotId !== undefined) {
        id(d.lotId, 'historical stock identity'); const lot = lots.get(d.lotId);
        // Empty stock records can be removed; immutable historical IDs remain valid.
        if (lot && (lot.characterId !== order.characterId || lot.itemId !== line.itemId)) fail('delivery stock', 'does not match its order.');
      }
      deliveredByLine.set(d.lineId, (deliveredByLine.get(d.lineId) || 0) + d.quantity);
    }
    for (const line of order.lines) if ((deliveredByLine.get(line.id) || 0) !== line.delivered) fail('delivery history', 'does not match the line’s delivered quantity.');
    let paid = 0;
    for (const p of order.payments) { numeric(p.amount, 'payment amount', -Number.MAX_SAFE_INTEGER); if (p.amount === 0) fail('payment', 'must have a non-zero amount.'); dateOnly(p.date, 'payment date'); paid += p.amount; }
    if (paid < -0.005 || !Number.isFinite(paid) || paid > Number.MAX_SAFE_INTEGER) fail('payment history', 'has an invalid net paid amount.');
    // Cancellation may reduce payable value below an advance payment: refund due is valid.
  }
  const operationIds = new Set<string>();
  for (const movement of s.movements) {
    const c = owner(movement.characterId, 'stock-movement owner');
    if (!belongsToServer(items.get(movement.itemId), c.serverId)) fail('stock movement', 'references a missing or foreign-server item.');
    id(movement.lotId, 'historical stock identity'); const lot = lots.get(movement.lotId);
    if (lot && (lot.characterId !== movement.characterId || lot.itemId !== movement.itemId)) fail('stock movement', 'does not match its stock record.');
    integer(movement.delta, 'stock movement quantity', -Number.MAX_SAFE_INTEGER); eventDate(movement.date, 'stock movement date'); string(movement.reason, 'stock movement reason');
    if (movement.operationId !== undefined) { id(movement.operationId, 'stock operation'); if (operationIds.has(movement.operationId)) fail('stock operation', 'is recorded twice.'); operationIds.add(movement.operationId); }
  }
  const activeCharacters = new Set<string>(), checkpointIds = new Set<string>();
  for (const hunt of s.hunts) {
    const c = owner(hunt.characterId, 'hunt owner');
    if (!servers.has(hunt.serverId) || c.serverId !== hunt.serverId) fail('hunt server', 'does not match its character.');
    if (!['running', 'paused', 'awaiting_xp', 'completed'].includes(hunt.status)) fail('hunt status', 'is unsupported.');
    string(hunt.location, 'hunt location'); string(hunt.notes, 'hunt notes'); timestamp(hunt.startedAt, 'hunt start');
    if (hunt.stoppedAt !== null) { timestamp(hunt.stoppedAt, 'hunt stop'); if (hunt.stoppedAt < hunt.startedAt) fail('hunt stop', 'precedes its start.'); }
    checkXP(hunt.startXP); if (hunt.endXP !== null) checkXP(hunt.endXP);
    if (hunt.durationOverride !== undefined) numeric(hunt.durationOverride, 'corrected hunt duration');
    array(hunt.intervals, 'hunt intervals'); keyedList(hunt.checkpoints, 'XP checkpoints', checkpointIds);
    let previousEnd = hunt.startedAt, openIntervals = 0;
    for (let i = 0; i < hunt.intervals.length; i++) {
      const interval = hunt.intervals[i]; object(interval, 'hunt interval'); timestamp(interval.start, 'interval start');
      if (interval.start < previousEnd) fail('timer intervals', 'overlap or are out of order.');
      if (interval.end === null) { openIntervals++; if (i !== hunt.intervals.length - 1) fail('timer', 'has an open interval before its last interval.'); }
      else { timestamp(interval.end, 'interval end'); if (interval.end < interval.start) fail('interval end', 'precedes its start.'); previousEnd = interval.end; }
      if (hunt.stoppedAt !== null && (interval.start > hunt.stoppedAt || (interval.end !== null && interval.end > hunt.stoppedAt))) fail('timer interval', 'extends past its stop time.');
    }
    if (hunt.status === 'running') { if (openIntervals !== 1 || hunt.endXP !== null || hunt.stoppedAt !== null) fail('running hunt', 'has inconsistent timer or final-XP state.'); }
    else if (openIntervals) fail('stopped or paused hunt', 'cannot have a running interval.');
    if (hunt.status === 'paused' && (!hunt.intervals.length || hunt.stoppedAt !== null || hunt.endXP !== null)) fail('paused hunt', 'has inconsistent state.');
    if (hunt.status === 'awaiting_xp' && (hunt.stoppedAt === null || hunt.endXP !== null)) fail('stopped hunt', 'must await final XP.');
    if (hunt.status === 'completed' && (hunt.stoppedAt === null || hunt.endXP === null)) fail('completed hunt', 'is missing final XP or its stop time.');
    if (!hunt.intervals.length && hunt.durationOverride === undefined) fail('hunt', 'has neither recorded intervals nor a manual duration.');
    let previousCheckpoint = hunt.startedAt, previousSeconds = 0;
    for (const cp of hunt.checkpoints) {
      timestamp(cp.at, 'checkpoint time'); checkXP(cp.xp); numeric(cp.activeSeconds, 'checkpoint active time');
      if (cp.at < previousCheckpoint || cp.activeSeconds < previousSeconds || (hunt.stoppedAt !== null && cp.at > hunt.stoppedAt)) fail('XP checkpoints', 'are outside the hunt or out of order.');
      if (cp.activeSeconds > activeSeconds(hunt, cp.at) + 0.000001) fail('checkpoint active time', 'exceeds the recorded hunt duration at that checkpoint.');
      previousCheckpoint = cp.at; previousSeconds = cp.activeSeconds;
    }
    if (hunt.status !== 'completed') { if (activeCharacters.has(hunt.characterId)) fail('hunts', 'contain more than one unfinished session for a character.'); activeCharacters.add(hunt.characterId); }
  }
  for (const bookmark of s.bookmarks) {
    owner(bookmark.characterId, 'bookmark owner'); string(bookmark.name, 'bookmark name', true); string(bookmark.notes, 'bookmark notes');
    integer(bookmark.x, 'map X', 0, 65535); integer(bookmark.y, 'map Y', 0, 65535); integer(bookmark.z, 'map Z', 0, 15); integer(bookmark.zoom, 'map zoom', 1, 8);
  }
  jsonValue(s.preferences, 'preferences');
  for (const [key, value] of Object.entries(s.preferences)) {
    if (key === 'theme' && !['light', 'dark', 'system'].includes(String(value))) fail('appearance', 'must be light, dark, or system.');
    if (key === 'xpCreatureIds' || key.startsWith('xpCreatureIds:')) stringList(value, 'selected creatures');
    if (key.startsWith('xpCreatureIds:') && !characters.has(key.slice('xpCreatureIds:'.length))) fail('selected-creature preference', 'has no character owner.');
    if (key.startsWith('mapPosition:')) { if (!characters.has(key.slice('mapPosition:'.length))) fail('saved map position', 'has no character owner.'); object(value, 'saved map position'); integer(value.x, 'saved map X', 0, 65535); integer(value.y, 'saved map Y', 0, 65535); integer(value.z, 'saved map Z', 0, 15); integer(value.zoom, 'saved map zoom', 1, 8); }
  }
}
