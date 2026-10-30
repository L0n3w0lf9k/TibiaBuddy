import type { Character } from '../types';
import { checkXP, xpFromRemaining, xpProgress } from './xp';

export type ProfileXPMode = 'exact' | 'percentage';

const editableFields = ['vocation', 'promoted', 'premium', 'magicLevel', 'magicPercentRemaining', 'goalML',
  'axeSkill', 'swordSkill', 'clubSkill', 'fistSkill', 'distanceSkill', 'shieldingSkill', 'fishingSkill'] as const;

/** Merge the dialog's edits into the latest journal, preserving changes made elsewhere.
 * Experience is one dependent group, and is recomputed only when its inputs or mode changed.
 * The opening snapshot is normalized in the same way as the editable draft. */
export function mergeProfileEdits(latest: Character, opening: Character, draft: Character, xpMode: ProfileXPMode): Character {
  if (latest.id !== opening.id || draft.id !== opening.id) throw new Error('The character being edited no longer matches this profile.');
  const next = { ...latest };
  const name = draft.name.trim();
  if (!name) throw new Error('Give your character a name.');
  if (name !== opening.name.trim()) next.name = name;
  const copyIfChanged = <K extends keyof Character>(key: K) => {
    if (!Object.is(draft[key], opening[key])) next[key] = draft[key];
  };
  editableFields.forEach(copyIfChanged);

  const openingMode: ProfileXPMode = opening.xpEstimated ? 'percentage' : 'exact';
  const xpEdited = xpMode !== openingMode || (xpMode === 'exact'
    ? draft.xp !== opening.xp
    : draft.level !== opening.level || draft.percentRemaining !== opening.percentRemaining);
  if (xpEdited) {
    const xp = xpMode === 'exact' ? checkXP(draft.xp) : xpFromRemaining(draft.level, draft.percentRemaining);
    const progress = xpProgress(xp);
    Object.assign(next, { xp, level: progress.level, percentRemaining: 100 - progress.percent, xpEstimated: xpMode === 'percentage' });
  }

  // An explicit promotion also selects premium, even if another tab just disabled it.
  if (draft.promoted !== opening.promoted && draft.promoted && next.vocation !== 'unselected') next.premium = true;
  if (next.vocation === 'unselected' || !next.premium) next.promoted = false;
  return next;
}
