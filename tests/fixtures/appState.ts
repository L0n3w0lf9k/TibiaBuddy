import type { AppState, Character } from '../../src/types';

/** Deliberately synthetic records. Never populate fixtures from a user's backup. */
export const TEST_DATE = '2000-01-01';
export const TEST_TIMESTAMP = '2000-01-01T12:00:00.000Z';

export function testCharacter(id = 'test-character', name = 'Test character', serverId = 'test-server'): Character {
  return {
    id, name, serverId, vocation: 'unselected', promoted: false,
    level: 8, xp: 4200, xpEstimated: false, percentRemaining: 100,
    magicLevel: 0, magicPercentRemaining: 100, goalML: 1,
    meleeSkill: 10, distanceSkill: 10, shieldingSkill: 10, fishingSkill: 10,
    premium: false,
  };
}

/** A small complete graph for backup validation, unrelated to the public seed. */
export function makeTestState(): AppState {
  return {
    schemaVersion: 1, revision: 0, activeCharacterId: 'test-character',
    characters: [testCharacter()],
    servers: [{ id: 'test-server', name: 'Test server', xpRate: 1, regenerationRate: 1, magicRate: 1, ruleset: 'tibia77', pricePreset: 'Synthetic test preset' }],
    items: [
      { id: 'test:item:a', name: 'Synthetic item A', aliases: ['Test A'], category: 'Test', packSize: 10, charges: null },
      { id: 'test:item:b', name: 'Synthetic item B', aliases: ['Test B'], category: 'Test', packSize: 1, charges: 3 },
    ],
    npcs: [{ id: 'test:npc', name: 'Test merchant', city: 'Test town' }],
    offers: [{ id: 'test:offer', itemId: 'test:item:a', npcId: 'test:npc', direction: 'buy', price: 10, enabled: true, sourcePresetId: 'synthetic-test' }],
    itemOverrides: {}, npcOverrides: {}, offerOverrides: {},
    lots: [
      { id: 'test-lot-a', characterId: 'test-character', itemId: 'test:item:a', quantity: 100, personalReserve: 10, unit: 'package', packSize: 10, askingPrice: 100, notes: '', chargesPerItem: null },
      { id: 'test-lot-b', characterId: 'test-character', itemId: 'test:item:b', quantity: 30, personalReserve: 0, unit: 'piece', packSize: 1, askingPrice: 7, notes: '', chargesPerItem: 3 },
    ],
    orders: [{
      id: 'test-historical-order', characterId: 'test-character', buyer: 'Synthetic customer',
      city: 'Test town', date: TEST_DATE, notes: 'Synthetic historical record', cancelled: false, imported: true,
      lines: [{ id: 'test-historical-line', itemId: 'test:item:a', nameSnapshot: 'Synthetic item A', quantity: 20, delivered: 20, unit: 'package', packSize: 10, unitPrice: 100, allocations: [], chargesPerItem: null }],
      payments: [{ id: 'test-historical-payment', date: TEST_DATE, amount: 200 }],
      deliveries: [{ id: 'test-historical-delivery', date: TEST_DATE, lineId: 'test-historical-line', quantity: 20 }],
    }],
    movements: [], backpacks: [], hunts: [], bookmarks: [], favourites: [], preferences: {},
  };
}
