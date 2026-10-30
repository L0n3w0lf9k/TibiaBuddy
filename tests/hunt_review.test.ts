import test from 'node:test';
import assert from 'node:assert/strict';
import type { HuntSession } from '../src/types.ts';
import { MAX_LEVEL, MAX_XP, activeSeconds, checkXP, completeHunt, huntMetrics, levelForXP,
  pauseHunt, resumeHunt, stopHunt, xpForLevel } from '../src/domain/xp.ts';
import { spells } from '../src/data/game.ts';
import { RUNE_RECIPES, SPELL_MODELS } from '../src/domain/mechanics.ts';

function running(): HuntSession {
  return { id: 'hunt', characterId: 'character', serverId: 'server', startedAt: 1000000,
    stoppedAt: null, startXP: 98800, endXP: null, location: 'Test hunt', notes: '',
    intervals: [{ start: 1000000, end: null }], checkpoints: [], status: 'running' };
}

test('timer restores a running or paused session from serialized data without callback counts', () => {
  const initial = running();
  const restored = JSON.parse(JSON.stringify(initial)) as HuntSession;
  assert.equal(activeSeconds(restored, 1600000), 600);
  pauseHunt(restored, 1600000);
  const paused = JSON.parse(JSON.stringify(restored)) as HuntSession;
  assert.equal(activeSeconds(paused, 3600000), 600);
  resumeHunt(paused, 3600000);
  resumeHunt(paused, 3601000); // a stale second click must not create another running interval
  assert.equal(paused.intervals.length, 2);
  stopHunt(paused, 4200000);
  stopHunt(paused, 4300000);
  assert.equal(activeSeconds(paused, 9000000), 1200);
  completeHunt(paused, 179400); // multiple levels are crossed
  assert.equal(huntMetrics(paused).progress?.level, 24);
  assert.equal(huntMetrics(paused).rate, 241800);
  assert.throws(() => completeHunt(paused, 180000), /Stop the timer/);
});

test('supported high-level XP thresholds remain exact integers and enforce their bound', () => {
  const exact = (level: number) => {
    const l = BigInt(level);
    return Number((50n * l ** 3n - 300n * l ** 2n + 850n * l - 600n) / 3n);
  };
  for (const level of [1, 32, 100, 999, MAX_LEVEL, MAX_LEVEL + 1]) {
    assert.equal(xpForLevel(level), exact(level));
    assert.ok(Number.isSafeInteger(xpForLevel(level)));
  }
  assert.equal(levelForXP(MAX_XP), MAX_LEVEL);
  assert.equal(levelForXP(xpForLevel(MAX_LEVEL) - 1), MAX_LEVEL - 1);
  assert.throws(() => checkXP(MAX_XP + 1));
});

test('manual durations remain independent of record date and final XP replaces checkpoint pace', () => {
  const session = running();
  session.checkpoints.push({ id: 'cp', at: 1900000, xp: 108800, activeSeconds: 900 });
  assert.equal(huntMetrics(session, 2800000).rate, 40000);
  stopHunt(session, 2800000);
  completeHunt(session, 128800);
  assert.equal(huntMetrics(session, 9000000).rate, 60000);
  session.intervals = [];
  session.durationOverride = 2700;
  session.startedAt = 9999999999999;
  assert.equal(activeSeconds(session, 0), 2700);
  assert.equal(huntMetrics(session, 0).rate, 40000);
});

test('rune-production references agree across the independently sourced spell catalogue and calculators', () => {
  for (const recipe of RUNE_RECIPES) {
    const reference = spells.find(spell => spell.words.toLowerCase() === recipe.words);
    assert.ok(reference, `${recipe.name} has a source reference`);
    assert.equal(recipe.mana, reference.mana, recipe.name + ' mana');
    assert.equal(recipe.level, reference.level, recipe.name + ' creation level');
    assert.equal(recipe.charges, reference.runeCharges, recipe.name + ' charges');
    assert.deepEqual([...recipe.vocations].sort(), [...reference.vocations!].sort(), recipe.name + ' vocations');
    assert.ok(reference.soulCost !== null && reference.soulCost > 0);
  }
  const wave = SPELL_MODELS.find(spell => spell.id === 'energy-wave')!;
  assert.equal(wave.words, spells.find(spell => spell.id === 'energy-wave')?.words);
  assert.equal(wave.words, 'exevo mort hur', 'retain the era-specific incantation');
});
