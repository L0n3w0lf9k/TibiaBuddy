/**
 * Literal model of the pinned public 7.72 community reconstruction.
 * This is not an official 7.7 specification. In particular, its author flags
 * uncertainty around decompiling the two-roll random factor in ProbeValue.
 */
export type AttackMode = 'offensive' | 'balanced' | 'defensive';
export type ProjectileKind = 'launcher' | 'thrown';

export const ATTACK_MODES: { id: AttackMode; label: string }[] = [
  { id: 'offensive', label: 'Full attack' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'defensive', label: 'Full defense' },
];

const revision = '3c40e59fc480ca580377ac9b5a713ea62292ba8a';
const sourceRoot = `https://github.com/rodrigopaixaorj/tibia-gameserver-unified/blob/${revision}/src/game/`;
export const CLASSIC_COMBAT_SOURCES = {
  revision,
  label: '7.72 reconstruction',
  combat: sourceRoot + 'crcombat.cc',
  skills: sourceRoot + 'crskill.cc',
  mitigation: sourceRoot + 'crmain.cc',
  magic: sourceRoot + 'magic.cc',
  random: sourceRoot + 'utils.cc',
  fist: 'https://realotsblog.wordpress.com/2015/09/30/realots-monster-strategies/',
  burst: 'https://github.com/joseluis2g/TVP-primeiro/blob/05b92a5bf0fba85e4a5d6f000ec736eef3be6ce6/gameserver/data/scripts/weapons/burst_arrow.lua',
  burstHelper: 'https://github.com/joseluis2g/TVP-primeiro/blob/05b92a5bf0fba85e4a5d6f000ec736eef3be6ce6/gameserver/data/scripts/functions.lua#L481-L495',
  decompilation: 'https://otland.net/threads/tibia-7-7-server-decompiled.296811/',
  laterChanges: 'https://www.tibia.com/news/?id=528&subtopic=newsarchive',
};

const validSkill = (skill: number) => Number.isInteger(skill) && skill >= 0 && skill <= 300;
const validAttack = (attack: number) => Number.isInteger(attack) && attack >= 0 && attack <= 1000;

/** C++ integer division adjusts the attribute BEFORE multiplying by skill. */
export function adjustedWeaponAttack(attack: number, mode: AttackMode): number | null {
  if (!validAttack(attack)) return null;
  if (mode === 'offensive') return attack + Math.floor(attack * 2 / 10);
  if (mode === 'defensive') return attack - Math.floor(attack * 4 / 10);
  return mode === 'balanced' ? attack : null;
}

export interface ClassicWeaponRange {
  min: number;
  max: number;
  adjustedAttack: number;
}

/**
 * ProbeValue: floor(R * adjustedAttack * (5 * skill + 50) / 10000),
 * where R = floor((U + V) / 2) and U,V each range from 0 to 99.
 * The range is 0..99, not 0..100. No character-level bonus is introduced.
 */
export function classicWeaponRange(skill: number, attack: number, mode: AttackMode = 'offensive'): ClassicWeaponRange | null {
  const adjustedAttack = adjustedWeaponAttack(attack, mode);
  if (!validSkill(skill) || adjustedAttack === null) return null;
  return { min: 0, max: Math.floor(99 * adjustedAttack * (5 * skill + 50) / 10000), adjustedAttack };
}

/**
 * Projectile accuracy, before target armor, immunity or other mitigation.
 * The source uses base Act, not boosted Get(), for its accuracy skill check.
 * It tests Act >= rand()%D and rand()%100 <= nominalChance. Thus the literal
 * source has 91/100 or 76/100 favorable projectile outcomes, not 90/100 or
 * 75/100. We assume uniform modulo outcomes; platform RNG bias is not modeled.
 * A null result means invalid input or an out-of-range attack, never 0% damage.
 */
export function classicDistanceAccuracy(skill: number, tiles: number, kind: ProjectileKind, maxRange: number): number | null {
  if (!validSkill(skill) || !Number.isInteger(tiles) || tiles < 1 || tiles > 7
    || !Number.isInteger(maxRange) || maxRange < 1 || maxRange > 7 || tiles > maxRange
    || !['launcher', 'thrown'].includes(kind)) return null;
  const difficulty = 15 * (tiles >= 2 ? tiles : 5);
  const skillChance = Math.min((skill + 1) / difficulty, 1);
  const projectileChance = kind === 'launcher' ? 91 / 100 : 76 / 100;
  return skillChance * projectileChance;
}

/**
 * Reconstructed pre-8.0 Burst Arrow explosion, independent of distance skill
 * and fight mode. TVP's pinned script supplies ComputeDamage(30,30); the old
 * engine scales a base roll 0..60 by (2L+3ML)/100 with no minimum-power floor.
 * Only endpoints are returned; no probability distribution is asserted.
 */
export function classicBurstRange(level: number, magicLevel: number): { min: number; max: number; power: number } | null {
  if (!Number.isInteger(level) || level < 1 || level > 2000
    || !Number.isInteger(magicLevel) || magicLevel < 0 || magicLevel > 200) return null;
  const power = 2 * level + 3 * magicLevel;
  return { min: 0, max: Math.floor(60 * power / 100), power };
}
