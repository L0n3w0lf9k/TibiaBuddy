import test from 'node:test';
import assert from 'node:assert/strict';
import { curatedGuides } from '../src/data/guides.ts';
import { cleanGuideDraft, editGuide, guideMatches, guideSource, normalizeGuideUrl, type GuideDraft } from '../src/domain/guides.ts';
import type { GuideLink } from '../src/types.ts';

const fields: GuideDraft = { title: 'Paladin hunt', url: 'https://www.youtube.com/watch?v=example&t=120#route', description: 'Start with spears.', kind: 'video', vocations: ['paladin'], versionLabel: '7.7' };
const opening: GuideLink = { ...fields, id: 'guide-one', createdAt: '2026-10-30T10:00:00.000Z', updatedAt: '2026-10-30T10:00:00.000Z' };

test('web links retain meaningful video timestamps, queries and fragments', () => {
  assert.equal(normalizeGuideUrl('  https://www.youtube.com/watch?v=example&t=120#route  '), fields.url);
  assert.equal(normalizeGuideUrl('HTTP://Example.com/guide?q=one%20two#floor-3'), 'http://example.com/guide?q=one%20two#floor-3');
  assert.equal(guideSource(fields.url), 'youtube.com');
});

test('only complete credential-free http and https URLs become clickable links', () => {
  for (const value of ['', '//example.com', '/guide', 'javascript:alert(1)', 'data:text/html,hello', 'file:///tmp/example', 'https://name@example.com', 'https://name:password@example.com', 'https://example.com/\nroute', 'https://example.com/\u007froute', 'https://']) {
    assert.throws(() => normalizeGuideUrl(value), undefined, value);
  }
  assert.equal(guideSource('javascript:alert(1)'), 'Invalid web link');
});

test('personal link fields have bounded text and canonical vocation selections', () => {
  assert.deepEqual(cleanGuideDraft({ ...fields, title: '  Title  ', vocations: ['druid', 'knight', 'druid'], description: ' notes ', versionLabel: ' 7.7 ' }), {
    ...fields, title: 'Title', description: 'notes', versionLabel: '7.7', vocations: ['knight', 'druid'],
  });
  for (const patch of [{ title: '  ' }, { title: 'x'.repeat(161) }, { description: 'x'.repeat(1001) }, { versionLabel: 'x'.repeat(101) }, { kind: 'script' }, { vocations: ['unselected'] }]) {
    assert.throws(() => cleanGuideDraft({ ...fields, ...patch } as GuideDraft));
  }
});

test('editing one field preserves newer edits to other fields and source timestamps', () => {
  const current = { ...opening, description: 'Notes saved in another window.', vocations: ['druid'] as const };
  const links = [{ ...current, vocations: [...current.vocations] }];
  const next = editGuide(links, opening, { ...fields, title: 'Updated hunt title' }, '2026-10-30T12:00:00.000Z');
  assert.deepEqual(next, [{ ...links[0], title: 'Updated hunt title', updatedAt: '2026-10-30T12:00:00.000Z' }]);
  assert.equal(links[0].title, opening.title);
  assert.equal(editGuide(links, opening, fields, '2026-10-30T12:00:00.000Z'), links);
});

test('a stale editor cannot silently recreate a deleted personal link', () => {
  assert.throws(() => editGuide([], opening, { ...fields, title: 'New name' }, '2026-10-30T12:00:00.000Z'), /removed in another window/);
});

test('vocation filters include general guides while combining format and search terms', () => {
  assert.equal(guideMatches({ ...fields, vocations: [] }, { vocation: 'druid', kind: 'video', query: 'spears 7.7' }), true);
  assert.equal(guideMatches(fields, { vocation: 'druid' }), false);
  assert.equal(guideMatches(fields, { vocation: 'paladin', kind: 'article' }), false);
  assert.equal(guideMatches(fields, { query: 'unrelated' }), false);
});

test('curated resources keep valid distinct destinations and explicit historical context', () => {
  assert.equal(new Set(curatedGuides.map(guide => guide.id)).size, curatedGuides.length);
  for (const guide of curatedGuides) {
    assert.equal(cleanGuideDraft(guide).url, guide.url);
    assert.ok(guide.versionLabel && guide.context && guide.checkedAt);
    if (guide.provenanceUrl) assert.equal(normalizeGuideUrl(guide.provenanceUrl), guide.provenanceUrl);
  }
  const videos77 = curatedGuides.filter(guide => guide.kind === 'video' && guide.versionLabel.startsWith('7.7'));
  assert.ok(videos77.length >= 2);
  assert.ok(videos77.every(guide => guideSource(guide.url) === 'youtube.com'));
});
