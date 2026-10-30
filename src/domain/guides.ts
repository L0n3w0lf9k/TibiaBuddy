import type { GuideKind, GuideLink, Vocation } from '../types';

export type GuideVocation = Exclude<Vocation, 'unselected'>;
export type GuideDraft = Omit<GuideLink, 'id' | 'createdAt' | 'updatedAt'>;
export const guideVocations: { id: GuideVocation; label: string }[] = [
  { id: 'knight', label: 'Knight' }, { id: 'paladin', label: 'Paladin' },
  { id: 'sorcerer', label: 'Sorcerer' }, { id: 'druid', label: 'Druid' },
];
export const guideKinds: { id: GuideKind; label: string }[] = [
  { id: 'article', label: 'Written guide' }, { id: 'video', label: 'Video' }, { id: 'reference', label: 'Reference' },
];

/** Only ordinary web links are accepted. Queries and fragments remain intact. */
export function normalizeGuideUrl(value: string): string {
  if (typeof value !== 'string' || /[\u0000-\u001f\u007f-\u009f]/.test(value)) {
    throw new Error('Use a web address without control characters.');
  }
  const text = value.trim();
  if (!text || text.length > 2048 || !/^https?:\/\//i.test(text)) {
    throw new Error('Enter a complete http:// or https:// web address, up to 2,048 characters.');
  }
  let url: URL;
  try { url = new URL(text); } catch { throw new Error('Enter a valid web address.'); }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
    throw new Error('Use an http:// or https:// link without an embedded username or password.');
  }
  if (url.href.length > 2048) throw new Error('The web address must be 2,048 characters or shorter.');
  return url.href;
}

export function guideSource(url: string): string {
  try { return new URL(normalizeGuideUrl(url)).hostname.replace(/^www\./, ''); }
  catch { return 'Invalid web link'; }
}

export function cleanGuideDraft(draft: GuideDraft): GuideDraft {
  const title = draft.title.trim(), description = draft.description.trim(), versionLabel = draft.versionLabel.trim();
  if (!title || title.length > 160) throw new Error('Give this link a title of 1–160 characters.');
  if (description.length > 1000) throw new Error('Notes must be 1,000 characters or shorter.');
  if (versionLabel.length > 100) throw new Error('The version or server label must be 100 characters or shorter.');
  if (!guideKinds.some(kind => kind.id === draft.kind)) throw new Error('Choose a written guide, video or reference.');
  if (!Array.isArray(draft.vocations) || draft.vocations.some(v => !guideVocations.some(option => option.id === v))) throw new Error('Choose from the four supported vocations.');
  return { title, description, versionLabel, url: normalizeGuideUrl(draft.url), kind: draft.kind, vocations: guideVocations.filter(v => draft.vocations.includes(v.id)).map(v => v.id) };
}

/** Save only fields the editor changed, retaining concurrent edits to other fields. */
export function editGuide(links: GuideLink[], initial: GuideLink, values: GuideDraft, now: string): GuideLink[] {
  const clean = cleanGuideDraft(values);
  const current = links.find(link => link.id === initial.id);
  if (!current) throw new Error('This link was removed in another window. Close the editor and add it again if needed.');
  const patch: Partial<GuideDraft> = {};
  for (const key of ['title', 'url', 'description', 'kind', 'versionLabel'] as const) {
    if (clean[key] !== initial[key]) Object.assign(patch, { [key]: clean[key] });
  }
  if ([...clean.vocations].sort().join(',') !== [...initial.vocations].sort().join(',')) patch.vocations = clean.vocations;
  if (!Object.keys(patch).length) return links;
  return links.map(link => link.id === initial.id ? { ...link, ...patch, updatedAt: now } : link);
}

export function guideMatches(guide: GuideDraft & { tags?: string[]; sourceLabel?: string }, filter: { query?: string; kind?: GuideKind | 'all'; vocation?: GuideVocation | 'all' }): boolean {
  if (filter.kind && filter.kind !== 'all' && guide.kind !== filter.kind) return false;
  if (filter.vocation && filter.vocation !== 'all' && guide.vocations.length && !guide.vocations.includes(filter.vocation)) return false;
  const terms = (filter.query || '').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const text = [guide.title, guide.description, guide.versionLabel, guide.sourceLabel, guideSource(guide.url), ...guide.vocations, ...(guide.tags || [])].join(' ').toLocaleLowerCase();
  return terms.every(term => text.includes(term));
}
