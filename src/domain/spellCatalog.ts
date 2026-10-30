import { spells, type SpellRecord } from '../data/game';
import type { AppState } from '../types';

export const spellOverrideKey = (serverId: string, spellId: string) => `${serverId}::${spellId}`;

/** References stay immutable; each server's local overrides are applied at the point of use. */
export function effectiveSpell(state: AppState, serverId: string, spell: SpellRecord): SpellRecord {
  const override = state.spellOverrides?.[spellOverrideKey(serverId, spell.id)];
  return override ? { ...spell, ...override } : spell;
}

export function effectiveSpells(state: AppState, serverId: string): SpellRecord[] {
  return spells.map(spell => effectiveSpell(state, serverId, spell));
}
