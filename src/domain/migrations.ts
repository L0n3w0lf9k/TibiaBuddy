import type { AppState } from '../types';

/** Additive upgrade: preserve the journal and every existing server customization. */
export function upgradeJournal(source: AppState): { state: AppState; changed: boolean } {
  const needsSkills = source.characters.some(c => c.axeSkill === undefined || c.swordSkill === undefined || c.clubSkill === undefined || c.fistSkill === undefined);
  if (!needsSkills && source.spellOverrides !== undefined) return { state: source, changed: false };
  const state = structuredClone(source);
  for (const character of state.characters) {
    character.axeSkill ??= character.meleeSkill;
    character.swordSkill ??= character.meleeSkill;
    character.clubSkill ??= character.meleeSkill;
    character.fistSkill ??= 10;
  }
  state.spellOverrides ??= {};
  return { state, changed: true };
}
