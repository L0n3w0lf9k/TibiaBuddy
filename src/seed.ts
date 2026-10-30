import fibula from './data/fibula.json';
import type { AppState, Character, Item } from './types';

const runeNames: Record<string, string> = { UH: 'Ultimate Healing Rune', HMM: 'Heavy Magic Missile Rune', GFB: 'Great Fireball Rune', IH: 'Intense Healing Rune' };
export function emptyCharacter(id: string, name: string, serverId: string): Character {
  return { id, name, serverId, vocation: 'unselected', promoted: false, level: 8, xp: 4200, xpEstimated: false, percentRemaining: 100, magicLevel: 0, magicPercentRemaining: 100, goalML: 1, meleeSkill: 10, axeSkill: 10, swordSkill: 10, clubSkill: 10, fistSkill: 10, distanceSkill: 10, shieldingSkill: 10, fishingSkill: 10, premium: false };
}

/** Public reference catalog plus an empty, browser-local journal for each visitor. */
export function makeSeed(): AppState {
  const characterId = 'my-character', serverId = 'my-server';
  const items: Item[] = fibula.items.map(i => ({ id: i.id, name: i.name, aliases: i.aliases, category: /helmet|armor|legs|boots|shield|robe/i.test(i.name) ? 'Equipment' : /sword|axe|club|mace|spear|bow|hammer|dagger|halberd/i.test(i.name) ? 'Weapon' : 'Item', source: fibula.source_page, weight: null }));
  for (const [alias, name] of Object.entries(runeNames)) items.push({ id: 'rune:' + alias.toLowerCase(), name, aliases: [alias], category: 'Rune', packSize: 20, charges: null, source: 'https://primibia.com/wiki/spells' });
  return {
    schemaVersion: 1, revision: 1, activeCharacterId: characterId,
    characters: [emptyCharacter(characterId, 'My character', serverId)],
    servers: [{ id: serverId, name: 'My server', xpRate: 1, regenerationRate: 1, magicRate: 1, skillRate: 1, ruleset: 'tibia77', pricePreset: 'Project Fibula' }],
    items, npcs: fibula.npcs.map(n => ({ id: n.id, name: n.name, city: n.city_imported })),
    offers: fibula.offers.map(o => ({ id: o.id, itemId: o.item_id, npcId: o.npc_id, direction: o.direction === 'npc_buys_from_player' ? 'buy' : 'sell', price: o.unit_price_gp, enabled: o.enabled, sourcePresetId: fibula.preset_id })),
    itemOverrides: {}, npcOverrides: {}, offerOverrides: {}, spellOverrides: {},
    lots: [], orders: [], movements: [], backpacks: [], hunts: [],
    bookmarks: [{ id: 'map-start', characterId, name: 'Thais', x: 32368, y: 32288, z: 7, zoom: 7, notes: 'Thais, mainland' }],
    favourites: [], preferences: { xpCreatureIds: ['rotworm', 'cyclops', 'dwarf-guard', 'dwarf-soldier', 'dwarf'], workbookImported: false }
  };
}
