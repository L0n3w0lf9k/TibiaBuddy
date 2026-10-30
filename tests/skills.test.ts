import test from 'node:test';
import assert from 'node:assert/strict';
import { cumulativeSkillTries, planSkillTraining, requiredSkillTries, skillMultiplier,
  type PhysicalSkill, type SkillTrainingInput } from '../src/domain/skills.ts';
import type { Vocation } from '../src/types.ts';

const basic: SkillTrainingInput = { vocation: 'knight', promoted: false, skill: 'axe',
  currentLevel: 10, percentRemaining: 100, targetLevel: 11, attackers: 2 };

// Independent oracle: accumulate rational geometric terms, then truncate the
// TOTAL. It deliberately does not use the implementation's closed-form ratio.
function summedRational(base: bigint, factorTenths: bigint, intervals: number): bigint {
  let numerator = 0n, denominator = 1n, power = 1n;
  for (let i = 0; i < intervals; i++) {
    if (i > 0) { numerator *= 10n; denominator *= 10n; power *= factorTenths; }
    numerator += base * power;
  }
  return numerator / denominator;
}

test('starting level10 uses the right base for each physical skill', () => {
  for (const vocation of ['knight', 'paladin', 'sorcerer', 'druid'] as const) {
    for (const skill of ['axe', 'sword', 'club', 'fist'] as const) assert.equal(requiredSkillTries(vocation, skill, 10), 50);
    assert.equal(requiredSkillTries(vocation, 'distance', 10), 30);
    assert.equal(requiredSkillTries(vocation, 'shielding', 10), 100);
    assert.equal(cumulativeSkillTries(vocation, 'axe', 10), 0);
  }
});

test('cumulative rounding differs from independently truncating each increment', () => {
  assert.equal(cumulativeSkillTries('knight', 'axe', 14), 232);
  assert.equal(requiredSkillTries('knight', 'axe', 13), 67);
  const plan = planSkillTraining({ ...basic, targetLevel: 14 });
  assert.deepEqual(plan.rows.map(row => row.fullTries), [50, 55, 60, 67]);
  assert.equal(plan.requiredTries, 232);
  assert.equal(plan.idealSeconds, 464);
  assert.equal(requiredSkillTries('druid', 'axe', 11), 90); // exact decimal1.8, no binary89 artifact
});

test('all vocation factors match an independently summed rational curve', () => {
  const cases: [Vocation, PhysicalSkill, bigint, bigint][] = [
    ['knight', 'sword', 50n, 11n], ['knight', 'distance', 30n, 14n],
    ['paladin', 'axe', 50n, 12n], ['paladin', 'distance', 30n, 11n],
    ['sorcerer', 'club', 50n, 20n], ['sorcerer', 'fist', 50n, 15n],
    ['druid', 'axe', 50n, 18n], ['druid', 'shielding', 100n, 15n],
  ];
  for (const [vocation, skill, base, factor] of cases) {
    for (const level of [11, 13, 14, 20, 35]) {
      const expected = summedRational(base, factor, level - 10);
      assert.equal(BigInt(cumulativeSkillTries(vocation, skill, level)), expected);
      assert.equal(BigInt(requiredSkillTries(vocation, skill, level)), summedRational(base, factor, level - 9) - expected);
    }
  }
});

test('promotion changes neither physical requirements nor attack cadence', () => {
  for (const vocation of ['knight', 'paladin', 'sorcerer', 'druid'] as const) {
    const base = { ...basic, vocation, currentLevel: 20, targetLevel: 22 };
    const normal = planSkillTraining(base);
    const promoted = planSkillTraining({ ...base, promoted: true });
    assert.equal(promoted.requiredTries, normal.requiredTries);
    assert.equal(promoted.idealSeconds, normal.idealSeconds);
    assert.equal(skillMultiplier(vocation, 'axe', true), skillMultiplier(vocation, 'axe', false));
  }
});

test('fractional percent remaining applies only to the attained-to-next interval', () => {
  const plan = planSkillTraining({ ...basic, currentLevel: 13, targetLevel: 15, percentRemaining: 37.5 });
  assert.equal(plan.nextLevelTries, 67);
  assert.equal(plan.rows[0].fromLevel, 13);
  assert.equal(plan.rows[0].toLevel, 14);
  assert.equal(plan.rows[0].remainingTries, 26); // ceil(67 ×37.5%)
  assert.equal(plan.rows[1].remainingTries, 73);
  assert.equal(plan.requiredTries, 99);
  assert.equal(plan.idealSeconds, 198);
  assert.equal(planSkillTraining({ ...basic, percentRemaining: 0 }).requiredTries, 0);
  assert.equal(planSkillTraining({ ...basic, percentRemaining: 0 }).idealSeconds, 0);
  assert.equal(planSkillTraining({ ...basic, percentRemaining: 1e-7 }).requiredTries, 1);
});

test('shielding doubles from one to two attackers and is capped for three', () => {
  const plan = planSkillTraining({ ...basic, skill: 'shielding' });
  assert.deepEqual(plan.attackerComparisons.map(row => row.triesPerCycle), [1, 2, 2]);
  assert.deepEqual(plan.attackerComparisons.map(row => row.idealSeconds), [200, 100, 100]);
  assert.deepEqual(plan.attackerComparisons.map(row => row.triesPerHour), [1800, 3600, 3600]);
  assert.equal(plan.triesPerCycle, 2);
  assert.equal(plan.requiredTries, 100);
  const melee = planSkillTraining(basic);
  assert.deepEqual(melee.attackerComparisons.map(row => row.idealSeconds), [100, 100, 100]);
});

test('distance training points are not confused with the number of shots', () => {
  const landed = planSkillTraining({ ...basic, vocation: 'paladin', skill: 'distance' });
  assert.equal(landed.requiredTries, 30);
  assert.equal(landed.triesPerCycle, 2);
  assert.equal(landed.idealSeconds, 30); //15 shots ×2s
  const onePoint = planSkillTraining({ ...basic, skill: 'distance', distancePointsPerShot: 1 });
  assert.equal(onePoint.requiredTries, 30);
  assert.equal(onePoint.idealSeconds, 60);
  assert.equal(planSkillTraining({ ...basic, skill: 'distance', percentRemaining: 10 }).idealSeconds, 4); //3 points take2 full cycles
});

test('skill rate and qualifying uptime change credited rate, not required points', () => {
  const faster = planSkillTraining({ ...basic, skillRate: 2 });
  assert.equal(faster.requiredTries, 50);
  assert.equal(faster.idealSeconds, 50);
  assert.equal(faster.triesPerHour, 3600);
  const halfUptime = planSkillTraining({ ...basic, efficiencyPercent: 50 });
  assert.equal(halfUptime.idealSeconds, 100);
  assert.equal(halfUptime.estimatedSeconds, 200);
  assert.equal(halfUptime.triesPerHour, 900);
  const stalled = planSkillTraining({ ...basic, efficiencyPercent: 0 });
  assert.equal(stalled.idealSeconds, 100);
  assert.equal(stalled.estimatedSeconds, null);
  assert.equal(stalled.triesPerHour, 0);
  assert.equal(planSkillTraining({ ...basic, skillRate: 0.1 }).idealSeconds, 1000);
});

test('whole-cycle timing carries excess progress across skill boundaries', () => {
  const plan = planSkillTraining({ ...basic, targetLevel: 12, skillRate: 200 });
  assert.equal(plan.requiredTries, 105);
  assert.equal(plan.idealSeconds, 2);
  assert.deepEqual(plan.rows.map(row => row.idealSeconds), [2, 0]);
  assert.equal(plan.rows.reduce((sum, row) => sum + row.idealSeconds, 0), plan.idealSeconds);
});

test('faster custom attack cycles cannot bypass the classic defense interval', () => {
  assert.throws(() => planSkillTraining({ ...basic, skill: 'shielding', cycleSeconds: 1 }), /defense interval/);
  const slower = planSkillTraining({ ...basic, skill: 'shielding', cycleSeconds: 4 });
  assert.equal(slower.idealSeconds, 200);
  assert.equal(slower.triesPerHour, 1800);
});

test('invalid, reversed, or unsafe targets never produce plausible-looking estimates', () => {
  const invalid: Partial<SkillTrainingInput>[] = [
    { currentLevel: 9 }, { currentLevel: 10.5 }, { targetLevel: 10 }, { targetLevel: 9 },
    { targetLevel: 201 }, { percentRemaining: -1 }, { percentRemaining: 101 },
    { percentRemaining: NaN }, { skillRate: 0 }, { skillRate: 0.009 }, { skillRate: Infinity }, { skillRate: 1001 },
    { cycleSeconds: 0 }, { cycleSeconds: 61 }, { efficiencyPercent: 101 }, { vocation: 'unselected' },
  ];
  for (const change of invalid) assert.throws(() => planSkillTraining({ ...basic, ...change }), RangeError);
  assert.throws(() => planSkillTraining({ ...basic, vocation: 'sorcerer', targetLevel: 60 }), /safe numeric range/);
  assert.throws(() => planSkillTraining({ ...basic, skillRate: Number.MIN_VALUE }), /Skill rate must be/);
});
