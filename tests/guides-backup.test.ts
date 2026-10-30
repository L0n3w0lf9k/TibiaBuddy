import test from 'node:test';
import assert from 'node:assert/strict';
import { makeTestState } from './fixtures/appState';
import { validateBackup } from '../src/domain/backupValidation';
import { upgradeJournal } from '../src/domain/migrations';
import type { GuideLink } from '../src/types';

const guide: GuideLink = { id: 'my-guide', title: 'My hunt guide', url: 'https://www.youtube.com/watch?v=hd9TuibVH4o&t=120',
  description: 'Notes for my next hunt', kind: 'video', vocations: ['druid', 'sorcerer'], versionLabel: '7.7',
  createdAt: '2026-10-30T14:00:00.000Z', updatedAt: '2026-10-30T14:00:00.000Z' };

test('guide links survive a JSON backup and additive migration', () => {
  const state = makeTestState(); state.guideLinks = [structuredClone(guide)];
  const restored = JSON.parse(JSON.stringify(state)); validateBackup(restored);
  assert.deepEqual(upgradeJournal(restored).state.guideLinks, state.guideLinks);
});

test('legacy backups restore an empty personal guide collection rather than retaining current links', () => {
  const state = makeTestState(); delete state.guideLinks;
  validateBackup(state);
  const upgraded = upgradeJournal(state);
  assert.deepEqual(upgraded.state.guideLinks, []);
  assert.equal(state.guideLinks, undefined);
  assert.equal(upgradeJournal(upgraded.state).changed, false);
});

test('unsafe URLs and malformed guide records are rejected on import', () => {
  for (const patch of [
    { url: 'javascript:alert(1)' }, { url: 'data:text/html,hello' }, { url: 'https://name:password@example.com' },
    { url: 'https://example.com/\nunsafe' }, { url: '/relative' }, { title: '' }, { title: 'x'.repeat(161) },
    { description: 'x'.repeat(1001) }, { kind: 'script' }, { vocations: ['knight', 'knight'] },
    { vocations: ['unselected'] }, { createdAt: 'not a date' }, { updatedAt: '2026-10-30' }
  ]) {
    const state = makeTestState(); state.guideLinks = [{ ...guide, ...patch } as GuideLink];
    assert.throws(() => validateBackup(state), /guide|Guide/i, JSON.stringify(patch));
  }
});
