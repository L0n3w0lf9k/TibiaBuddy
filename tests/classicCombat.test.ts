import test from 'node:test';
import assert from 'node:assert/strict';
import { adjustedWeaponAttack, classicBurstRange, classicDistanceAccuracy, classicWeaponRange, type AttackMode } from '../src/domain/classicCombat';

/** Independent exhaustive evaluation of the source's two 0..99 integer rolls. */
function enumerateRolls(skill: number, adjustedAttack: number) {
  let min = Infinity, max = -Infinity;
  for (let first = 0; first < 100; first++) for (let second = 0; second < 100; second++) {
    const roll = Math.trunc((first + second) / 2);
    const damage = Math.trunc((roll * adjustedAttack * (5 * skill + 50)) / 10000);
    min = Math.min(min, damage); max = Math.max(max, damage);
  }
  return { min, max };
}

test('raw endpoints match all 10,000 source rolls with integer stance adjustments', () => {
  const modes: AttackMode[] = ['offensive', 'balanced', 'defensive'];
  const expected = [124, 103, 62];
  modes.forEach((mode, index) => {
    const value = classicWeaponRange(60, 30, mode)!;
    assert.equal(value.max, expected[index]);
    assert.deepEqual({ min: value.min, max: value.max }, enumerateRolls(60, value.adjustedAttack));
  });
  assert.equal(adjustedWeaponAttack(32, 'offensive'), 38);
  assert.equal(adjustedWeaponAttack(32, 'defensive'), 20);
  assert.equal(classicWeaponRange(70, 32, 'offensive')?.max, 150);
  assert.equal(classicWeaponRange(70, 32, 'balanced')?.max, 126);
  assert.equal(classicWeaponRange(70, 32, 'defensive')?.max, 79);
});

test('fist values and genuine zero attack retain a zero raw minimum', () => {
  assert.deepEqual(['offensive', 'balanced', 'defensive'].map(mode => classicWeaponRange(10, 7, mode as AttackMode)?.max), [7, 6, 4]);
  assert.deepEqual(classicWeaponRange(60, 0), { min: 0, max: 0, adjustedAttack: 0 });
  assert.equal(classicWeaponRange(0, 7)?.min, 0);
});

test('literal inclusive hit comparisons are matched by exhaustive discrete outcomes', () => {
  for (const [skill, tiles] of [[0, 1], [10, 1], [10, 2], [28, 2], [29, 2], [59, 4], [104, 7]]) {
    const difficulty = 15 * (tiles >= 2 ? tiles : 5);
    for (const kind of ['launcher', 'thrown'] as const) {
      const cap = kind === 'launcher' ? 90 : 75;
      let successes = 0;
      for (let skillRoll = 0; skillRoll < difficulty; skillRoll++) for (let chanceRoll = 0; chanceRoll < 100; chanceRoll++) {
        if (skill >= skillRoll && chanceRoll <= cap) successes++;
      }
      const expected = successes / (difficulty * 100);
      assert.ok(Math.abs(classicDistanceAccuracy(skill, tiles, kind, 7)! - expected) < 1e-12);
    }
  }
  assert.equal(classicDistanceAccuracy(29, 2, 'launcher', 6), .91);
  assert.equal(classicDistanceAccuracy(29, 2, 'thrown', 7), .76);
  assert.ok(Math.abs(classicDistanceAccuracy(10, 1, 'launcher', 6)! * 100 - 13.346666666666667) < 1e-10);
  assert.ok(classicDistanceAccuracy(10, 2, 'launcher', 6)! > classicDistanceAccuracy(10, 1, 'launcher', 6)!);
});

test('range and invalid inputs are unavailable rather than misleading 0% or zero damage', () => {
  assert.equal(classicDistanceAccuracy(100, 6, 'launcher', 5), null);
  assert.equal(classicDistanceAccuracy(100, 7, 'launcher', 6), null);
  assert.equal(classicDistanceAccuracy(100, 7, 'thrown', 7), 101 / 105 * .76);
  for (const invalid of [NaN, Infinity, -1, 10.5, 301]) {
    assert.equal(classicWeaponRange(invalid, 30), null);
    assert.equal(classicDistanceAccuracy(invalid, 2, 'thrown', 7), null);
  }
  for (const invalid of [NaN, Infinity, -1, .5, 1001]) assert.equal(classicWeaponRange(60, invalid), null);
  for (const invalid of [0, -1, 1.5, 8, NaN]) assert.equal(classicDistanceAccuracy(60, invalid, 'thrown', 7), null);
});

test('classic burst explosion scales with level and magic level without a minimum-power floor', () => {
  assert.deepEqual(classicBurstRange(8, 0), { min: 0, max: 9, power: 16 });
  assert.deepEqual(classicBurstRange(50, 30), { min: 0, max: 114, power: 190 });
  assert.deepEqual(classicBurstRange(100, 50), { min: 0, max: 210, power: 350 });
  assert.equal(classicBurstRange(50, 31)?.max, 115);
  assert.equal(classicBurstRange(51, 30)?.max, 115);
  assert.equal(classicBurstRange(0, 30), null);
  assert.equal(classicBurstRange(25, NaN), null);
  assert.equal(classicBurstRange(25, -1), null);
  assert.equal(classicBurstRange(25, 201), null);
});
