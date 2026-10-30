import weaponData from '../data/meleeWeapons.json';
import { spells, type SpellRecord } from '../data/game';
import { catalogItems, overrideKey } from './catalog';
import { meleePeak, SPELL_MODELS, spellRange, type SpellModel } from './mechanics';
import type { CombatSkill } from './characterSkills';
import type { AppState, Character, Item } from '../types';

export type CombatSkillInputs = Record<CombatSkill, number>;
export type MeleeWeaponSkill = 'axe' | 'sword' | 'club';
export type CombatSpellGroupId = 'attack-spells' | 'healing-spells' | 'rune-damage' | 'rune-healing';

export const COMBAT_SPELL_GROUPS: { id: CombatSpellGroupId; title: string; description: string }[] = [
  { id: 'attack-spells', title: 'Attack spells', description: 'Instant damage spells, before target mitigation.' },
  { id: 'healing-spells', title: 'Healing spells', description: 'Instant healing before the target’s missing-HP limit.' },
  { id: 'rune-damage', title: 'Rune damage', description: 'Damage from using an existing rune charge.' },
  { id: 'rune-healing', title: 'Rune healing', description: 'Healing from using an existing rune charge.' },
];

export interface MeleeWeaponReference {
  id: string;
  name: string;
  skill: MeleeWeaponSkill;
  attack: number;
  sourceUrl: string;
  sourceVersion: string;
  sourceSha256: string;
}

export const MELEE_WEAPONS = weaponData.weapons as MeleeWeaponReference[];
export const WEAPON_REFERENCE = { url: weaponData.source, version: weaponData.version, date: weaponData.retrievedOn };
const alphabetical = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
const normalized = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Stable action-to-reference association; local spell edits never change the damage formula. */
const referenceIds = new Map(SPELL_MODELS.map(model => {
  const reference = spells.find(spell => spell.words.trim().toLowerCase() === model.words)
    ?? (model.id === 'heal-friend' ? spells.find(spell => spell.words.toLowerCase().startsWith('exura sio')) : undefined);
  return [model.id, reference?.id];
}));

export function spellReference(model: SpellModel, references: SpellRecord[] = spells): SpellRecord | undefined {
  return references.find(reference => reference.id === referenceIds.get(model.id));
}

export function combatSpellRange(model: SpellModel, level: number, magicLevel: number) {
  return Number.isInteger(level) && level >= 1 && level <= 2000
    && Number.isInteger(magicLevel) && magicLevel >= 0 && magicLevel <= 200
    ? spellRange(model, level, magicLevel) : null;
}

export function combatSpellGroup(model: SpellModel): CombatSpellGroupId {
  return model.type === 'rune'
    ? model.category === 'healing' ? 'rune-healing' : 'rune-damage'
    : model.category === 'healing' ? 'healing-spells' : 'attack-spells';
}

export interface CombatSpellRow {
  id: string;
  name: string;
  model: SpellModel;
  reference?: SpellRecord;
  range: ReturnType<typeof spellRange>;
}

export function spellOverviewGroups(level: number, magicLevel: number, references: SpellRecord[] = spells) {
  return COMBAT_SPELL_GROUPS.map(group => ({ ...group,
    rows: SPELL_MODELS.filter(model => combatSpellGroup(model) === group.id).map(model => {
      const reference = spellReference(model, references);
      return { id: model.id, name: reference?.name ?? model.name, model, reference, range: combatSpellRange(model, level, magicLevel) };
    }).sort((a, b) => alphabetical.compare(a.name, b.name)),
  }));
}

export interface SpellRequirementCheck {
  status: 'blocked' | 'partial' | 'listed';
  title: string;
  failures: string[];
  unchecked: string[];
}

/** Rune creation restrictions do not gate using a rune already in inventory. */
export function spellRequirementCheck(model: SpellModel, reference: SpellRecord | undefined,
  character: Pick<Character, 'vocation' | 'promoted' | 'premium'>, level: number, magicLevel: number): SpellRequirementCheck {
  const failures: string[] = [], unchecked: string[] = [];
  const validLevel = Number.isInteger(level) && level >= 1 && level <= 2000;
  const validMagic = Number.isInteger(magicLevel) && magicLevel >= 0 && magicLevel <= 200;
  if (!reference) unchecked.push('Complete use requirements are not available in the reference.');
  else if (model.type === 'rune') {
    if (reference.useMagicLevel === null) unchecked.push('Rune-use magic level is not confirmed.');
    else if (!validMagic) unchecked.push('Enter a valid magic level to check rune use.');
    else if (magicLevel < reference.useMagicLevel) failures.push(`Requires magic level ${reference.useMagicLevel} to use.`);
    if (reference.useLevel === null) unchecked.push('The historical rune-use character-level rule is not confirmed.');
    else if (!validLevel) unchecked.push('Enter a valid character level to check rune use.');
    else if (level < reference.useLevel) failures.push(`Requires character level ${reference.useLevel} to use.`);
  } else {
    if (reference.vocations === null) unchecked.push('Allowed vocations are not confirmed.');
    else if (character.vocation === 'unselected') unchecked.push('Choose a character vocation to check access.');
    else if (!reference.vocations.includes(character.vocation)) failures.push('Not listed for your character’s vocation.');
    if (reference.level === null) unchecked.push('Required character level is not confirmed.');
    else if (!validLevel) unchecked.push('Enter a valid character level to check access.');
    else if (level < reference.level) failures.push(`Requires character level ${reference.level}.`);
    if (reference.premium === true && !character.premium) failures.push('Requires a premium account.');
    if (reference.promotion === true && !character.promoted) failures.push('Requires promotion.');
    if (reference.premium === null || reference.promotion === null) unchecked.push('Some account or promotion conditions are not confirmed.');
  }
  return { status: failures.length ? 'blocked' : unchecked.length ? 'partial' : 'listed',
    title: failures.length ? 'Not met' : unchecked.length ? 'Partial check' : 'Listed checks met', failures, unchecked };
}

export interface MeleeOverviewRow extends Omit<MeleeWeaponReference, 'attack'> {
  attack: number | null;
  inputSkill: number;
  rawMaximum: number | null;
  catalogItemId?: string;
  attackSource: 'reference' | 'catalog' | 'override';
}

function matchingItem(reference: MeleeWeaponReference, items: Item[], state: AppState) {
  const key = normalized(reference.id);
  const exact = items.find(item => normalized(item.id.replace(/^fibula:item:/, '')) === key);
  if (exact) return exact;
  return items.find(item => {
    const original = state.items.find(candidate => candidate.id === item.id);
    return [item.name, ...item.aliases, original?.name ?? '', ...(original?.aliases ?? [])].some(name => normalized(name) === key);
  });
}

/** Known weapon classes come from source properties, never a guess based on an item's name. */
export function meleeOverview(state: AppState, serverId: string, skills: CombatSkillInputs): MeleeOverviewRow[] {
  const items = catalogItems(state, serverId);
  return MELEE_WEAPONS.map(reference => {
    const item = matchingItem(reference, items, state);
    const override = item ? state.itemOverrides[overrideKey(serverId, item.id)] : undefined;
    const attackEdited = override !== undefined && Object.hasOwn(override, 'attack');
    const attackSource = attackEdited ? 'override' : item?.attack != null ? 'catalog' : 'reference';
    const attack = attackEdited ? item?.attack ?? null : item?.attack ?? reference.attack;
    const inputSkill = skills[reference.skill];
    const rawMaximum = Number.isInteger(inputSkill) && inputSkill >= 0 && inputSkill <= 300
      && attack !== null && Number.isFinite(attack) && attack > 0 && attack <= 1000
      ? meleePeak(inputSkill, attack) : null;
    return { ...reference, name: item?.name ?? reference.name, attack, inputSkill, rawMaximum,
      catalogItemId: item?.id, attackSource } as MeleeOverviewRow;
  }).sort((a, b) => alphabetical.compare(a.name, b.name));
}
