import type { Vocation } from '../types';
import { planSkillTraining, type PhysicalSkill } from './skills';

export type WeaponSkill = Exclude<PhysicalSkill, 'shielding'>;
export interface TrainingGoal { currentLevel: number; percentRemaining: number; targetLevel: number }

/** Independent goals share elapsed time: they train together, rather than in sequence. */
export function simultaneousSkillTraining(input: {
  vocation: Vocation;
  promoted: boolean;
  skill: WeaponSkill;
  weapon: TrainingGoal;
  shielding: TrainingGoal;
  attackers: 1 | 2 | 3;
  skillRate?: number;
}) {
  const shared = { vocation: input.vocation, promoted: input.promoted, attackers: input.attackers,
    skillRate: input.skillRate ?? 1, cycleSeconds: 2, efficiencyPercent: 100, distancePointsPerShot: 2 as const };
  const weapon = planSkillTraining({ ...shared, ...input.weapon, skill: input.skill });
  const shielding = planSkillTraining({ ...shared, ...input.shielding, skill: 'shielding' });
  return { weapon, shielding, bothGoalsSeconds: Math.max(weapon.idealSeconds, shielding.idealSeconds),
    firstGoal: weapon.idealSeconds === shielding.idealSeconds ? 'together' as const
      : weapon.idealSeconds < shielding.idealSeconds ? 'weapon' as const : 'shielding' as const,
    attackers: ([1, 2, 3] as const).map(attackers => {
      const shield = shielding.attackerComparisons.find(row => row.attackers === attackers)!;
      return { attackers, weaponSeconds: weapon.idealSeconds, shieldingSeconds: shield.idealSeconds,
        bothGoalsSeconds: Math.max(weapon.idealSeconds, shield.idealSeconds), shieldPointsPerCycle: shield.triesPerCycle };
    }) };
}
