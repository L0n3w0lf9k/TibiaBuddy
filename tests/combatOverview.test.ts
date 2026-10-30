import test from 'node:test';
import assert from 'node:assert/strict';
import { SPELL_MODELS } from '../src/domain/mechanics';
import { effectiveSpells, spellOverrideKey } from '../src/domain/spellCatalog';
import { combatSpellRange, closeCombatOverview, distanceOverview, DISTANCE_WEAPONS, MELEE_WEAPONS, meleeOverview, spellOverviewGroups,
  spellReference, spellRequirementCheck, type CombatSkillInputs } from '../src/domain/combatOverview';
import { makeTestState } from './fixtures/appState';

const skills: CombatSkillInputs = { axe: 70, sword: 30, club: 10, fist: 10, distance: 80, shielding: 60 };

test('every supported spell appears once in the requested alphabetical groups', () => {
  const groups = spellOverviewGroups(25, 30);
  assert.deepEqual(groups.map(group => group.id), ['attack-spells', 'healing-spells', 'rune-damage', 'rune-healing']);
  assert.deepEqual(groups.map(group => group.rows.length), [8, 5, 6, 2]);
  const ids = groups.flatMap(group => group.rows.map(row => row.id));
  assert.equal(new Set(ids).size, SPELL_MODELS.length);
  assert.deepEqual(new Set(ids), new Set(SPELL_MODELS.map(model => model.id)));
  for (const group of groups) {
    const names = group.rows.map(row => row.name);
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true })));
    assert.ok(group.rows.every(row => row.reference && row.range));
  }
});

test('legacy spell ranges stay unchanged while invalid preview inputs remain unavailable', () => {
  const hmm = SPELL_MODELS.find(model => model.id === 'hmm')!;
  const sd = SPELL_MODELS.find(model => model.id === 'sd')!;
  assert.deepEqual(combatSpellRange(hmm, 25, 30), { min: 28, max: 56, midpoint: 42, power: 140, effectivePower: 140 });
  assert.equal(combatSpellRange(hmm, 8, 0)?.min, 20);
  assert.equal(combatSpellRange(sd, 8, 0)?.min, 20);
  assert.equal(combatSpellRange(hmm, NaN, 30), null);
  assert.equal(combatSpellRange(hmm, 25, 30.5), null);
  assert.equal(combatSpellRange(hmm, 2001, 30), null);
});

test('the full sourced melee catalogue uses the matching named skill for each weapon', () => {
  const state = makeTestState(), rows = meleeOverview(state, state.servers[0].id, skills);
  assert.equal(rows.length, 84);
  assert.equal(new Set(MELEE_WEAPONS.map(weapon => weapon.id)).size, 84);
  assert.ok(MELEE_WEAPONS.every(weapon => ['axe', 'sword', 'club'].includes(weapon.skill) && weapon.attack > 0 && weapon.sourceSha256.length === 64));
  assert.equal(rows.find(row => row.id === 'axe')?.rawMaximum, 55);
  assert.equal(rows.find(row => row.id === 'sword')?.rawMaximum, 31);
  assert.equal(rows.find(row => row.id === 'club')?.rawMaximum, 7);
  assert.ok(rows.every(row => row.rawMinimum === 0));
  assert.deepEqual(rows.map(row => row.name), rows.map(row => row.name).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true })));
});

test('server attack edits and explicit unknown values override reference stats without losing weapon identity', () => {
  const state = makeTestState(), serverId = state.servers[0].id;
  state.items.push({ id: 'fibula:item:axe', name: 'Axe', aliases: [], category: 'Weapon', attack: null });
  state.itemOverrides[serverId + '::fibula:item:axe'] = { name: 'Aardvark test axe', attack: 20 };
  let rows = meleeOverview(state, serverId, skills);
  assert.equal(rows[0].id, 'axe');
  assert.equal(rows[0].skill, 'axe');
  assert.equal(rows[0].rawMaximum, 95);
  assert.equal(rows[0].attackSource, 'override');
  state.itemOverrides[serverId + '::fibula:item:axe'].attack = null;
  rows = meleeOverview(state, serverId, skills);
  assert.equal(rows[0].attack, null);
  assert.equal(rows[0].rawMaximum, null);
  assert.equal(rows[0].rawMinimum, null);
  assert.equal(rows[0].name, 'Aardvark test axe');
});

test('bare hands appear alphabetically and use fist skill independently of weapons or shielding', () => {
  const state = makeTestState(), serverId = state.servers[0].id;
  const rows = closeCombatOverview(state, serverId, { ...skills, fist: 60 });
  assert.equal(rows.length, 85);
  const fist = rows.find(row => row.id === 'bare-hands')!;
  assert.equal(fist.skill, 'fist');
  assert.equal(fist.attack, 7);
  assert.equal(fist.rawMinimum, 0);
  assert.equal(fist.rawMaximum, 27);
  assert.deepEqual(rows.map(row => row.name), rows.map(row => row.name).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true })));
  const other = closeCombatOverview(state, serverId, { ...skills, fist: 60, shielding: 200 });
  assert.deepEqual(rows, other);
});

test('classic projectile catalogue separates launcher, range and special effects', () => {
  const state = makeTestState(), serverId = state.servers[0].id;
  const rows = distanceOverview(state, serverId, 60, 2);
  assert.equal(rows.length, 10);
  assert.equal(new Set(DISTANCE_WEAPONS.map(row => row.id)).size, 10);
  assert.deepEqual(rows.map(row => row.name), [...rows.map(row => row.name)].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true })));
  assert.equal(rows.find(row => row.id === 'arrow')?.launcher, 'Bow');
  assert.equal(rows.find(row => row.id === 'arrow')?.maxRange, 6);
  assert.equal(rows.find(row => row.id === 'power-bolt')?.launcher, 'Crossbow');
  assert.equal(rows.find(row => row.id === 'power-bolt')?.maxRange, 5);
  assert.equal(rows.find(row => row.id === 'spear')?.maxRange, 7);
  assert.equal(rows.find(row => row.id === 'spear')?.rawMaximum, 103);
  assert.equal(rows.find(row => row.id === 'bolt')?.rawMaximum, 124);
  assert.equal(rows.find(row => row.id === 'arrow')?.accuracy, .91);
  assert.equal(rows.find(row => row.id === 'spear')?.accuracy, .76);
  const burst = rows.find(row => row.id === 'burst-arrow')!;
  assert.equal(burst.physicalMaximum, 0);
  assert.equal(burst.rawMinimum, null);
  assert.equal(burst.rawMaximum, null);
  assert.equal(burst.specialEffectModelled, false);
  assert.equal(rows.find(row => row.id === 'poison-arrow')?.specialEffectModelled, false);
  assert.equal(rows.find(row => row.id === 'snowball')?.rawMaximum, 0);
});

test('distance attack edits change physical rolls without changing accuracy or inventing launcher bonuses', () => {
  const state = makeTestState(), serverId = state.servers[0].id;
  state.items.push({ id: 'fibula:item:arrow', name: 'Arrow', aliases: [], category: 'Ammunition', attack: null });
  state.items.push({ id: 'fibula:item:bow', name: 'Bow', aliases: [], category: 'Weapon', attack: 99 });
  let row = distanceOverview(state, serverId, 60, 2).find(item => item.id === 'arrow')!;
  assert.equal(row.attack, 25);
  assert.equal(row.rawMaximum, 103);
  state.itemOverrides[serverId + '::fibula:item:arrow'] = { attack: 30 };
  row = distanceOverview(state, serverId, 60, 2).find(item => item.id === 'arrow')!;
  assert.equal(row.rawMaximum, 124);
  assert.equal(row.accuracy, .91);
  state.itemOverrides[serverId + '::fibula:item:arrow'].attack = null;
  row = distanceOverview(state, serverId, 60, 2).find(item => item.id === 'arrow')!;
  assert.equal(row.rawMinimum, null);
  assert.equal(row.rawMaximum, null);
  assert.equal(row.accuracy, .91);
  const outOfRange = distanceOverview(state, serverId, 60, 6).find(item => item.id === 'bolt')!;
  assert.equal(outOfRange.outOfRange, true);
  assert.equal(outOfRange.accuracy, null);
});

test('burst damage uses the magic preview while distance skill only changes projectile accuracy', () => {
  const state = makeTestState(), serverId = state.servers[0].id;
  const burst = (skill: number, mode: 'offensive' | 'balanced' | 'defensive', level: number, magicLevel: number) =>
    distanceOverview(state, serverId, skill, 2, mode, { level, magicLevel }).find(row => row.id === 'burst-arrow')!;
  const lowDistance = burst(10, 'offensive', 50, 30);
  const highDistance = burst(100, 'defensive', 50, 30);
  assert.equal(lowDistance.rawMinimum, 0);
  assert.equal(lowDistance.rawMaximum, 114);
  assert.equal(highDistance.rawMaximum, 114);
  assert.ok(highDistance.accuracy! > lowDistance.accuracy!);
  assert.equal(highDistance.specialEffectModelled, true);
  assert.equal(burst(100, 'balanced', 100, 50).rawMaximum, 210);
  assert.equal(burst(NaN, 'balanced', 100, 50).rawMaximum, 210);
  assert.equal(burst(NaN, 'balanced', 100, 50).accuracy, null);
  assert.equal(burst(100, 'balanced', 100, NaN).rawMaximum, null);
  assert.equal(burst(100, 'balanced', 100, NaN).accuracy, .91);
  assert.equal(DISTANCE_WEAPONS.some(row => row.id === 'fire-arrow'), false);
});

test('rune-use eligibility never inherits rune creation vocation, mana or premium requirements', () => {
  const model = SPELL_MODELS.find(candidate => candidate.id === 'uh')!;
  const reference = { ...spellReference(model)!, vocations: ['druid' as const], level: 99, mana: 999, premium: true, promotion: true, useMagicLevel: 4, useLevel: 8 };
  const check = spellRequirementCheck(model, reference, { vocation: 'knight', premium: false, promoted: false }, 8, 4);
  assert.deepEqual(check.failures, []);
  assert.equal(check.status, 'listed');
  assert.equal(spellRequirementCheck(model, reference, { vocation: 'knight', premium: false, promoted: false }, 8, 3).status, 'blocked');
});

test('server spell edits update shown cost and vocation checks while retaining the original damage model', () => {
  const state = makeTestState(), serverId = state.servers[0].id;
  const model = SPELL_MODELS.find(candidate => candidate.id === 'energy-strike')!;
  const original = spellReference(model)!;
  state.spellOverrides = { [spellOverrideKey(serverId, original.id)]: { mana: 123, vocations: ['knight'] } };
  const references = effectiveSpells(state, serverId);
  const row = spellOverviewGroups(100, 30, references).flatMap(group => group.rows).find(candidate => candidate.id === model.id)!;
  assert.equal(row.reference?.mana, 123);
  assert.deepEqual(row.reference?.vocations, ['knight']);
  assert.equal(spellRequirementCheck(model, row.reference, { vocation: 'sorcerer', premium: true, promoted: true }, 100, 30).status, 'blocked');
  assert.deepEqual(row.range, combatSpellRange(model, 100, 30));
  assert.notEqual(original.mana, 123);
});

test('unknown access rules and unselected vocation stay partial rather than claiming castability', () => {
  const model = SPELL_MODELS.find(candidate => candidate.id === 'exura')!;
  const reference = { ...spellReference(model)!, level: 8, vocations: ['knight' as const], premium: false, promotion: false };
  const check = spellRequirementCheck(model, reference, { vocation: 'unselected', premium: false, promoted: false }, 8, 0);
  assert.equal(check.status, 'partial');
  assert.equal(check.failures.length, 0);
});
