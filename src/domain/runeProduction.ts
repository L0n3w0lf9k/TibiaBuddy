import type { SpellRecord } from '../data/game';
import { runePlan } from './mechanics';

export type RuneResources = Omit<Parameters<typeof runePlan>[0], 'manaPerCast' | 'chargesPerObject' | 'soulPerCast'>;

/** Call with the server's effective spell so persisted recipe edits drive every output. */
export function runeBatchFromSpell(spell: Pick<SpellRecord, 'mana' | 'runeCharges' | 'soulCost'>, resources: RuneResources) {
  if (spell.mana === null || spell.runeCharges === null) return null;
  return runePlan({ ...resources, manaPerCast: spell.mana, chargesPerObject: spell.runeCharges, soulPerCast: spell.soulCost });
}
