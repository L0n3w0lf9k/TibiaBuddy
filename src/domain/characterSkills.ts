import type { Character } from '../types';

export type CombatSkill = 'axe' | 'sword' | 'club' | 'fist' | 'distance' | 'shielding';
export const COMBAT_SKILLS: { id: CombatSkill; label: string }[] = [
  { id: 'axe', label: 'Axe fighting' }, { id: 'sword', label: 'Sword fighting' },
  { id: 'club', label: 'Club fighting' }, { id: 'distance', label: 'Distance fighting' },
  { id: 'shielding', label: 'Shielding' }, { id: 'fist', label: 'Fist fighting' },
];
export function characterSkill(character: Character, skill: CombatSkill): number {
  if (skill === 'axe') return character.axeSkill ?? character.meleeSkill;
  if (skill === 'sword') return character.swordSkill ?? character.meleeSkill;
  if (skill === 'club') return character.clubSkill ?? character.meleeSkill;
  if (skill === 'fist') return character.fistSkill ?? 10;
  return skill === 'distance' ? character.distanceSkill : character.shieldingSkill;
}
