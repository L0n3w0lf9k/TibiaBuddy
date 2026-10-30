import test from 'node:test';
import assert from 'node:assert/strict';
import { FOODS, SPELL_MODELS, characterStats, foodPlan, magicPlan, magicStepMana, manaFluidPlan,
  meleePeak, rangedScenario, regeneration, runePlan, spellRange } from '../src/domain/mechanics.ts';

test('June 2006 knight fixture: ML3→4 is 43,200 mana and 36 fed hours', () => {
  const plan = magicPlan({ current: 3, target: 4, remainingPercent: 100, vocation: 'knight', promoted: false })!;
  assert.equal(plan.mana, 43200);
  assert.equal(plan.seconds, 36 * 3600);
  assert.equal(regeneration('knight', true)?.manaPerHour, 1200);
  assert.equal(regeneration('knight', true)?.hpPerHour, 900);
});

test('promotion changes regeneration, not mage mana requirement', () => {
  const base = { current: 14, target: 16, remainingPercent: 50, vocation: 'druid' as const };
  const normal = magicPlan({ ...base, promoted: false })!;
  const promoted = magicPlan({ ...base, promoted: true })!;
  assert.equal(normal.mana, promoted.mana);
  assert.ok(Math.abs(promoted.seconds / normal.seconds - 2 / 3) < 1e-12);
  assert.equal(regeneration('paladin', false)?.manaPerHour, 1800);
  assert.equal(regeneration('paladin', true)?.manaPerHour, 2400);
});

test('partial ML progress targets the next step without recurrent rounding', () => {
  const plan = magicPlan({ current: 17, target: 20, remainingPercent: 37.5, vocation: 'druid', promoted: true })!;
  assert.ok(Math.abs(plan.mana - 21714.00434432966) < 1e-6);
  assert.equal(plan.steps[0].from, 17);
  assert.equal(plan.steps[0].to, 18);
  assert.ok(Math.abs(plan.remainingNextStepMana - 3032.6821709957626) < 1e-6);
  assert.notEqual(magicStepMana(17, 'druid'), Math.round(magicStepMana(17, 'druid')!));
});

test('ML inputs reject invalid percentages and never produce negative target requirements', () => {
  const base = { current: 4, target: 3, remainingPercent: 50, vocation: 'knight' as const, promoted: false };
  assert.equal(magicPlan(base)?.mana, 0);
  assert.equal(magicPlan({ ...base, remainingPercent: 101 }), null);
  assert.equal(magicPlan({ ...base, current: 3.5 }), null);
  assert.equal(magicPlan({ ...base, vocation: 'unselected' }), null);
  const zero = magicPlan({ ...base, target: 5, remainingPercent: 0 })!;
  assert.equal(zero.mana, 0);
  assert.equal(zero.steps[0].from, 4); // a displayed 0% must not silently change attained ML
});

test('server progress and regeneration rates have separate effects', () => {
  const base = { current: 3, target: 4, remainingPercent: 100, vocation: 'knight' as const, promoted: false };
  const plan = magicPlan({ ...base, magicRate: 2, regenerationRate: 3 })!;
  assert.equal(plan.mana, 21600);
  assert.equal(plan.seconds, 6 * 3600);
  assert.equal(magicPlan({ ...base, magicRate: 0 }), null);
});

test('food duration does not depend on vocation and filling cannot exceed 20 minutes', () => {
  const fish = FOODS.find(food => food.id === 'fish')!;
  const plan = foodPlan(fish, 1)!;
  assert.equal(plan.quantity, 25);
  assert.equal(plan.weight, 130);
  assert.equal(plan.fillNow, 8);
  assert.equal(plan.fedAfterFillingSeconds, 1152);
  assert.equal(plan.cost, null);
  assert.equal(foodPlan(fish, 1, 1201), null);
  assert.equal(foodPlan(fish, 0, 1200)?.quantity, 0);
  assert.equal(fish.seconds * regeneration('druid', false)!.manaPerSecond, 96);
  assert.equal(fish.seconds * regeneration('druid', true)!.manaPerSecond, 144);
});

test('fluid budgets round container count upward and distinguish gross and refundable cost', () => {
  assert.deepEqual(manaFluidPlan(43200, 100, 55, 5), { count: 432, gross: 23760, refund: 2160, net: 21600 });
  assert.equal(manaFluidPlan(101, 100, 55, 5)?.count, 2);
  assert.equal(manaFluidPlan(100, 0, 55, 5), null);
  assert.equal(manaFluidPlan(100, 100, 55, 56), null);
});

const batch = { objects: 20, manaPerCast: 280, chargesPerObject: 5, currentMana: 280,
  maximumMana: 600, blankRunes: 20, soulPerCast: 2, currentSoul: 100, manaPerSecond: 1 };

test('a backpack of HMM has 20 objects, 100 uses, and separate blank/soul budgets', () => {
  const plan = runePlan(batch)!;
  assert.equal(plan.casts, 20);
  assert.equal(plan.objects, 20);
  assert.equal(plan.charges, 100);
  assert.equal(plan.mana, 5600);
  assert.equal(plan.regenerationSeconds, 5320);
  assert.equal(plan.soulNeeded, 40);
  assert.equal(plan.resourcesSufficient, true);
});

test('missing soul/blank resources and insufficient maximum mana are not hidden by a mana ETA', () => {
  const short = runePlan({ ...batch, currentSoul: 10, blankRunes: 3 })!;
  assert.equal(short.soulShortfall, 30);
  assert.equal(short.blankShortfall, 17);
  assert.equal(short.resourcesSufficient, false);
  const capacity = runePlan({ ...batch, currentMana: 100, maximumMana: 200 })!;
  assert.equal(capacity.capacityFits, false);
  assert.equal(capacity.regenerationSeconds, null);
  const unknown = runePlan({ ...batch, soulPerCast: null })!;
  assert.equal(unknown.soulNeeded, null);
  assert.equal(unknown.resourcesSufficient, false);
  assert.equal(runePlan({ ...batch, currentMana: 800 }), null);
});

test('zero soul is a known no-cost recipe and never divides by zero', () => {
  const freeSoul = runePlan({ ...batch, soulPerCast: 0, currentSoul: 0 })!;
  assert.equal(freeSoul.soulNeeded, 0);
  assert.equal(freeSoul.soulShortfall, 0);
  assert.equal(freeSoul.soulLimited, false);
  assert.equal(freeSoul.availableSoulCasts, null);
  assert.equal(freeSoul.resourcesSufficient, true);
  assert.equal(freeSoul.regenerationSeconds, 5320);
  const unknownSoul = runePlan({ ...batch, soulPerCast: null, currentSoul: 0 })!;
  assert.equal(unknownSoul.soulLimited, null);
  assert.equal(unknownSoul.resourcesSufficient, false);
  assert.equal(runePlan({ ...batch, soulPerCast: -1 }), null);
});

test('zero-mana server recipes need no recovery while unsafe batch totals are rejected', () => {
  const freeMana = runePlan({ ...batch, manaPerCast: 0, currentMana: 0, maximumMana: 0, soulPerCast: 0 })!;
  assert.equal(freeMana.mana, 0);
  assert.equal(freeMana.capacityFits, true);
  assert.equal(freeMana.regenerationSeconds, 0);
  assert.equal(freeMana.resourcesSufficient, true);
  assert.equal(runePlan({ ...batch, manaPerCast: Number.MAX_SAFE_INTEGER }), null);
  assert.equal(runePlan({ ...batch, chargesPerObject: Number.MAX_SAFE_INTEGER }), null);
});

test('level-based stats preserve the level-8 vocation boundary', () => {
  assert.deepEqual(characterStats(8, 'druid'), { hp: 185, mana: 35, capacity: 470 });
  assert.deepEqual(characterStats(25, 'druid'), { hp: 270, mana: 545, capacity: 640 });
  assert.deepEqual(characterStats(9, 'knight'), { hp: 200, mana: 40, capacity: 495 });
  assert.equal(characterStats(25, 'unselected'), null);
});

test('raw legacy ranges reproduce their stated model without inventing mitigation', () => {
  const hmm = SPELL_MODELS.find(model => model.id === 'hmm')!;
  const range = spellRange(hmm, 25, 30)!;
  assert.equal(range.min, 28);
  assert.equal(range.max, 56);
  const low = spellRange(hmm, 8, 0)!;
  assert.equal(low.min, 20);
  assert.equal(low.max, 40);
  const uh = SPELL_MODELS.find(model => model.id === 'uh')!;
  assert.equal(spellRange(uh, 50, 5)?.max, 287);
  assert.equal(SPELL_MODELS.find(model => model.id === 'sd')?.element, 'Physical');
  assert.equal(spellRange(hmm, -1, 40), null);
});

test('weapon estimates keep the explicit full-attack model separate from observed ranged scenarios', () => {
  assert.equal(meleePeak(60, 30), 126);
  const ranged = rangedScenario(40, 80, 75, 2, 3)!;
  assert.equal(ranged.midpointDPS, 22.5);
  assert.equal(ranged.attacksPerHour, 1800);
  assert.equal(ranged.costPerHour, 5400);
  assert.equal(rangedScenario(80, 40, 75, 2, 3), null);
  assert.equal(rangedScenario(40, 80, 101, 2, 3), null);
});
