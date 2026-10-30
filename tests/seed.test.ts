import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { makeSeed } from '../src/seed';
import { validateBackup } from '../src/domain/backupValidation';

test('public visitors receive a clean journal with public reference data only', () => {
  const state = makeSeed();
  validateBackup(JSON.parse(JSON.stringify(state)));
  for (const records of [state.lots, state.orders, state.movements, state.backpacks, state.hunts, state.favourites]) {
    assert.equal(records.length, 0, 'no preloaded personal journal records');
  }
  assert.deepEqual(state.itemOverrides, {});
  assert.deepEqual(state.npcOverrides, {});
  assert.deepEqual(state.offerOverrides, {});
  assert.equal(state.characters.length, 1);
  const character = state.characters[0];
  assert.equal(character.name, 'My character');
  assert.equal(character.vocation, 'unselected');
  assert.equal(character.level, 8);
  assert.equal(character.xp, 4200);
  assert.equal(character.xpEstimated, false);
  assert.equal(character.magicLevel, 0);
  assert.equal(character.magicPercentRemaining, 100);
  assert.equal(character.goalML, 1);
  assert.equal(character.fishingSkill, 10);
  assert.equal(state.servers.length, 1);
  assert.equal(state.servers[0].name, 'My server');
  assert.ok(state.items.length > 0 && state.npcs.length > 0 && state.offers.length > 0, 'public catalogues remain available');
  assert.equal(Boolean(state.preferences.workbookImported), false);
  assert.equal(state.preferences.importedAt, undefined);
  assert.deepEqual(state.bookmarks, [{
    id: 'map-start', characterId: character.id, name: 'Thais',
    x: 32368, y: 32288, z: 7, zoom: 7, notes: 'Thais, mainland',
  }]);
  assert.equal(existsSync(new URL('../src/data/workbook.json', import.meta.url)), false,
    'private workbook data must remain outside the public source tree');
});
