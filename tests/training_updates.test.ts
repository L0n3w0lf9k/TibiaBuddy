import test from 'node:test';
import assert from 'node:assert/strict';
import { FOODS, RUNE_RECIPES, foodPlanSeconds, magicPlan } from '../src/domain/mechanics.ts';
import { compareFoods } from '../src/domain/foodComparison.ts';
import { simultaneousSkillTraining } from '../src/domain/trainingPlans.ts';
import { runeBatchFromSpell } from '../src/domain/runeProduction.ts';
import { effectiveSpell, spellOverrideKey } from '../src/domain/spellCatalog.ts';
import { spells } from '../src/data/game.ts';
import { makeSeed } from '../src/seed.ts';

const goal = { currentLevel: 10, percentRemaining: 100, targetLevel: 11 };
const knightSession = { vocation: 'knight' as const, promoted: false, skill: 'sword' as const,
  weapon: goal, shielding: goal, attackers: 1 as const };

test('weapon and shielding goals run together; a third attacker adds no shield progress', () => {
  const one = simultaneousSkillTraining(knightSession);
  const two = simultaneousSkillTraining({ ...knightSession, attackers: 2 });
  const three = simultaneousSkillTraining({ ...knightSession, attackers: 3 });
  assert.equal(one.weapon.requiredTries, 50);
  assert.equal(one.shielding.requiredTries, 100);
  assert.equal(one.weapon.idealSeconds, 100);
  assert.equal(one.shielding.idealSeconds, 200);
  assert.equal(one.bothGoalsSeconds, 200);
  for (const plan of [two, three]) {
    assert.equal(plan.weapon.idealSeconds, 100);
    assert.equal(plan.shielding.idealSeconds, 100);
    assert.equal(plan.bothGoalsSeconds, 100);
    assert.equal(plan.bothGoalsSeconds, Math.max(plan.weapon.idealSeconds, plan.shielding.idealSeconds));
  }
  assert.deepEqual(one.attackers.map(row => [row.attackers, row.weaponSeconds, row.shieldingSeconds, row.bothGoalsSeconds]),
    [[1, 100, 200, 200], [2, 100, 100, 100], [3, 100, 100, 100]]);
});

test('each simultaneous goal applies its own current progress and target', () => {
  const plan = simultaneousSkillTraining({ ...knightSession, attackers: 2,
    weapon: { ...goal, percentRemaining: 50 }, shielding: { ...goal, percentRemaining: 25 } });
  assert.equal(plan.weapon.requiredTries, 25);
  assert.equal(plan.shielding.requiredTries, 25);
  assert.equal(plan.weapon.idealSeconds, 50);
  assert.equal(plan.shielding.idealSeconds, 26); // 13 whole two-check cycles
  assert.equal(plan.bothGoalsSeconds, 50);
  const longerShield = simultaneousSkillTraining({ ...knightSession, attackers: 2,
    weapon: { ...goal, percentRemaining: 50 }, shielding: { ...goal, targetLevel: 12 } });
  assert.equal(longerShield.weapon.idealSeconds, 50);
  assert.equal(longerShield.shielding.requiredTries, 210);
  assert.equal(longerShield.bothGoalsSeconds, 210);
});

test('server skill rate applies to both goals and promotion leaves their advancement unchanged', () => {
  const plan = simultaneousSkillTraining({ ...knightSession, attackers: 2, skillRate: 2 });
  assert.equal(plan.weapon.idealSeconds, 50);
  assert.equal(plan.shielding.idealSeconds, 50);
  const promoted = simultaneousSkillTraining({ ...knightSession, promoted: true, attackers: 2, skillRate: 2 });
  assert.equal(promoted.bothGoalsSeconds, plan.bothGoalsSeconds);
  const distance = simultaneousSkillTraining({ ...knightSession, vocation: 'paladin', skill: 'distance', attackers: 3 });
  assert.equal(distance.weapon.requiredTries, 30);
  assert.equal(distance.weapon.idealSeconds, 30); // 2 points per landed shot, 2-second cadence
  assert.equal(distance.shielding.idealSeconds, 100);
});

test('three-hour food comparison ranks actual rounded carry weight and retains full coverage', () => {
  const rows = compareFoods({ requiredSeconds: 10800 })!;
  assert.equal(rows.length, 10);
  assert.equal(rows[0].food.id, 'brown-mushroom');
  assert.equal(rows[0].quantity, 41);
  assert.ok(Math.abs(rows[0].totalWeight - 8.2) < 1e-9);
  assert.equal(rows[0].coverageSeconds, 10824);
  assert.equal(rows[0].spareSeconds, 24);
  rows.forEach((row, index) => {
    assert.ok(row.coverageSeconds >= 10800);
    assert.ok(row.coverageSeconds - row.food.seconds < 10800);
    if (index) assert.ok(row.totalWeight >= rows[index - 1].totalWeight);
  });
  const byQuantity = compareFoods({ requiredSeconds: 10800, sort: 'quantity' })!;
  assert.equal(byQuantity[0].food.id, 'dragon-ham');
  assert.equal(byQuantity[0].quantity, 15);
  const all = compareFoods({ requiredSeconds: 10800, limit: FOODS.length })!;
  const fish = all.find(row => row.food.id === 'fish')!;
  assert.equal(fish.quantity, 75);
  assert.equal(fish.totalWeight, 390);
});

test('food rounding respects exact boundaries, fractional recovery and already-fed time', () => {
  const fish = FOODS.find(food => food.id === 'fish')!;
  assert.equal(foodPlanSeconds(fish, 144)?.quantity, 1);
  assert.equal(foodPlanSeconds(fish, 144.01)?.quantity, 2);
  assert.equal(foodPlanSeconds(fish, 10800, 1200)?.quantity, 67);
  assert.equal(foodPlanSeconds(fish, 1200, 1200)?.quantity, 0);
  assert.equal(foodPlanSeconds(fish, 0)?.quantity, 0);
  assert.equal(foodPlanSeconds(fish, 0)?.fillNow, 0);
  assert.equal(foodPlanSeconds(fish, 144)?.fillNow, 1);
  assert.equal(foodPlanSeconds(fish, 144)?.cost, null);
  assert.equal(foodPlanSeconds(fish, 144, 0, 0)?.cost, 0);
  assert.equal(compareFoods({ requiredSeconds: -1 }), null);
  assert.equal(compareFoods({ requiredSeconds: Infinity }), null);
  assert.equal(compareFoods({ requiredSeconds: 100, alreadyFedSeconds: 1201 }), null);
});

test('ML recovery supplies the same seconds-based goal to the food comparison', () => {
  const ml = magicPlan({ current: 3, target: 4, remainingPercent: 100, vocation: 'knight', promoted: false })!;
  assert.equal(ml.seconds, 129600);
  const rows = compareFoods({ requiredSeconds: ml.seconds })!;
  assert.equal(rows[0].food.id, 'brown-mushroom');
  assert.equal(rows[0].quantity, 491);
  assert.equal(rows[0].coverageSeconds, 129624);
});

const resources = { objects: 20, currentMana: 0, maximumMana: 1000,
  blankRunes: 20, currentSoul: 0, manaPerSecond: 1 };

test('UH starts at 420 and persisted server overrides drive mana, charges, soul and food together', () => {
  const state = makeSeed();
  const serverId = state.servers[0].id;
  const uh = spells.find(spell => spell.id === 'ultimate-healing-rune')!;
  const hmm = spells.find(spell => spell.id === 'heavy-magic-missile')!;
  assert.equal(uh.mana, 420);
  assert.equal(RUNE_RECIPES.find(recipe => recipe.id === 'uh')?.mana, 420);
  assert.equal(runeBatchFromSpell(effectiveSpell(state, serverId, uh), resources)?.mana, 8400);
  state.spellOverrides = { [spellOverrideKey(serverId, uh.id)]: { mana: 900, runeCharges: 4, soulCost: 0 } };
  const reloaded = JSON.parse(JSON.stringify(state));
  const effective = effectiveSpell(reloaded, serverId, uh);
  const batch = runeBatchFromSpell(effective, resources)!;
  assert.equal(batch.mana, 18000);
  assert.equal(batch.charges, 80);
  assert.equal(batch.soulNeeded, 0);
  assert.equal(batch.soulShortfall, 0);
  assert.equal(batch.regenerationSeconds, 18000);
  assert.equal(batch.resourcesSufficient, true);
  const fish = FOODS.find(food => food.id === 'fish')!;
  assert.equal(foodPlanSeconds(fish, batch.regenerationSeconds!)?.quantity, 125);
  assert.equal(effectiveSpell(reloaded, 'another-server', uh).mana, 420);
  assert.equal(effectiveSpell(reloaded, serverId, hmm).mana, 280);
  assert.equal(uh.mana, 420); // public reference is not mutated
});

test('unknown rune fields stay unknown and cannot masquerade as a zero-cost recipe', () => {
  const state = makeSeed(), serverId = state.servers[0].id;
  const uh = spells.find(spell => spell.id === 'ultimate-healing-rune')!;
  const key = spellOverrideKey(serverId, uh.id);
  state.spellOverrides = { [key]: { mana: null, soulCost: 0 } };
  assert.equal(runeBatchFromSpell(effectiveSpell(state, serverId, uh), resources), null);
  state.spellOverrides[key] = { runeCharges: null };
  assert.equal(runeBatchFromSpell(effectiveSpell(state, serverId, uh), resources), null);
  state.spellOverrides[key] = { soulCost: null };
  const unknown = runeBatchFromSpell(effectiveSpell(state, serverId, uh), resources)!;
  assert.equal(unknown.soulNeeded, null);
  assert.equal(unknown.resourcesSufficient, false);
  state.spellOverrides[key] = { mana: 0, soulCost: 0 };
  const free = runeBatchFromSpell(effectiveSpell(state, serverId, uh), { ...resources, maximumMana: 0 })!;
  assert.equal(free.regenerationSeconds, 0);
  assert.equal(free.soulNeeded, 0);
  assert.equal(free.resourcesSufficient, true);
});
