import type { Vocation } from '../types';

export type KnownVocation = Exclude<Vocation, 'unselected'>;
export const VOCATIONS: { id: KnownVocation; name: string; promotedName: string }[] = [
  { id: 'knight', name: 'Knight', promotedName: 'Elite Knight' },
  { id: 'paladin', name: 'Paladin', promotedName: 'Royal Paladin' },
  { id: 'sorcerer', name: 'Sorcerer', promotedName: 'Master Sorcerer' },
  { id: 'druid', name: 'Druid', promotedName: 'Elder Druid' },
];
export const SOURCES = {
  update: 'https://www.tibia.com/news/?id=355&subtopic=newsarchive',
  knight: 'https://forum.tibia.pl/showthread.php?p=843113',
  magic: 'https://forums.tibiabr.com/threads/122048-Mana-Necess%C3%A1rio-Para-Pr%C3%B3ximo-ML',
  rounding: 'https://tibia.fandom.com/wiki/Talk%3AFormulae',
  food: 'https://gamefaqs.gamespot.com/webonly/916616-tibia/faqs/19372',
  runes: 'https://tibiaorigins.com.br/runes',
  soul: 'https://www.tibia.com/support/?entryid=76&subtopic=gethelp',
  damage: 'https://www.tibialegacy.com/calculators.php',
  historicalDamage: 'https://forums.tibiabr.com/threads/94989-C%C3%A1lculo-de-dano-TOMADO',
};

const finite = (n: number) => Number.isFinite(n);
const positive = (n: number) => finite(n) && n > 0;
const nonnegative = (n: number) => finite(n) && n >= 0;
const whole = (n: number) => nonnegative(n) && Number.isInteger(n);

/** Post-7.6 candidate baseline. Each tick is kept explicit; no modern bonuses. */
export function regeneration(vocation: Vocation, promoted: boolean, rate = 1) {
  if (vocation === 'unselected' || !positive(rate)) return null;
  const mage = vocation === 'sorcerer' || vocation === 'druid';
  const hpEvery = mage ? 12 : vocation === 'knight' ? (promoted ? 4 : 6) : (promoted ? 6 : 8);
  const manaEvery = mage ? (promoted ? 2 : 3) : vocation === 'knight' ? 6 : (promoted ? 3 : 4);
  return { hpAmount: 1, hpEvery, manaAmount: 2, manaEvery, rate,
    hpPerSecond: rate / hpEvery, manaPerSecond: 2 * rate / manaEvery,
    hpPerHour: 3600 * rate / hpEvery, manaPerHour: 7200 * rate / manaEvery };
}

export function magicMultiplier(vocation: Vocation): number | null {
  return vocation === 'knight' ? 3 : vocation === 'paladin' ? 1.4 : vocation === 'unselected' ? null : 1.1;
}

/** Direct formula, intentionally unrounded. Historic integer rounding is unresolved. */
export function magicStepMana(current: number, vocation: Vocation): number | null {
  const b = magicMultiplier(vocation);
  if (b === null || !whole(current) || current > 200) return null;
  const mana = 1600 * b ** current;
  return finite(mana) ? mana : null;
}

export function magicPlan(input: {
  current: number; remainingPercent: number; target: number; vocation: Vocation;
  promoted: boolean; regenerationRate?: number; magicRate?: number;
}) {
  const { current, target, remainingPercent, vocation, promoted } = input;
  const magicRate = input.magicRate ?? 1;
  const regen = regeneration(vocation, promoted, input.regenerationRate ?? 1);
  if (!whole(current) || !whole(target) || current > 200 || target > 200 ||
    !nonnegative(remainingPercent) || remainingPercent > 100 || !positive(magicRate) || !regen) return null;
  const steps: { from: number; to: number; fraction: number; mana: number }[] = [];
  // Percent input never changes the attained ML, including a displayed 0%.
  for (let m = current; m < target; m++) {
    const step = magicStepMana(m, vocation);
    if (step === null) return null;
    const fraction = m === current ? remainingPercent / 100 : 1;
    steps.push({ from: m, to: m + 1, fraction, mana: step * fraction / magicRate });
  }
  const mana = steps.reduce((total, step) => total + step.mana, 0);
  return { steps, mana, seconds: mana / regen.manaPerSecond, regen, magicRate,
    nextStepMana: magicStepMana(current, vocation)! / magicRate,
    remainingNextStepMana: magicStepMana(current, vocation)! * remainingPercent / 100 / magicRate };
}

export interface FoodRecord { id: string; name: string; seconds: number; weight: number }
export const FOODS: FoodRecord[] = [
  { id: 'white-mushroom', name: 'White mushroom', seconds: 108, weight: 0.4 },
  { id: 'brown-mushroom', name: 'Brown mushroom', seconds: 264, weight: 0.2 },
  { id: 'fish', name: 'Fish', seconds: 144, weight: 5.2 },
  { id: 'bread', name: 'Bread', seconds: 120, weight: 5 },
  { id: 'ham', name: 'Ham', seconds: 360, weight: 20 },
  { id: 'dragon-ham', name: 'Dragon ham', seconds: 720, weight: 30 },
  { id: 'meat', name: 'Meat', seconds: 180, weight: 13 },
  { id: 'egg', name: 'Egg', seconds: 72, weight: 0.3 },
];
export const FOOD_CAP_SECONDS = 1200;

export function foodPlan(food: FoodRecord, hours: number, alreadyFedSeconds = 0, unitPrice: number | null = null) {
  if (!nonnegative(hours) || !positive(food.seconds) || !nonnegative(food.weight) ||
    !nonnegative(alreadyFedSeconds) || alreadyFedSeconds > FOOD_CAP_SECONDS ||
    (unitPrice !== null && !nonnegative(unitPrice))) return null;
  const requiredSeconds = Math.max(0, hours * 3600 - alreadyFedSeconds);
  const quantity = Math.ceil(requiredSeconds / food.seconds);
  const fillNow = Math.floor((FOOD_CAP_SECONDS - alreadyFedSeconds) / food.seconds);
  return { quantity, requiredSeconds, suppliedSeconds: alreadyFedSeconds + quantity * food.seconds,
    weight: quantity * food.weight, cost: unitPrice === null ? null : quantity * unitPrice,
    fillNow, fedAfterFillingSeconds: alreadyFedSeconds + fillNow * food.seconds };
}

export function manaFluidPlan(mana: number, averageRestore: number, price: number, refund: number) {
  if (!nonnegative(mana) || !positive(averageRestore) || !nonnegative(price) || !nonnegative(refund) || refund > price) return null;
  const count = Math.ceil(mana / averageRestore);
  return { count, gross: count * price, refund: count * refund, net: count * (price - refund) };
}

export interface RuneRecipe {
  id: string; name: string; words: string; mana: number; level: number;
  charges: number; vocations: KnownVocation[]; soul: number | null;
}
/** Costs/charges are source-tagged candidates, with soul intentionally unknown until supplied. */
export const RUNE_RECIPES: RuneRecipe[] = [
  { id: 'uh', name: 'Ultimate healing', words: 'adura vita', mana: 400, level: 24, charges: 1, vocations: ['druid'], soul: null },
  { id: 'hmm', name: 'Heavy magic missile', words: 'adori gran', mana: 280, level: 25, charges: 5, vocations: ['sorcerer', 'druid', 'paladin'], soul: null },
  { id: 'gfb', name: 'Great fireball', words: 'adori gran flam', mana: 480, level: 23, charges: 2, vocations: ['sorcerer', 'druid'], soul: null },
  { id: 'ih', name: 'Intense healing', words: 'adura gran', mana: 240, level: 15, charges: 1, vocations: ['druid'], soul: null },
  { id: 'sd', name: 'Sudden death', words: 'adori vita vis', mana: 880, level: 45, charges: 1, vocations: ['sorcerer'], soul: null },
];

export function runePlan(input: {
  objects: number; manaPerCast: number; chargesPerObject: number;
  currentMana: number; maximumMana: number; blankRunes: number;
  soulPerCast: number | null; currentSoul: number; manaPerSecond: number;
}) {
  const { objects, manaPerCast, chargesPerObject, currentMana, maximumMana, blankRunes, soulPerCast, currentSoul, manaPerSecond } = input;
  if (!whole(objects) || !positive(manaPerCast) || !whole(chargesPerObject) || chargesPerObject === 0 ||
    !nonnegative(currentMana) || !positive(maximumMana) || currentMana > maximumMana ||
    !whole(blankRunes) || !nonnegative(currentSoul) || !positive(manaPerSecond) ||
    (soulPerCast !== null && (!whole(soulPerCast) || soulPerCast === 0))) return null;
  const mana = objects * manaPerCast;
  const soulNeeded = soulPerCast === null ? null : objects * soulPerCast;
  const needsSoul = soulNeeded === null ? null : Math.max(0, soulNeeded - currentSoul);
  const capacityFits = maximumMana >= manaPerCast;
  return { casts: objects, objects, charges: objects * chargesPerObject, mana,
    blankShortfall: Math.max(0, objects - blankRunes), soulNeeded, soulShortfall: needsSoul,
    availableSoulCasts: soulPerCast === null ? null : Math.floor(currentSoul / soulPerCast),
    capacityFits,
    regenerationSeconds: capacityFits ? Math.max(0, mana - currentMana) / manaPerSecond : null,
    // This is a material check, never a claim that the character knows/is allowed to cast a spell.
    resourcesSufficient: capacityFits && blankRunes >= objects && needsSoul === 0 };
}

export function characterStats(level: number, vocation: Vocation, rookExit = 8) {
  if (!whole(level) || level < 1 || !whole(rookExit) || rookExit < 1 || vocation === 'unselected') return null;
  const rookLevels = Math.min(level, rookExit) - 1;
  const mainLevels = Math.max(0, level - rookExit);
  const hpGain = vocation === 'knight' ? 15 : vocation === 'paladin' ? 10 : 5;
  const manaGain = vocation === 'knight' ? 5 : vocation === 'paladin' ? 15 : 30;
  const capGain = vocation === 'knight' ? 25 : vocation === 'paladin' ? 20 : 10;
  return { hp: 150 + rookLevels * 5 + mainLevels * hpGain,
    mana: rookLevels * 5 + mainLevels * manaGain,
    capacity: 400 + rookLevels * 10 + mainLevels * capGain };
}

export interface SpellModel {
  id: string; name: string; words: string; type: 'rune' | 'instant';
  category: 'damage' | 'healing'; element: string; low: number; high: number; floorPower: boolean;
}
/** Independent implementation of the inspected Legacy calculator's published raw model.
 * These coefficients are comparisons/estimates, not certified 7.7 final combat damage. */
export const SPELL_MODELS: SpellModel[] = [
  { id: 'hmm', name: 'Heavy magic missile', words: 'adori gran', type: 'rune', category: 'damage', element: 'Energy', low: .2, high: .4, floorPower: true },
  { id: 'gfb', name: 'Great fireball', words: 'adori gran flam', type: 'rune', category: 'damage', element: 'Fire', low: .35, high: .65, floorPower: true },
  { id: 'sd', name: 'Sudden death', words: 'adori vita vis', type: 'rune', category: 'damage', element: 'Physical', low: 1.3, high: 1.7, floorPower: false },
  { id: 'explosion', name: 'Explosion', words: 'adevo mas hur', type: 'rune', category: 'damage', element: 'Physical', low: .2, high: 1, floorPower: false },
  { id: 'lmm', name: 'Light magic missile', words: 'adori', type: 'rune', category: 'damage', element: 'Energy', low: .1, high: .2, floorPower: true },
  { id: 'fireball', name: 'Fireball', words: 'adori flam', type: 'rune', category: 'damage', element: 'Fire', low: .15, high: .25, floorPower: true },
  { id: 'exura', name: 'Light healing', words: 'exura', type: 'instant', category: 'healing', element: 'Healing', low: .1, high: .3, floorPower: true },
  { id: 'exura-gran', name: 'Intense healing spell', words: 'exura gran', type: 'instant', category: 'healing', element: 'Healing', low: .2, high: .6, floorPower: true },
  { id: 'exura-vita', name: 'Ultimate healing spell', words: 'exura vita', type: 'instant', category: 'healing', element: 'Healing', low: 2, high: 3, floorPower: true },
  { id: 'uh', name: 'Ultimate healing rune', words: 'adura vita', type: 'rune', category: 'healing', element: 'Healing', low: 2.5, high: 2.5, floorPower: true },
  { id: 'ih', name: 'Intense healing rune', words: 'adura gran', type: 'rune', category: 'healing', element: 'Healing', low: .4, high: 1, floorPower: true },
  { id: 'heal-friend', name: 'Heal friend', words: 'exura sio', type: 'instant', category: 'healing', element: 'Healing', low: .8, high: 1.6, floorPower: true },
  { id: 'mass-healing', name: 'Mass healing', words: 'exura gran mas res', type: 'instant', category: 'healing', element: 'Healing', low: 1.6, high: 2.4, floorPower: true },
  { id: 'energy-strike', name: 'Energy strike', words: 'exori vis', type: 'instant', category: 'damage', element: 'Energy', low: .35, high: .55, floorPower: false },
  { id: 'flame-strike', name: 'Flame strike', words: 'exori flam', type: 'instant', category: 'damage', element: 'Fire', low: .35, high: .55, floorPower: false },
  { id: 'force-strike', name: 'Force strike', words: 'exori mort', type: 'instant', category: 'damage', element: 'Physical', low: .35, high: .55, floorPower: false },
  { id: 'fire-wave', name: 'Fire wave', words: 'exevo flam hur', type: 'instant', category: 'damage', element: 'Fire', low: .2, high: .4, floorPower: true },
  { id: 'energy-beam', name: 'Energy beam', words: 'exevo vis lux', type: 'instant', category: 'damage', element: 'Energy', low: .4, high: .8, floorPower: false },
  { id: 'great-energy-beam', name: 'Great energy beam', words: 'exevo gran vis lux', type: 'instant', category: 'damage', element: 'Energy', low: .4, high: 2, floorPower: false },
  { id: 'energy-wave', name: 'Energy wave', words: 'exevo mort hur', type: 'instant', category: 'damage', element: 'Energy', low: 1, high: 2, floorPower: false },
  { id: 'ue', name: 'Ultimate explosion', words: 'exevo gran mas vis', type: 'instant', category: 'damage', element: 'Physical', low: 2, high: 3, floorPower: false },
];

export function spellRange(model: SpellModel, level: number, magicLevel: number) {
  if (!whole(level) || level < 1 || !whole(magicLevel)) return null;
  const power = 2 * level + 3 * magicLevel;
  const effectivePower = model.floorPower ? Math.max(100, power) : power;
  const min = Math.floor(effectivePower * model.low + 1e-10);
  const max = Math.floor(effectivePower * model.high + 1e-10);
  return { min, max, midpoint: (min + max) / 2, power, effectivePower };
}

export function meleePeak(skill: number, attack: number): number | null {
  if (!whole(skill) || !positive(attack)) return null;
  return Math.floor((5 * skill + 50) * attack * 1.2 / 100 + 1e-10);
}

/** A user-entered scenario, not an inferred historical weapon/ranged formula. */
export function rangedScenario(min: number, max: number, hitPercent: number, attackSeconds: number, costPerAttack: number) {
  if (!nonnegative(min) || !nonnegative(max) || min > max || !nonnegative(hitPercent) ||
    hitPercent > 100 || !positive(attackSeconds) || !nonnegative(costPerAttack)) return null;
  const hitProbability = hitPercent / 100;
  return { midpoint: (min + max) / 2,
    midpointDPS: (min + max) / 2 * hitProbability / attackSeconds,
    minimumDPS: min * hitProbability / attackSeconds, maximumDPS: max * hitProbability / attackSeconds,
    attacksPerHour: 3600 / attackSeconds, costPerHour: costPerAttack * 3600 / attackSeconds };
}
