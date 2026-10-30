import test from 'node:test';
import assert from 'node:assert/strict';
import { makeTestState } from './fixtures/appState';
import { upgradeJournal } from '../src/domain/migrations';
import { characterSkill } from '../src/domain/characterSkills';
import { effectiveSpell, spellOverrideKey } from '../src/domain/spellCatalog';
import { spells } from '../src/data/game';
import { validateBackup } from '../src/domain/backupValidation';

test('old journals gain named skills without changing their existing records', () => {
  const original = makeTestState(); original.characters[0].meleeSkill = 67;
  const before = structuredClone(original);
  const upgraded = upgradeJournal(original);
  assert.equal(upgraded.changed, true);
  assert.deepEqual(original, before);
  for (const skill of ['axe', 'sword', 'club'] as const) assert.equal(characterSkill(upgraded.state.characters[0], skill), 67);
  assert.equal(characterSkill(upgraded.state.characters[0], 'fist'), 10);
  assert.deepEqual(upgraded.state.lots, original.lots);
  assert.deepEqual(upgraded.state.orders, original.orders);
  assert.deepEqual(upgraded.state.spellOverrides, {});
  assert.equal(upgradeJournal(upgraded.state).changed, false);
  validateBackup(upgraded.state);
});

test('named skills and server customizations survive repeat migrations', () => {
  const state = makeTestState();
  Object.assign(state.characters[0], { axeSkill: 81, swordSkill: 42, clubSkill: 17, fistSkill: 19 });
  state.spellOverrides = { 'test-server::ultimate-healing-rune': { mana: 420, soulCost: 0 } };
  state.guideLinks = [];
  const result = upgradeJournal(state);
  assert.equal(result.changed, false);
  assert.equal(characterSkill(result.state.characters[0], 'axe'), 81);
  assert.deepEqual(result.state.spellOverrides, state.spellOverrides);
});

test('zero-cost and unknown spell overrides remain distinct and isolated by server', () => {
  const state = makeTestState();
  const uh = spells.find(spell => spell.id === 'ultimate-healing-rune')!;
  const before = structuredClone(uh);
  state.spellOverrides = { [spellOverrideKey('test-server', uh.id)]: { mana: 430, soulCost: 0, runeCharges: 3, price: 0, vocations: ['druid', 'sorcerer'] } };
  const customized = effectiveSpell(state, 'test-server', uh);
  assert.equal(customized.mana, 430); assert.equal(customized.soulCost, 0); assert.equal(customized.runeCharges, 3); assert.equal(customized.price, 0);
  assert.deepEqual(customized.vocations, ['druid', 'sorcerer']);
  assert.deepEqual(effectiveSpell(state, 'another-server', uh), before);
  assert.deepEqual(uh, before);
  state.spellOverrides[spellOverrideKey('test-server', uh.id)].soulCost = null;
  assert.equal(effectiveSpell(state, 'test-server', uh).soulCost, null);
});

test('a backup round-trip preserves independent skills, theme, and editable rune settings', () => {
  const state = upgradeJournal(makeTestState()).state;
  Object.assign(state.characters[0], { axeSkill: 62, swordSkill: 47, clubSkill: 31, shieldingSkill: 58 });
  state.preferences.theme = 'dark';
  state.spellOverrides = { 'test-server::ultimate-healing-rune': { mana: 420, soulCost: 0, runeCharges: 2, price: null, vocations: ['druid'] } };
  const restored = JSON.parse(JSON.stringify(state));
  validateBackup(restored);
  assert.deepEqual(restored, state);
});

test('invalid new backup fields cannot corrupt a local journal', () => {
  const changes = [
    (s: ReturnType<typeof makeTestState>) => { s.characters[0].axeSkill = NaN; },
    (s: ReturnType<typeof makeTestState>) => { s.preferences.theme = 'invisible'; },
    (s: ReturnType<typeof makeTestState>) => { s.spellOverrides = { 'missing::ultimate-healing-rune': { mana: 420 } }; },
    (s: ReturnType<typeof makeTestState>) => { s.spellOverrides = { 'test-server::missing-spell': { mana: 420 } }; },
    (s: ReturnType<typeof makeTestState>) => { s.spellOverrides = { 'test-server::ultimate-healing-rune': { soulCost: -1 } }; },
    (s: ReturnType<typeof makeTestState>) => { s.spellOverrides = { 'test-server::ultimate-healing-rune': { runeCharges: 0 } }; },
    (s: ReturnType<typeof makeTestState>) => { s.spellOverrides = { 'test-server::ultimate-healing-rune': { vocations: ['druid', 'druid'] } }; },
  ];
  for (const change of changes) { const state = makeTestState(); change(state); assert.throws(() => validateBackup(state), /Invalid backup/); }
});

test('restoring a legacy backup supplies an empty spell-override map', () => {
  const restored = upgradeJournal(makeTestState()).state;
  assert.deepEqual(restored.spellOverrides, {});
});

test('the requested UH creation preset is 420 mana and retains its provenance note', () => {
  const uh = spells.find(spell => spell.id === 'ultimate-healing-rune')!;
  assert.equal(uh.mana, 420);
  assert.equal(uh.evidence.mana.status, 'disputed');
  assert.match(uh.evidence.mana.note ?? '', /420/);
});
