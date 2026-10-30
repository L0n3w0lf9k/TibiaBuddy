import type { Vocation } from '../types';

export type PhysicalSkill = 'fist' | 'club' | 'sword' | 'axe' | 'distance' | 'shielding';
type SkillVocation = Exclude<Vocation, 'unselected'>;

export const PHYSICAL_SKILLS: { id: PhysicalSkill; label: string; baseTries: number }[] = [
  { id: 'axe', label: 'Axe fighting', baseTries: 50 },
  { id: 'sword', label: 'Sword fighting', baseTries: 50 },
  { id: 'club', label: 'Club fighting', baseTries: 50 },
  { id: 'fist', label: 'Fist fighting', baseTries: 50 },
  { id: 'distance', label: 'Distance fighting', baseTries: 30 },
  { id: 'shielding', label: 'Shielding', baseTries: 100 },
];

export const SKILL_LIMITS = { minimumLevel: 10, maximumLevel: 200, minimumRate: 0.01, maximumRate: 1000, minimumCycleSeconds: 2, maximumCycleSeconds: 60 } as const;
export const SKILL_MODEL_LABEL = 'Classic 7.72 reconstruction · ideal training estimate';
const RECONSTRUCTION = 'https://github.com/rodrigopaixaorj/tibia-gameserver-unified/blob/3c40e59fc480ca580377ac9b5a713ea62292ba8a';
export const SKILL_SOURCES: { id: string; title: string; url: string; note: string }[] = [
  { id: 'skill-curve', title: 'Advancement and percentage calculation', url: `${RECONSTRUCTION}/src/game/crskill.cc`,
    note: 'TSkillProbe uses a cumulative geometric total, truncated to an integer. This is a public 7.72 reconstruction, not an official 7.7 specification. The planner uses exact decimal multipliers; original binary arithmetic may differ at integer boundaries.' },
  { id: 'skill-vocations', title: 'Vocation factors and promotion', url: `${RECONSTRUCTION}/src/game/crplayer.cc`,
    note: 'SetProfession supplies the skill factors and base requirements. Promotion changes profession/soul without changing these growth curves.' },
  { id: 'skill-counting', title: 'Learning allowance and counted attacks', url: `${RECONSTRUCTION}/src/game/crcombat.cc`,
    note: 'A shared allowance of 30 learning points is refreshed by an outgoing hit that removes HP. Weapon and shield probes consume it. Distance uses one accuracy probe and another probe when the shot lands.' },
  { id: 'skill-cadence', title: 'Default attack and defense intervals', url: `${RECONSTRUCTION}/src/game/config.cc`,
    note: 'The reconstruction defaults both intervals to 2,000 ms. The planner assumes synchronized continuous cycles; changing the cycle models a custom server.' },
  { id: 'skill-start', title: 'Starting physical skill of 10', url: 'https://github.com/Ezzz-dev/OTHire/blob/1d9987cdbea118ad1a01a6f2bba66cc22c002d63/source/player.cpp',
    note: 'The separately version-labeled OTHire 7.72 implementation initializes physical skills at 10. Its per-level rounding and separate learning counters are not used by this planner.' },
];

// Values in tenths preserve the published decimal factors exactly.
const FACTORS: Record<SkillVocation, Record<PhysicalSkill, number>> = {
  knight: { fist: 11, club: 11, sword: 11, axe: 11, distance: 14, shielding: 11 },
  paladin: { fist: 12, club: 12, sword: 12, axe: 12, distance: 11, shielding: 11 },
  sorcerer: { fist: 15, club: 20, sword: 20, axe: 20, distance: 20, shielding: 15 },
  druid: { fist: 15, club: 18, sword: 18, axe: 18, distance: 18, shielding: 15 },
};
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

function validatePair(vocation: Vocation, skill: PhysicalSkill): asserts vocation is SkillVocation {
  if (vocation === 'unselected' || !Object.hasOwn(FACTORS, vocation)) throw new RangeError('Choose a character vocation before planning skills.');
  if (!PHYSICAL_SKILLS.some(item => item.id === skill)) throw new RangeError('Choose a supported physical skill.');
}

function validateLevel(level: number) {
  if (!Number.isInteger(level) || level < SKILL_LIMITS.minimumLevel || level > SKILL_LIMITS.maximumLevel) {
    throw new RangeError('Skill levels must be whole numbers from 10 to 200.');
  }
}

function safeNumber(value: bigint): number {
  if (value < 0n || value > MAX_SAFE) throw new RangeError('This target exceeds the calculator’s safe numeric range. Choose a lower target.');
  return Number(value);
}

/** Promotion leaves physical skill growth unchanged in the reconstruction. */
export function skillMultiplier(vocation: Vocation, skill: PhysicalSkill, promoted = false): number {
  validatePair(vocation, skill);
  void promoted;
  return FACTORS[vocation][skill] / 10;
}

/**
 * F(s) = floor(A * (b^(s−10) − 1) / (b − 1)).
 * Calculate the rational expression before rounding, rather than rounding each
 * increment or letting binary floating-point turn an exact integer into n−1.
 */
function cumulativeBig(vocation: Vocation, skill: PhysicalSkill, level: number): bigint {
  validatePair(vocation, skill);
  validateLevel(level);
  const exponent = BigInt(level - 10);
  if (exponent === 0n) return 0n;
  const base = BigInt(PHYSICAL_SKILLS.find(item => item.id === skill)!.baseTries);
  const numerator = BigInt(FACTORS[vocation][skill]), denominator = 10n;
  return base * (numerator ** exponent - denominator ** exponent)
    / (denominator ** (exponent - 1n) * (numerator - denominator));
}

export function cumulativeSkillTries(vocation: Vocation, skill: PhysicalSkill, level: number, promoted = false): number {
  void promoted;
  return safeNumber(cumulativeBig(vocation, skill, level));
}

/** Full raw training points for attained currentLevel → currentLevel + 1. */
export function requiredSkillTries(vocation: Vocation, skill: PhysicalSkill, currentLevel: number, promoted = false): number {
  void promoted;
  const current = cumulativeBig(vocation, skill, currentLevel);
  const next = cumulativeBig(vocation, skill, currentLevel + 1);
  safeNumber(next);
  return safeNumber(next - current);
}

/** Convert the supplied finite decimal number into a rational, including 1e−7. */
function decimalFraction(value: number): [bigint, bigint] {
  const match = String(value).match(/^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i)!;
  const fraction = match[2] ?? '';
  const digits = BigInt(match[1] + fraction);
  const exponent = Number(match[3] ?? 0) - fraction.length;
  return exponent >= 0 ? [digits * 10n ** BigInt(exponent), 1n] : [digits, 10n ** BigInt(-exponent)];
}

const ceilDivision = (numerator: bigint, denominator: bigint) => (numerator + denominator - 1n) / denominator;

function partialPoints(full: number, percentRemaining: number): number {
  const [numerator, denominator] = decimalFraction(percentRemaining);
  return safeNumber(ceilDivision(BigInt(full) * numerator, denominator * 100n));
}

export interface SkillTrainingInput {
  vocation: Vocation;
  promoted: boolean;
  skill: PhysicalSkill;
  currentLevel: number;
  percentRemaining: number;
  targetLevel: number;
  attackers: 1 | 2 | 3;
  cycleSeconds?: number;
  skillRate?: number;
  efficiencyPercent?: number;
  distancePointsPerShot?: 1 | 2;
}

export interface SkillTrainingRow {
  fromLevel: number;
  toLevel: number;
  fullTries: number;
  remainingTries: number;
  cumulativeTries: number;
  idealSeconds: number;
  estimatedSeconds: number | null;
}

export interface AttackerComparison {
  attackers: 1 | 2 | 3;
  countedAttackers: number;
  triesPerCycle: number;
  triesPerHour: number;
  idealSeconds: number;
  estimatedSeconds: number | null;
}

export interface SkillTrainingPlan {
  requiredTries: number;
  nextLevelTries: number;
  triesPerCycle: number;
  triesPerHour: number;
  idealTriesPerHour: number;
  idealSeconds: number;
  estimatedSeconds: number | null;
  rows: SkillTrainingRow[];
  attackerComparisons: AttackerComparison[];
  assumptions: string[];
  modelLabel: string;
}

export function planSkillTraining(input: SkillTrainingInput): SkillTrainingPlan {
  const { vocation, promoted, skill, currentLevel, targetLevel, percentRemaining, attackers } = input;
  validatePair(vocation, skill);
  validateLevel(currentLevel);
  validateLevel(targetLevel);
  if (targetLevel <= currentLevel) throw new RangeError('Target skill must be higher than the current skill.');
  if (!Number.isFinite(percentRemaining) || percentRemaining < 0 || percentRemaining > 100) throw new RangeError('Percent remaining must be between 0 and 100.');
  if (![1, 2, 3].includes(attackers)) throw new RangeError('Choose one, two, or three incoming creatures.');
  const cycleSeconds = input.cycleSeconds ?? 2;
  const skillRate = input.skillRate ?? 1;
  const efficiencyPercent = input.efficiencyPercent ?? 100;
  const distancePointsPerShot = input.distancePointsPerShot ?? 2;
  if (!Number.isFinite(cycleSeconds) || cycleSeconds < SKILL_LIMITS.minimumCycleSeconds || cycleSeconds > SKILL_LIMITS.maximumCycleSeconds) throw new RangeError('Cycle length must be from 2 to 60 seconds; faster cycles cannot bypass the classic defense interval.');
  if (!Number.isFinite(skillRate) || skillRate < SKILL_LIMITS.minimumRate || skillRate > SKILL_LIMITS.maximumRate) throw new RangeError('Skill rate must be from 0.01× to 1,000×.');
  if (!Number.isFinite(efficiencyPercent) || efficiencyPercent < 0 || efficiencyPercent > 100) throw new RangeError('Qualifying uptime must be between 0% and 100%.');
  if (distancePointsPerShot !== 1 && distancePointsPerShot !== 2) throw new RangeError('Distance shots must grant one or two modeled points.');

  // Guard the whole cumulative target, not just an individually safe interval.
  const targetCumulative = cumulativeBig(vocation, skill, targetLevel);
  safeNumber(targetCumulative);
  const [rateNumerator, rateDenominator] = decimalFraction(skillRate);
  const [efficiencyNumerator, efficiencyDenominator] = decimalFraction(efficiencyPercent);
  const pointsPerCycle = (incoming: number) => skill === 'shielding' ? Math.min(incoming, 2) : skill === 'distance' ? distancePointsPerShot : 1;

  function secondsFor(points: number, incoming: number, applyEfficiency: boolean): number | null {
    if (points === 0) return 0;
    if (applyEfficiency && efficiencyPercent === 0) return null;
    const numerator = BigInt(pointsPerCycle(incoming)) * rateNumerator * (applyEfficiency ? efficiencyNumerator : 100n);
    const denominator = rateDenominator * (applyEfficiency ? efficiencyDenominator : 1n) * 100n;
    const cycles = safeNumber(ceilDivision(BigInt(points) * denominator, numerator));
    const seconds = cycles * cycleSeconds;
    if (!Number.isFinite(seconds) || seconds > Number.MAX_SAFE_INTEGER) throw new RangeError('The resulting time is beyond the calculator’s safe range. Increase the rate or lower the target.');
    return seconds;
  }

  let requiredTries = 0, previousIdeal = 0, previousEstimated: number | null = 0;
  const rows: SkillTrainingRow[] = [];
  for (let level = currentLevel; level < targetLevel; level++) {
    const fullTries = requiredSkillTries(vocation, skill, level, promoted);
    const remainingTries = level === currentLevel ? partialPoints(fullTries, percentRemaining) : fullTries;
    requiredTries = safeNumber(BigInt(requiredTries) + BigInt(remainingTries));
    const currentIdeal = secondsFor(requiredTries, attackers, false)!;
    const currentEstimated = secondsFor(requiredTries, attackers, true);
    rows.push({ fromLevel: level, toLevel: level + 1, fullTries, remainingTries, cumulativeTries: requiredTries,
      idealSeconds: currentIdeal - previousIdeal,
      estimatedSeconds: currentEstimated === null || previousEstimated === null ? null : currentEstimated - previousEstimated });
    previousIdeal = currentIdeal;
    previousEstimated = currentEstimated;
  }

  const triesPerCycle = pointsPerCycle(attackers);
  const idealTriesPerHour = triesPerCycle * skillRate * 3600 / cycleSeconds;
  const attackerComparisons = ([1, 2, 3] as const).map(incoming => ({ attackers: incoming, countedAttackers: Math.min(incoming, 2),
    triesPerCycle: pointsPerCycle(incoming), triesPerHour: pointsPerCycle(incoming) * skillRate * 3600 / cycleSeconds * efficiencyPercent / 100,
    idealSeconds: secondsFor(requiredTries, incoming, false)!, estimatedSeconds: secondsFor(requiredTries, incoming, true) }));
  const assumptions = [
    `One outgoing attack every ${cycleSeconds} seconds; incoming creatures use the same cycle. Continuous contact and active learning are assumed.`,
    'Training points are progress credit, not HP damage. Occasional outgoing HP-damaging hits refresh a shared 30-point learning allowance; weapon attempts and shield checks consume it.',
    'Shielding requires an equipped shield and qualifying melee attacks. Two incoming creatures provide at most two shield checks per modeled cycle; a third does not make this estimate faster.',
    'Promotion does not change this skill-growth curve or attack cadence. Its regeneration benefits are separate.',
    'The entered percentage estimates progress through the current → next skill interval. Remaining points and time are rounded up; time counts full cycles after the start.',
    'Cumulative thresholds use the 7.72 reconstruction with exact decimal factors and floor rounding. This is not a certified 7.7 server measurement.',
  ];
  if (skill === 'distance') assumptions.push(distancePointsPerShot === 2
    ? 'Distance assumes every shot lands: one accuracy point plus one landed-shot point while learning is active. Armor may still absorb the HP damage; misses can grant fewer points.'
    : 'Distance uses one learning point per shot as the selected scenario. A landed shot can earn a second point; an exhausted learning allowance can earn none.');
  if (cycleSeconds !== 2) assumptions.push('The changed cycle length is a hypothetical custom-server cadence for both outgoing and incoming attacks.');
  if (efficiencyPercent !== 100) assumptions.push('Qualifying uptime is a supplied average allowance for interruptions or ineligible attempts, not a calculated hit chance.');
  if (targetCumulative > 2_147_483_647n) assumptions.push('This high-level projection exceeds the reconstruction’s 32-bit cumulative counter. Original server limits are not simulated.');

  return { requiredTries, nextLevelTries: rows[0].fullTries, triesPerCycle,
    triesPerHour: idealTriesPerHour * efficiencyPercent / 100, idealTriesPerHour,
    idealSeconds: previousIdeal, estimatedSeconds: previousEstimated, rows, attackerComparisons,
    assumptions, modelLabel: SKILL_MODEL_LABEL };
}
