import test from 'node:test';
import assert from 'node:assert/strict';
import { SPELL_MODELS } from '../src/domain/mechanics';
import { effectiveSpells, spellOverrideKey } from '../src/domain/spellCatalog';
import { combatSpellRange, MELEE_WEAPONS, meleeOverview, spellOverviewGroups,
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
  assert.equal(rows.find(row => row.id === 'axe')?.rawMaximum, 57);
  assert.equal(rows.find(row => row.id === 'sword')?.rawMaximum, 33);
  assert.equal(rows.find(row => row.id === 'club')?.rawMaximum, 8);
  assert.deepEqual(rows.map(row => row.name), rows.map(row => row.name).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true })));
});

test('server attack edits and explicit unknown values override reference stats without losing weapon identity', () => {
  const state = makeTestState(), serverId = state.servers[0].id;
  state.items.push({ id: 'fibula:item:axe', name: 'Axe', aliases: [], category: 'Weapon', attack: null });
  state.itemOverrides[serverId + '::fibula:item:axe'] = { name: 'Aardvark test axe', attack: 20 };
  let rows = meleeOverview(state, serverId, skills);
  assert.equal(rows[0].id, 'axe');
  assert.equal(rows[0].skill, 'axe');
  assert.equal(rows[0].rawMaximum, 96);
  assert.equal(rows[0].attackSource, 'override');
  state.itemOverrides[serverId + '::fibula:item:axe'].attack = null;
  rows = meleeOverview(state, serverId, skills);
  assert.equal(rows[0].attack, null);
  assert.equal(rows[0].rawMaximum, null);
  assert.equal(rows[0].name, 'Aardvark test axe');
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
