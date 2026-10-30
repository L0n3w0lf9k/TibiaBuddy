import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeProfileEdits } from '../src/domain/profileEdits.ts';
import { xpFromRemaining, xpProgress } from '../src/domain/xp.ts';
import { testCharacter } from './fixtures/appState.ts';
import type { Character } from '../src/types.ts';

function profile(): Character {
  return { ...testCharacter(), vocation: 'knight', axeSkill: 61, swordSkill: 43, clubSkill: 27, fistSkill: 10 };
}
function withXP(character: Character, xp: number, xpEstimated = false): Character {
  const p = xpProgress(xp);
  return { ...character, xp, level: p.level, percentRemaining: 100 - p.percent, xpEstimated };
}

test('closing an unchanged profile preserves all later XP and skill updates', () => {
  const opening = profile(), draft = structuredClone(opening);
  const latest = { ...withXP(opening, 5000), axeSkill: 70, swordSkill: 54, shieldingSkill: 64,
    magicLevel: 7, magicPercentRemaining: 15.25, goalML: 8, maxMana: 456 };
  const before = structuredClone({ latest, opening, draft });
  assert.deepEqual(mergeProfileEdits(latest, opening, draft, 'exact'), latest);
  assert.deepEqual({ latest, opening, draft }, before);
});

test('editing a name and one skill merges those fields without reverting newer others', () => {
  const opening = profile();
  const latest = { ...withXP(opening, 5000), name: 'Name from another tab', axeSkill: 70,
    swordSkill: 54, shieldingSkill: 64, magicLevel: 8, goalML: 9 };
  const draft = { ...opening, name: '  New name  ', axeSkill: 75 };
  const merged = mergeProfileEdits(latest, opening, draft, 'exact');
  assert.deepEqual(merged, { ...latest, name: 'New name', axeSkill: 75 });
});

test('an explicit exact-XP edit applies XP and its derived fields together', () => {
  const opening = profile(), latest = { ...withXP(opening, 5000, true), clubSkill: 40 };
  const merged = mergeProfileEdits(latest, opening, { ...opening, xp: 9300 }, 'exact');
  assert.deepEqual(merged, withXP(latest, 9300, false));
});

test('an explicit percentage edit derives and marks the complete estimated-XP group', () => {
  const opening = { ...profile(), xpEstimated: true };
  const latest = { ...withXP(opening, 5000, false), shieldingSkill: 78 };
  const draft = { ...opening, level: 15, percentRemaining: 37.25 };
  const expectedXP = xpFromRemaining(15, 37.25);
  assert.deepEqual(mergeProfileEdits(latest, opening, draft, 'percentage'), withXP(latest, expectedXP, true));
});

test('untouched percentage-mode fields preserve newer exact XP instead of recomputing stale progress', () => {
  const opening = { ...profile(), xpEstimated: true, percentRemaining: 99.99 };
  const latest = withXP(opening, 5000, false);
  assert.deepEqual(mergeProfileEdits(latest, opening, { ...opening, name: 'Renamed' }, 'percentage'),
    { ...latest, name: 'Renamed' });
});

test('switching XP entry mode intentionally updates the estimate flag and grouped XP', () => {
  const opening = profile(), latest = withXP(opening, 5000, true);
  const asPercentage = mergeProfileEdits(latest, opening, opening, 'percentage');
  assert.deepEqual(asPercentage, withXP(latest, opening.xp, true));
  const estimatedOpening = { ...opening, xpEstimated: true };
  const asExact = mergeProfileEdits(latest, estimatedOpening, estimatedOpening, 'exact');
  assert.deepEqual(asExact, withXP(latest, opening.xp, false));
});

test('promotion and premium stay consistent while unrelated concurrent status edits survive', () => {
  const opening = { ...profile(), premium: true };
  const explicitPromotion = mergeProfileEdits({ ...opening, premium: false }, opening,
    { ...opening, promoted: true }, 'exact');
  assert.equal(explicitPromotion.promoted, true);
  assert.equal(explicitPromotion.premium, true);
  const latestPromotion = { ...opening, promoted: true };
  const nameOnly = mergeProfileEdits(latestPromotion, opening, { ...opening, name: 'Renamed' }, 'exact');
  assert.equal(nameOnly.promoted, true);
  assert.equal(nameOnly.premium, true);
  const noPremium = mergeProfileEdits(latestPromotion, opening, { ...opening, premium: false }, 'exact');
  assert.equal(noPremium.promoted, false);
  assert.equal(noPremium.premium, false);
  const noVocation = mergeProfileEdits(latestPromotion, opening, { ...opening, vocation: 'unselected' }, 'exact');
  assert.equal(noVocation.promoted, false);
});

test('the merge targets the opening identity and preserves non-editable latest fields', () => {
  const opening = profile(), latest = { ...opening, serverId: 'new-server', maxMana: 789, meleeSkill: 80 };
  assert.deepEqual(mergeProfileEdits(latest, opening, { ...opening, name: 'Renamed' }, 'exact'), { ...latest, name: 'Renamed' });
  assert.throws(() => mergeProfileEdits({ ...latest, id: 'another-character' }, opening, opening, 'exact'), /no longer matches/);
  assert.throws(() => mergeProfileEdits(latest, opening, { ...opening, id: 'another-character' }, 'exact'), /no longer matches/);
});
